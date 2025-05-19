variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
  default     = "weather-app-cluster"
}

variable "cluster_version" {
  description = "Kubernetes version to use for the EKS cluster"
  type        = string
  default     = "1.30"
}

variable "vpc_id" {
  description = "ID of the VPC where the cluster will be deployed"
  type        = string
}

variable "private_subnets" {
  description = "A list of private subnet IDs for the EKS cluster"
  type        = list(string)
}

variable "admin_principal_arn" {
  description = "ARN of the admin principal for the EKS cluster"
  type        = string
  default     = "arn:aws:iam::595965639663:role/aws-reserved/sso.amazonaws.com/eu-north-1/AWSReservedSSO_AdministratorAccess_7f59a57331a3dae9"
}

variable "admin_username" {
  description = "Username for admin access"
  type        = string
  default     = "panog792"
}

variable "node_group_min_size" {
  description = "Minimum number of nodes in the node group"
  type        = number
  default     = 1
}

variable "node_group_max_size" {
  description = "Maximum number of nodes in the node group"
  type        = number
  default     = 3
}

variable "node_group_desired_size" {
  description = "Desired number of nodes in the node group"
  type        = number
  default     = 2
}

variable "node_instance_types" {
  description = "List of instance types for the node group"
  type        = list(string)
  default     = ["t3.small"]
}

variable "secrets_access_secret_arn" {
  description = "ARN of the secret to allow access to"
  type        = string
  default     = "arn:aws:secretsmanager:eu-north-1:595965639663:secret:weather-app/api-key-3CRiZv"
}