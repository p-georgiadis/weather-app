terraform {
  cloud {
    organization = "p-georgiadis"
    workspaces {
      name = "weather-app"
    }
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.12"
    }
    time = {
      source  = "hashicorp/time"
      version = "~> 0.9.1"
    }
  }
}

provider "aws" {
  region = "eu-north-1"
}

# Configure the Kubernetes provider to use EKS credentials
provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)
  token                  = data.aws_eks_cluster_auth.cluster.token

  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args = [
      "eks",
      "get-token",
      "--cluster-name",
      module.eks.cluster_id,
      "--region",
      "eu-north-1"
    ]
  }
}

provider "helm" {
  kubernetes {
    host                   = module.eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)
    token                  = data.aws_eks_cluster_auth.cluster.token
    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      command     = "aws"
      args = [
        "eks",
        "get-token",
        "--cluster-name",
        module.eks.cluster_id,
        "--region",
        "eu-north-1"
      ]
    }
  }
}

# VPC for EKS
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "weather-app-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["eu-north-1a", "eu-north-1b", "eu-north-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = true
  enable_dns_hostnames = true

  public_subnet_tags = {
    "kubernetes.io/cluster/weather-app-cluster" = "shared"
    "kubernetes.io/role/elb"                    = "1"
  }

  private_subnet_tags = {
    "kubernetes.io/cluster/weather-app-cluster" = "shared"
    "kubernetes.io/role/internal-elb"           = "1"
  }
}

# IAM role for EKS cluster access
resource "aws_iam_role" "eks_cluster_role" {
  name = "weather-app-eks-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

# IAM policy for Secrets Manager access - to access your existing secret
resource "aws_iam_policy" "secrets_manager_access" {
  name        = "weather-app-secrets-access"
  description = "Policy to allow access to specific AWS Secrets Manager secrets"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Effect   = "Allow"
        Resource = "arn:aws:secretsmanager:eu-north-1:595965639663:secret:weather-app/api-key-3CRiZv"
      }
    ]
  })
}

# IRSA for Secrets Manager
module "irsa_secrets_manager" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-assumable-role-with-oidc"
  version = "5.39.0"

  create_role                   = true
  role_name                     = "weather-app-secrets-role"
  provider_url                  = module.eks.oidc_provider
  role_policy_arns              = [aws_iam_policy.secrets_manager_access.arn]
  oidc_fully_qualified_subjects = ["system:serviceaccount:weather-app:weather-app-sa"]
}

# Create namespace for External Secrets
resource "kubernetes_namespace" "external_secrets" {
  metadata {
    name = "external-secrets"
  }

  depends_on = [module.eks]
}

# Install External Secrets Operator via Helm
resource "helm_release" "external_secrets" {
  name       = "external-secrets"
  repository = "https://charts.external-secrets.io"
  chart      = "external-secrets"
  namespace  = kubernetes_namespace.external_secrets.metadata[0].name
  version    = "0.9.9"  # Check for latest version

  set {
    name  = "installCRDs"
    value = "true"
  }

  depends_on = [kubernetes_namespace.external_secrets]
}

# Attach required policies to the EKS cluster role
resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster_role.name
}

# IAM role for your personal access (CLI/Console)
resource "aws_iam_role" "eks_user_access" {
  name = "weather-app-eks-user-access"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:sts::595965639663:assumed-role/AWSReservedSSO_AdministratorAccess_7f59a57331a3dae9/panog792"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

# Attach policies to the user access role
resource "aws_iam_role_policy_attachment" "eks_user_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_user_access.name
}

resource "aws_iam_role_policy_attachment" "eks_console_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSConsolePolicy"
  role       = aws_iam_role.eks_user_access.name
}

# EBS CSI Driver Policy
data "aws_iam_policy" "ebs_csi_policy" {
  arn = "arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy"
}

data "aws_eks_cluster_auth" "cluster" {
  name = module.eks.cluster_name
  depends_on = [module.eks]
}

# EKS Cluster with managed node groups
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "20.8.5"

  cluster_name    = "weather-app-cluster"
  cluster_version = "1.29"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  cluster_endpoint_public_access = true

  # Use the IAM role we created
  create_iam_role = false
  iam_role_arn = aws_iam_role.eks_cluster_role.arn

  # Enable OIDC provider for the cluster (needed for IRSA)
  enable_irsa = true

  # Define node groups within the main EKS module
  eks_managed_node_groups = {
    main = {
      min_size      = 1
      max_size      = 3
      desired_size  = 2
      instance_types = ["t3.small"]
      capacity_type = "ON_DEMAND"
    }
  }
}

