output "tekton_service_account" {
  description = "The name of the Tekton service account with ECR permissions"
  value       = local.skip_k8s_resources ? "tekton-build-sa" : kubernetes_service_account.tekton_sa[0].metadata[0].name
}

output "tekton_workspace_pvc" {
  description = "The name of the Tekton workspace PVC"
  value       = local.skip_k8s_resources ? "weather-app-workspace" : kubernetes_persistent_volume_claim.tekton_workspace_pvc[0].metadata[0].name
}