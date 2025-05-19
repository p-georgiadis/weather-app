provider "aws" {
  region = "eu-north-1"
}

# Configure Kubernetes provider with explicit AWS authentication
provider "kubernetes" {
  host                   = data.aws_eks_cluster.cluster.endpoint
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority[0].data)
  
  # Use AWS EKS token for authentication
  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    # Explicitly specify all required parameters
    args = [
      "eks", 
      "get-token", 
      "--cluster-name", 
      data.aws_eks_cluster.cluster.name,
      "--region",
      "eu-north-1"
    ]
  }
}

# Configure Helm provider with the same authentication method
provider "helm" {
  kubernetes {
    host                   = data.aws_eks_cluster.cluster.endpoint
    cluster_ca_certificate = base64decode(data.aws_eks_cluster.cluster.certificate_authority[0].data)
    
    # Use AWS EKS token for authentication
    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      command     = "aws"
      # Explicitly specify all required parameters
      args = [
        "eks", 
        "get-token", 
        "--cluster-name", 
        data.aws_eks_cluster.cluster.name,
        "--region",
        "eu-north-1"
      ]
    }
  }
}