module "eks_aws-auth" {
  source  = "terraform-aws-modules/eks/aws//modules/aws-auth"
  version = "20.36.0"

  manage_aws_auth_configmap = true
  aws_auth_roles = [
    {
      rolearn  = aws_iam_role.eks_user_access.arn
      username = "eks-user-access"
      groups   = ["system:masters"]
    },
    {
      rolearn  = "arn:aws:sts::595965639663:assumed-role/AWSReservedSSO_AdministratorAccess_7f59a57331a3dae9/panog792"
      username = "panog792-sso-user"
      groups   = ["system:masters"]
    }
  ]
}

# IRSA for EBS CSI Driver
module "irsa_ebs_csi" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-assumable-role-with-oidc"
  version = "5.39.0"

  create_role                   = true
  role_name                     = "AmazonEKSTFEBSCSIRole-${module.eks.cluster_name}"
  provider_url                  = module.eks.oidc_provider
  role_policy_arns              = [data.aws_iam_policy.ebs_csi_policy.arn]
  oidc_fully_qualified_subjects = ["system:serviceaccount:kube-system:ebs-csi-controller-sa"]
}

# EKS Add-on for EBS CSI Driver
resource "aws_eks_addon" "ebs_csi_driver" {
  cluster_name             = module.eks.cluster_name
  addon_name               = "aws-ebs-csi-driver"
  addon_version            = "v1.25.0-eksbuild.1" # Check for the latest version
  service_account_role_arn = module.irsa_ebs_csi.iam_role_arn

  depends_on = [
    module.eks,
    module.irsa_ebs_csi
  ]
}

resource "aws_ecr_repository" "weather_app" {
  name                 = "weather-app"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "kubernetes_namespace" "weather_app" {
  metadata {
    name = "weather-app"
  }

  depends_on = [module.eks]
}

# Create Tekton Pipelines namespace
resource "kubernetes_namespace" "tekton_pipelines" {
  metadata {
    name = "tekton-pipelines"
  }

  depends_on = [module.eks]
}

resource "aws_iam_policy" "ecr_push_policy" {
  name        = "weather-app-ecr-push-policy"
  description = "Policy to allow pushing to ECR"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:CompleteLayerUpload",
          "ecr:GetAuthorizationToken",
          "ecr:InitiateLayerUpload",
          "ecr:PutImage",
          "ecr:UploadLayerPart"
        ]
        Resource = "${aws_ecr_repository.weather_app.arn}"
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "kubernetes_service_account" "tekton_sa" {
  metadata {
    name      = "tekton-build-sa"
    namespace = "tekton-pipelines"
    annotations = {
      "eks.amazonaws.com/role-arn" = module.irsa_tekton_ecr.iam_role_arn
    }
  }

  depends_on = [kubernetes_namespace.tekton_pipelines]
}

# Create a PVC for Tekton pipelines workspace
resource "kubernetes_persistent_volume_claim" "tekton_workspace_pvc" {
  metadata {
    name      = "weather-app-workspace"
    namespace = "tekton-pipelines"
  }

  spec {
    access_modes = ["ReadWriteOnce"]

    resources {
      requests = {
        storage = "5Gi"
      }
    }

    storage_class_name = "gp3"  # Changed from gp2 to gp3 for better performance
  }

  # Make sure the namespace exists before creating the PVC
  depends_on = [kubernetes_namespace.tekton_pipelines]
}

module "irsa_tekton_ecr" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-assumable-role-with-oidc"
  version = "5.39.0"

  create_role                   = true
  role_name                     = "tekton-ecr-role"
  provider_url                  = module.eks.oidc_provider
  role_policy_arns              = [aws_iam_policy.ecr_push_policy.arn]
  oidc_fully_qualified_subjects = ["system:serviceaccount:tekton-pipelines:tekton-build-sa"]
}

output "ecr_repository_url" {
  value = aws_ecr_repository.weather_app.repository_url
  description = "The URL of the ECR repository"
}

output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "kubectl_config_command" {
  description = "Command to update kubeconfig"
  value       = "aws eks update-kubeconfig --region eu-north-1 --name ${module.eks.cluster_id}"
}

output "eks_user_access_role_arn" {
  description = "ARN of the IAM role for user access to EKS"
  value       = aws_iam_role.eks_user_access.arn
}

output "kubectl_config_command_with_role" {
  description = "Command to update kubeconfig with the user access role"
  value       = "aws eks update-kubeconfig --region eu-north-1 --name ${module.eks.cluster_id} --role-arn ${aws_iam_role.eks_user_access.arn}"
}