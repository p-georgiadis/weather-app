output "namespaces" {
  description = "Map of namespace names to their metadata"
  value = {
    for ns in local.namespaces : ns => {
      name = ns
    }
  }
}