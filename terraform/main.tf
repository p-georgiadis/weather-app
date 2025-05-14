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

# Install Tekton Pipelines using Helm
resource "helm_release" "tekton_pipelines" {
  name       = "tekton-pipelines"
  repository = "https://tektoncd.github.io/charts"
  chart      = "tekton-pipeline"
  namespace  = "tekton-pipelines"
  create_namespace = true
  version    = "0.5.0"  # Check for the latest version

  depends_on = [module.eks]
}

# Install Tekton Dashboard using Helm
resource "helm_release" "tekton_dashboard" {
  name       = "tekton-dashboard"
  repository = "https://tektoncd.github.io/charts"
  chart      = "tekton-dashboard"
  namespace  = "tekton-pipelines"
  version    = "0.5.0"  # Check for the latest version

  depends_on = [helm_release.tekton_pipelines]
}

# Install Helm upgrade task for Tekton
# Install Helm upgrade task for Tekton
resource "kubernetes_manifest" "tekton_helm_task" {
  manifest = {
    apiVersion = "tekton.dev/v1beta1"
    kind       = "Task"
    metadata = {
      name      = "helm-upgrade-from-source"
      namespace = "tekton-pipelines"
    }
    spec = {
      workspaces = [
        {
          name = "source"
          description = "The workspace consisting of helm chart."
        }
      ]
      params = [
        {
          name = "charts_dir"
          description = "The directory in source that contains the helm chart"
          type = "string"
          default = "."
        },
        {
          name = "release_name"
          description = "The name of the helm release"
          type = "string"
          default = ""
        },
        {
          name = "release_namespace"
          description = "The namespace of the helm release"
          type = "string"
          default = "default"
        },
        {
          name = "install_only_if_missing"
          description = "If true, install will be performed only if the release is not already present"
          type = "string"
          default = "false"
        },
        {
          name = "helm_image"
          description = "The helmImage to run this task"
          type = "string"
          default = "alpine/helm:3.11.1"
        },
        {
          name = "chart_values"
          description = "Additional chart values to be passed to helm upgrade command"
          type = "array"
          default = []
        }
      ]
      steps = [
        {
          name = "helm-upgrade"
          image = "$(params.helm_image)"
          script = <<-EOF
            set -e

            if [ "$(params.install_only_if_missing)" == "true" ] && [ "$(params.release_name)" != "" ]; then
              HELM_RELEASE=$(helm list --namespace $(params.release_namespace) --filter "^$(params.release_name)$" --output json 2>/dev/null)
              if [ "$HELM_RELEASE" != "[]" ]; then
                echo "Helm release $(params.release_name) already exists in namespace $(params.release_namespace)"
                exit 0
              fi
            fi

            CHART_VALUES_ARGS=""
            for chart_value in $(params.chart_values); do
              CHART_VALUES_ARGS="$${CHART_VALUES_ARGS} --values=$${chart_value}"
            done

            cd $(workspaces.source.path)
            helm dependency update $(params.charts_dir)

            if [ "$(params.release_name)" != "" ]; then
              helm upgrade --install $(params.release_name) $(params.charts_dir) \
                --namespace $(params.release_namespace) \
                --create-namespace \
                $${CHART_VALUES_ARGS}
            else
              helm upgrade --install $(params.charts_dir) \
                --namespace $(params.release_namespace) \
                --create-namespace \
                $${CHART_VALUES_ARGS}
            fi
          EOF
          workingDir = "$(workspaces.source.path)"
          volumeMounts = []
        }
      ]
    }
  }
  depends_on = [helm_release.tekton_pipelines]
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

    storage_class_name = "gp2"  # Using same storage class as your app
  }

  # Make sure the namespace exists before creating the PVC
  depends_on = [
    helm_release.tekton_pipelines
  ]
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
