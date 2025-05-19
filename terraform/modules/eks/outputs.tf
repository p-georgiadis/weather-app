output "cluster_name" {
  description = "Name of the EKS cluster"
  value       = module.eks.cluster_name
}

output "cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = module.eks.cluster_endpoint
}

output "cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the cluster"
  value       = module.eks.cluster_certificate_authority_data
}

output "oidc_provider" {
  description = "The OpenID Connect identity provider (issuer URL without leading https://)"
  value       = module.eks.oidc_provider
}

output "cluster_status" {
  description = "Status of the EKS cluster"
  value       = "ready"
  depends_on  = [
    null_resource.verify_nodes_ready
  ]
}

output "irsa_ebs_csi_role_arn" {
  description = "IAM role ARN for EBS CSI driver"
  value       = module.irsa_ebs_csi.iam_role_arn
}