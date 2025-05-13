terraform {
  cloud {
    organization = "p-georgiadis"  # Your organization name
    workspaces {
      name = "weather-app"
    }
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    time = {
      source  = "hashicorp/time"
      version = "~> 0.9.1"
    }
  }
}

provider "aws" {
  region = "eu-north-1"
  # Credentials come from Terraform Cloud variable set
}

# VPC for EKS
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "weather-app-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["eu-north-1a", "eu-north-1b", "eu-north-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = true
  
  # These tags are needed for EKS to find the subnets
  public_subnet_tags = {
    "kubernetes.io/cluster/weather-app-cluster" = "shared"
    "kubernetes.io/role/elb"                    = "1"
  }

  private_subnet_tags = {
    "kubernetes.io/cluster/weather-app-cluster" = "shared"
    "kubernetes.io/role/internal-elb"           = "1"
  }
}

# EKS Cluster
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = "weather-app-cluster"
  cluster_version = "1.27"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  cluster_endpoint_public_access = true

  # Disable the AWS-managed node group creation initially
  # We'll add it after the cluster is created
  create_aws_auth_configmap = true
  manage_aws_auth_configmap = true

  aws_auth_users = [
    {
      userarn  = "arn:aws:iam::595965639663:user/terraform-automation"
      username = "terraform-automation"
      groups   = ["system:masters"]
    }
  ]
}

# Wait for the EKS cluster to be ready before creating node groups
resource "time_sleep" "wait_for_cluster" {
  depends_on = [module.eks]

  create_duration = "60s"

  triggers = {
    cluster_name    = module.eks.cluster_name
    cluster_version = module.eks.cluster_version
  }
}

# Node Group
module "eks_managed_node_group" {
  source = "terraform-aws-modules/eks/aws//modules/eks-managed-node-group"
  version = "~> 19.0"

  name            = "main-node-group"
  cluster_name    = module.eks.cluster_name
  cluster_version = module.eks.cluster_version

  subnet_ids = module.vpc.private_subnets

  min_size     = 1
  max_size     = 3
  desired_size = 2

  instance_types = ["t3.medium"]
  capacity_type  = "ON_DEMAND"

  depends_on = [
    time_sleep.wait_for_cluster
  ]
}

output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "kubectl_config_command" {
  description = "Command to update kubeconfig"
  value       = "aws eks update-kubeconfig --region eu-north-1 --name ${module.eks.cluster_name}"
}
