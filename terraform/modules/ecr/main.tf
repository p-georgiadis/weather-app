module "ecr" {
  source = "terraform-aws-modules/ecr/aws"

  repository_name = var.repository_name

  # Set to MUTABLE to allow image tag overwriting
  repository_image_tag_mutability = var.image_tag_mutability

  # Enable image scanning on push
  repository_image_scan_on_push = var.scan_on_push

  # Add lifecycle policy to clean up old images
  repository_lifecycle_policy = jsonencode({
    rules = [
      {
        rulePriority = 1,
        description  = "Keep last ${var.image_count_limit} images",
        selection = {
          tagStatus     = "any",
          countType     = "imageCountMoreThan",
          countNumber   = var.image_count_limit
        },
        action = {
          type = "expire"
        }
      }
    ]
  })

  tags = {
    Terraform   = "true"
    Environment = "dev"
    Application = "weather-app"
  }
}