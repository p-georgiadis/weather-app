# Main file to call all modules

# VPC Module - This should match exactly the existing VPC configuration
module "vpc" {
  source = "./modules/vpc"
}

# ECR Module
module "ecr" {
  source = "./modules/ecr"
}

# EKS Module - depends on VPC
module "eks" {
  source = "./modules/eks"
  
  vpc_id          = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnets
  
  depends_on = [module.vpc]
}

# Configure providers for use in modules that need Kubernetes
data "aws_eks_cluster" "cluster" {
  name = module.eks.cluster_name
  depends_on = [module.eks]
}

data "aws_eks_cluster_auth" "cluster" {
  name = module.eks.cluster_name
  depends_on = [module.eks]
}

# Kubernetes resources module - only created after providers are configured
module "kubernetes_resources" {
  source = "./modules/kubernetes-resources"
  
  eks_cluster_name       = module.eks.cluster_name
  eks_cluster_endpoint   = module.eks.cluster_endpoint
  eks_cluster_certificate = module.eks.cluster_certificate_authority_data
  ebs_csi_role_arn       = module.eks.irsa_ebs_csi_role_arn
  oidc_provider          = module.eks.oidc_provider
  
  depends_on = [
    module.eks,
    data.aws_eks_cluster.cluster,
    data.aws_eks_cluster_auth.cluster
  ]
}

# Tekton Module - depends on both EKS, ECR, and kubernetes-resources
module "tekton" {
  source = "./modules/tekton"
  
  cluster_name             = module.eks.cluster_name
  cluster_endpoint         = module.eks.cluster_endpoint
  cluster_ca_certificate   = module.eks.cluster_certificate_authority_data
  oidc_provider            = module.eks.oidc_provider
  ecr_repository_arn       = module.ecr.repository_arn
  ecr_repository_url       = module.ecr.repository_url
  tekton_namespace         = "tekton-pipelines"
  
  depends_on = [
    module.eks, 
    module.ecr,
    module.kubernetes_resources,
    data.aws_eks_cluster.cluster,
    data.aws_eks_cluster_auth.cluster
  ]
}