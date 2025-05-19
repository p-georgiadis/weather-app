# IRSA for Tekton ECR push
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
        Resource = var.ecr_repository_arn
      },
      {
        Effect   = "Allow"
        Action   = ["ecr:GetAuthorizationToken"]
        Resource = "*"
      }
    ]
  })
}

module "irsa_tekton_ecr" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-assumable-role-with-oidc"
  version = "5.39.0"

  create_role                   = true
  role_name                     = "tekton-ecr-role"
  provider_url                  = var.oidc_provider
  role_policy_arns              = [aws_iam_policy.ecr_push_policy.arn]
  oidc_fully_qualified_subjects = ["system:serviceaccount:${var.tekton_namespace}:tekton-build-sa"]
}

# Disable Kubernetes resources
locals {
  skip_k8s_resources = true
  git_clone_task_yaml     = "${path.module}/../../tekton/git-clone-task.yaml"
  helm_upgrade_task_yaml  = "${path.module}/../../tekton/helm-upgrade-task.yaml"
  kaniko_ecr_task_yaml    = "${path.module}/../../tekton/kaniko-ecr-task.yaml"
}

resource "kubernetes_service_account" "tekton_sa" {
  count = local.skip_k8s_resources ? 0 : 1
  
  metadata {
    name        = "tekton-build-sa"
    namespace   = var.tekton_namespace
    annotations = {
      "eks.amazonaws.com/role-arn" = module.irsa_tekton_ecr.iam_role_arn
    }
  }
}

resource "kubernetes_persistent_volume_claim" "tekton_workspace_pvc" {
  count = local.skip_k8s_resources ? 0 : 1
  
  metadata {
    name      = "weather-app-workspace"
    namespace = var.tekton_namespace
  }
  spec {
    access_modes = ["ReadWriteOnce"]
    resources {
      requests = {
        storage = var.tekton_workspace_size
      }
    }
    storage_class_name = var.tekton_storage_class
  }
}

# Install Tekton Components
resource "helm_release" "tekton_pipelines" {
  count = local.skip_k8s_resources ? 0 : 1
  
  name       = "tekton-pipelines"
  repository = "https://tektoncd.github.io/charts"
  chart      = "tekton-pipeline"
  namespace  = var.tekton_namespace

  timeout    = 600
  wait       = true
  wait_for_jobs = true
}

resource "helm_release" "tekton_dashboard" {
  count = local.skip_k8s_resources ? 0 : 1
  
  name       = "tekton-dashboard"
  repository = "https://tektoncd.github.io/charts"
  chart      = "tekton-dashboard"
  namespace  = var.tekton_namespace

  timeout    = 600
  wait       = true

  depends_on = [helm_release.tekton_pipelines]
}

# Skip kubectl manifests in Terraform Cloud as well
resource "null_resource" "apply_tekton_manifests" {
  count = local.skip_k8s_resources ? 0 : 1
  
  depends_on = [helm_release.tekton_pipelines]

  provisioner "local-exec" {
    command = <<-EOT
      # Use kubectl to apply the manifests after the cluster is ready
      aws eks update-kubeconfig --name ${var.cluster_name} --region eu-north-1
      kubectl apply -f ${local.git_clone_task_yaml}
      kubectl apply -f ${local.helm_upgrade_task_yaml}
      kubectl apply -f ${local.kaniko_ecr_task_yaml}
    EOT
    interpreter = ["/bin/bash", "-c"]
  }
}