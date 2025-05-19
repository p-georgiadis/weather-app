output "repository_arn" {
  description = "Full ARN of the repository"
  value       = module.ecr.repository_arn
}

output "repository_url" {
  description = "The URL of the repository"
  value       = module.ecr.repository_url
}

output "repository_name" {
  description = "The name of the repository"
  value       = module.ecr.repository_name
}