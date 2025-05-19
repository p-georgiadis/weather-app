variable "repository_name" {
  description = "Name of the ECR repository"
  type        = string
  default     = "weather-app"
}

variable "image_tag_mutability" {
  description = "The tag mutability setting for the repository"
  type        = string
  default     = "MUTABLE"
}

variable "scan_on_push" {
  description = "Indicates whether images are scanned after being pushed to the repository"
  type        = bool
  default     = true
}

variable "image_count_limit" {
  description = "Maximum number of images to keep before removing older ones"
  type        = number
  default     = 30
}