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
      version = "~> 2.36"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.12"
    }
    time = {
      source  = "hashicorp/time"
      version = "~> 0.9.1"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.2.0"
    }
  }
}

provider "aws" {
  region = "eu-north-1"
}

################################################################################
# VPC for EKS
################################################################################
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name                  = "weather-app-vpc"
  cidr                  = "10.0.0.0/16"
  azs                   = ["eu-north-1a", "eu-north-1b", "eu-north-1c"]
  private_subnets       = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets        = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
  enable_nat_gateway    = true
  single_nat_gateway    = true
  enable_dns_hostnames  = true

  public_subnet_tags = {
    "kubernetes.io/cluster/weather-app-cluster" = "shared"
    "kubernetes.io/role/elb"                    = "1"
  }

  private_subnet_tags = {
    "kubernetes.io/cluster/weather-app-cluster" = "shared"
    "kubernetes.io/role/internal-elb"           = "1"
  }
}

################################################################################
# ECR Repository
################################################################################
module "ecr" {
  source = "terraform-aws-modules/ecr/aws"

  repository_name = "weather-app"

  # Set to MUTABLE to allow image tag overwriting
  repository_image_tag_mutability = "MUTABLE"

  # Enable image scanning on push
  repository_image_scan_on_push = true

  # Add lifecycle policy to clean up old images
  repository_lifecycle_policy = jsonencode({
    rules = [
      {
        rulePriority = 1,
        description  = "Keep last 30 images",
        selection = {
          tagStatus     = "any",
          countType     = "imageCountMoreThan",
          countNumber   = 30
        },
        action = {
          type = "expire"
        }
      }
    ]
  })

  tags = {
    Terraform   = "true"
    Application = "weather-app"
  }
}

################################################################################
# IAM roles & policies for EKS / user
################################################################################
resource "aws_iam_role" "eks_cluster_role" {
  name = "weather-app-eks-cluster-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "eks.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  role       = aws_iam_role.eks_cluster_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}

resource "aws_iam_policy" "secrets_manager_access" {
  name        = "weather-app-secrets-access"
  description = "Allow reading specific Secrets Manager secret"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"]
      Resource = "arn:aws:secretsmanager:eu-north-1:595965639663:secret:weather-app/api-key-3CRiZv"
    }]
  })
}

data "aws_iam_policy" "ebs_csi_policy" {
  arn = "arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy"
}

################################################################################
# EKS cluster & node groups
################################################################################
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "20.36.0"  # Update to latest version

  cluster_name    = "weather-app-cluster"
  cluster_version = "1.30"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  # Use access entries exclusively (AWS best practice)
  authentication_mode = "API"

  # Automatically add the Terraform deployer identity as an administrator
  enable_cluster_creator_admin_permissions = true

  # Public access for easier development
  cluster_endpoint_public_access = true

  # Use existing IAM role (keep your current setup)
  create_iam_role = false
  iam_role_arn    = aws_iam_role.eks_cluster_role.arn

  # Enable IRSA for pod identity
  enable_irsa = true

  # Define explicit access entries for your SSO role
  access_entries = {
    # Your AWS SSO role
    admin-sso = {
      principal_arn = "arn:aws:iam::595965639663:role/AWSReservedSSO_AdministratorAccess_7f59a57331a3dae9"
      type          = "STANDARD"
      kubernetes_groups = ["system:masters"]
    }
    # Note: You don't need to define access entries for EKS managed node groups -
    # EKS automatically creates them
  }

  # Keep your existing node group configuration
  eks_managed_node_groups = {
    main = {
      min_size       = 1
      max_size       = 3
      desired_size   = 2
      instance_types = ["t3.small"]
      capacity_type  = "ON_DEMAND"
    }
  }
}

################################################################################
# EKS auth data-sources & Kubernetes/Helm providers
################################################################################
data "aws_eks_cluster" "cluster" {
  name = module.eks.cluster_name
}

data "aws_eks_cluster_auth" "cluster" {
  name = module.eks.cluster_name
}

