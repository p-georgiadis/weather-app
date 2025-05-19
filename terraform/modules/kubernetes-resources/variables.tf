variable "eks_cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
}

variable "eks_cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  type        = string
}

variable "eks_cluster_certificate" {
  description = "Certificate authority data for EKS cluster"
  type        = string
}

variable "ebs_csi_role_arn" {
  description = "IAM role ARN for EBS CSI driver"
  type        = string
}

variable "oidc_provider" {
  description = "The OpenID Connect identity provider"
  type        = string
}

variable "secrets_access_secret_arn" {
  description = "ARN of the secret to allow access to"
  type        = string
  default     = "arn:aws:secretsmanager:eu-north-1:595965639663:secret:weather-app/api-key-3CRiZv"
}