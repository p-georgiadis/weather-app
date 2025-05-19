variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
}

variable "cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  type        = string
}

variable "cluster_ca_certificate" {
  description = "Base64 encoded certificate data required to communicate with the cluster"
  type        = string
}

variable "oidc_provider" {
  description = "The OpenID Connect identity provider (issuer URL without leading https://)"
  type        = string
}

variable "ecr_repository_arn" {
  description = "ARN of the ECR repository"
  type        = string
}

variable "ecr_repository_url" {
  description = "URL of the ECR repository"
  type        = string
}

variable "tekton_namespace" {
  description = "Kubernetes namespace for Tekton resources"
  type        = string
  default     = "tekton-pipelines"
}

variable "tekton_workspace_size" {
  description = "Size of the Tekton workspace PVC"
  type        = string
  default     = "5Gi"
}

variable "tekton_storage_class" {
  description = "Storage class for Tekton PVCs"
  type        = string
  default     = "gp3"
}