provider "kubernetes" {
  host                   = data.aws_eks_cluster.cluster.endpoint
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority[0].data)
  token                  = data.aws_eks_cluster_auth.cluster.token
}

provider "helm" {
  kubernetes {
    host                   = data.aws_eks_cluster.cluster.endpoint
    cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority[0].data)
    token                  = data.aws_eks_cluster_auth.cluster.token
  }
}

################################################################################
# EKS Readiness Checker
################################################################################
# First wait for cluster to report as active
resource "time_sleep" "wait_for_cluster_initial" {
  depends_on      = [module.eks]
  create_duration = "30s"
}

# Actively verify EKS API server is responding properly
resource "null_resource" "verify_cluster_active" {
  depends_on = [time_sleep.wait_for_cluster_initial]

  provisioner "local-exec" {
    interpreter = ["/bin/bash", "-c"]
    command     = <<-EOT
      # Initialize counter and set max attempts
      COUNTER=0
      MAX_ATTEMPTS=30

      # Wait for kubectl to successfully connect to the cluster
      while ! kubectl --kubeconfig <(aws eks get-cluster-kubeconfig --name ${module.eks.cluster_name} --region eu-north-1) get ns &>/dev/null; do
        if [ $COUNTER -eq $MAX_ATTEMPTS ]; then
          echo "Timed out waiting for EKS cluster to become active"
          exit 1
        fi
        echo "Waiting for EKS cluster to become active... (Attempt $COUNTER/$MAX_ATTEMPTS)"
        sleep 10
        COUNTER=$((COUNTER+1))
      done

      echo "EKS cluster is active and API server is responding!"
    EOT
  }
}

# Additional safety buffer after API is responding
resource "time_sleep" "wait_for_stabilization" {
  depends_on      = [null_resource.verify_cluster_active]
  create_duration = "60s"  # Additional buffer time for cluster to stabilize
}

resource "null_resource" "cluster_ready" {
  depends_on = [time_sleep.wait_for_stabilization]
}

################################################################################
# Create all required namespaces
################################################################################
resource "kubernetes_namespace" "namespaces" {
  for_each = toset([
    "external-secrets",
    "weather-app",
    "tekton-pipelines"
  ])

  metadata {
    name = each.key

    labels = {
      "app.kubernetes.io/managed-by" = "terraform"
    }
  }

  # These dependencies are crucial
  depends_on = [
    null_resource.cluster_ready
  ]

  # Add a timeout to allow for slow namespace creation
  timeouts {
    delete = "10m"  # Extended timeout for deletion
  }

  # Wait for default service account to ensure namespace is fully ready
  wait_for_default_service_account = true
}

################################################################################
# EBS CSI Driver via IRSA & addon
################################################################################
module "irsa_ebs_csi" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-assumable-role-with-oidc"
  version = "5.39.0"

  create_role                   = true
  role_name                     = "AmazonEKSTFEBSCSIRole-${module.eks.cluster_name}"
  provider_url                  = module.eks.oidc_provider
  role_policy_arns              = [data.aws_iam_policy.ebs_csi_policy.arn]
  oidc_fully_qualified_subjects = ["system:serviceaccount:kube-system:ebs-csi-controller-sa"]
}

resource "aws_eks_addon" "ebs_csi_driver" {
  cluster_name             = module.eks.cluster_name
  addon_name               = "aws-ebs-csi-driver"
  addon_version            = "v1.25.0-eksbuild.1"
  service_account_role_arn = module.irsa_ebs_csi.iam_role_arn

  depends_on = [
    null_resource.cluster_ready,
    module.irsa_ebs_csi
  ]
}

################################################################################
# IRSA for Secrets Manager
################################################################################
module "irsa_secrets_manager" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-assumable-role-with-oidc"
  version = "5.39.0"

  create_role                   = true
  role_name                     = "weather-app-secrets-role"
  provider_url                  = module.eks.oidc_provider
  role_policy_arns              = [aws_iam_policy.secrets_manager_access.arn]
  oidc_fully_qualified_subjects = ["system:serviceaccount:weather-app:weather-app-sa"]
}

