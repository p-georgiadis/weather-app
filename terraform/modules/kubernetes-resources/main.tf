# Disable Kubernetes resources in Terraform Cloud
locals {
  skip_k8s_resources = true
  namespaces = ["external-secrets", "weather-app", "tekton-pipelines"]
}

# Create required namespaces
resource "kubernetes_namespace" "namespaces" {
  for_each = local.skip_k8s_resources ? toset([]) : toset(local.namespaces)

  metadata {
    name = each.key

    labels = {
      "app.kubernetes.io/managed-by" = "terraform"
    }
  }

  # Add a timeout to allow for slow namespace creation
  timeouts {
    delete = "10m"  # Extended timeout for deletion
  }

  # Wait for default service account to ensure namespace is fully ready
  wait_for_default_service_account = true
}

# EBS CSI Driver addon - use a more dynamic approach to version
resource "aws_eks_addon" "ebs_csi_driver" {
  cluster_name             = var.eks_cluster_name
  addon_name               = "aws-ebs-csi-driver"
  # Remove the explicit version to use the default latest compatible version
  service_account_role_arn = var.ebs_csi_role_arn
}

# IRSA for Secrets Manager
resource "aws_iam_policy" "secrets_manager_access" {
  name        = "weather-app-secrets-access"
  description = "Allow reading specific Secrets Manager secret"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"]
      Resource = var.secrets_access_secret_arn
    }]
  })
}

module "irsa_secrets_manager" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-assumable-role-with-oidc"
  version = "5.39.0"

  create_role                   = true
  role_name                     = "weather-app-secrets-role"
  provider_url                  = var.oidc_provider
  role_policy_arns              = [aws_iam_policy.secrets_manager_access.arn]
  oidc_fully_qualified_subjects = ["system:serviceaccount:weather-app:weather-app-sa"]
}

# External Secrets Operator Helm install
resource "helm_release" "external_secrets" {
  count = local.skip_k8s_resources ? 0 : 1
  
  name       = "external-secrets"
  repository = "https://charts.external-secrets.io"
  chart      = "external-secrets"
  namespace  = "external-secrets"
  version    = "0.9.9"

  set {
    name  = "installCRDs"
    value = "true"
  }

  timeout = 600
  wait    = true

  depends_on = [kubernetes_namespace.namespaces]
}