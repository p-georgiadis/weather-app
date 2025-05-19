# Weather App Terraform Infrastructure

This directory contains the Terraform configuration for the Weather App infrastructure.

## Directory Structure

```
terraform/
├── main.tf                 # Main file that calls all modules
├── provider.tf             # Provider configurations
├── variables.tf            # Root level variables
├── outputs.tf              # Root level outputs
├── data.tf                 # Root level data sources (for provider configuration)
├── versions.tf             # Terraform version and required providers
├── modules/                # Modularized Terraform code
│   ├── vpc/                # VPC module for network infrastructure
│   ├── ecr/                # ECR module for container registry
│   ├── eks/                # EKS module for Kubernetes cluster
│   └── tekton/             # Tekton module for CI/CD pipelines
└── tekton/                 # Tekton resource YAML files
    ├── git-clone-task.yaml
    ├── helm-upgrade-task.yaml
    └── kaniko-ecr-task.yaml
```

## Organization Notes

### Data Sources

Most data sources are contained within their respective modules. However, EKS cluster data sources in `data.tf` are at the root level for a specific reason:

- They configure the Kubernetes and Helm providers
- Terraform requires provider configurations to have direct access to their data sources
- Modules cannot return values that configure providers

This is why `data.tf` contains the EKS cluster data sources, even though they conceptually belong to the EKS module.

## Usage

```bash
# Initialize Terraform
terraform init

# Plan the deployment
terraform plan

# Apply the configuration
terraform apply
```

## Modules

- **vpc**: Creates a VPC with public and private subnets for the EKS cluster
- **ecr**: Sets up an Elastic Container Registry for storing container images
- **eks**: Deploys an EKS cluster with managed node groups
- **tekton**: Installs Tekton pipelines for CI/CD

## Maintenance

- Keep modules updated with the latest provider versions
- Test infrastructure changes in a development environment before applying to production
- Use consistent naming conventions and tags across all resources