################################################################################
# External Secrets Operator Helm install
################################################################################
resource "helm_release" "external_secrets" {
  name       = "external-secrets"
  repository = "https://charts.external-secrets.io"
  chart      = "external-secrets"
  namespace  = kubernetes_namespace.namespaces["external-secrets"].metadata[0].name
  version    = "0.9.9"

  set {
    name  = "installCRDs"
    value = "true"
  }

  timeout = 600
  wait    = true

  depends_on = [kubernetes_namespace.namespaces["external-secrets"]]
}

################################################################################
# IRSA for Tekton ECR push & related SA + PVC
################################################################################
module "irsa_tekton_ecr" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-assumable-role-with-oidc"
  version = "5.39.0"

  create_role                   = true
  role_name                     = "tekton-ecr-role"
  provider_url                  = module.eks.oidc_provider
  role_policy_arns              = [aws_iam_policy.ecr_push_policy.arn]
  oidc_fully_qualified_subjects = ["system:serviceaccount:tekton-pipelines:tekton-build-sa"]
}

resource "aws_iam_policy" "ecr_push_policy" {
  name        = "weather-app-ecr-push-policy"
  description = "Policy to allow pushing to ECR"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:CompleteLayerUpload",
          "ecr:GetAuthorizationToken",
          "ecr:InitiateLayerUpload",
          "ecr:PutImage",
          "ecr:UploadLayerPart",
        ]
        Resource = module.ecr.repository_arn
      },
      {
        Effect   = "Allow"
        Action   = ["ecr:GetAuthorizationToken"]
        Resource = "*"
      }
    ]
  })
}

resource "kubernetes_service_account" "tekton_sa" {
  metadata {
    name        = "tekton-build-sa"
    namespace   = "tekton-pipelines"
    annotations = {
      "eks.amazonaws.com/role-arn" = module.irsa_tekton_ecr.iam_role_arn
    }
  }
  depends_on = [kubernetes_namespace.namespaces["tekton-pipelines"]]
}

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
    storage_class_name = "gp3"
  }
  depends_on = [kubernetes_namespace.namespaces["tekton-pipelines"], aws_eks_addon.ebs_csi_driver]
}

################################################################################
# Install Tekton Components
################################################################################
resource "helm_release" "tekton_pipelines" {
  name       = "tekton-pipelines"
  repository = "https://tektoncd.github.io/charts"
  chart      = "tekton-pipeline"
  namespace  = kubernetes_namespace.namespaces["tekton-pipelines"].metadata[0].name

  timeout    = 600
  wait       = true
  wait_for_jobs = true

  depends_on = [kubernetes_namespace.namespaces["tekton-pipelines"]]
}

resource "helm_release" "tekton_dashboard" {
  name       = "tekton-dashboard"
  repository = "https://tektoncd.github.io/charts"
  chart      = "tekton-dashboard"
  namespace  = kubernetes_namespace.namespaces["tekton-pipelines"].metadata[0].name

  timeout    = 600
  wait       = true

  depends_on = [helm_release.tekton_pipelines]
}

resource "kubernetes_manifest" "git_clone_task" {
  manifest = yamldecode(file("${path.module}/../tekton/git-clone-task.yaml"))
  depends_on = [helm_release.tekton_pipelines]
}

resource "kubernetes_manifest" "helm_upgrade_task" {
  manifest = yamldecode(file("${path.module}/../tekton/helm-upgrade-task.yaml"))
  depends_on = [helm_release.tekton_pipelines]
}

resource "kubernetes_manifest" "kaniko_ecr_task" {
  manifest = yamldecode(file("${path.module}/../tekton/kaniko-ecr-task.yaml"))
  depends_on = [helm_release.tekton_pipelines]
}

################################################################################
# Outputs
################################################################################
output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "kubectl_config_command" {
  description = "Command to update kubeconfig"
  value       = "aws eks update-kubeconfig --region eu-north-1 --name ${module.eks.cluster_name}"
}

output "ecr_repository_url" {
  description = "The URL of the ECR repository"
  value       = module.ecr.repository_url
}
