# Weather App

A comprehensive weather application built with Node.js and Express, deployed on AWS EKS using Terraform with Kubernetes, Helm, and Tekton CI/CD.

## Cloud-Native Best Practices

This project follows AWS's latest recommended practices for EKS management:

### Authentication & Access Management

- **EKS Access Entries** - Uses the modern authentication approach (GA April 2024) that's officially recommended by AWS, replacing the deprecated aws-auth ConfigMap
- **Identity Federation** - AWS SSO role integration with EKS access entries for secure, temporary credential access
- **Role-Based Access Control (RBAC)** - Precise Kubernetes permissions bound to IAM identities

### Security-First Design

- **Least Privilege** - Fine-grained IAM policies for each service component
- **Pod Identity** - IAM Roles for Service Accounts (IRSA) with OIDC federation
- **Secret Management** - External Secrets Operator integrates AWS Secrets Manager with Kubernetes
- **Network Isolation** - VPC private subnets for cluster workloads with controlled public access

### Infrastructure as Code Excellence

- **Declarative Configuration** - Complete infrastructure defined in Terraform
- **Module-Based Architecture** - Leverages community-maintained AWS modules (VPC, EKS, ECR)
- **Dependency Management** - Proper sequencing and waiting mechanisms for reliable deployment
- **State Management** - Terraform Cloud for state storage and collaborative workflows

### Operational Resilience

- **Readiness Verification** - Advanced cluster readiness detection with automated retries
- **Storage Management** - EBS CSI Driver with gp3 storage class for optimal performance
- **Container Lifecycle** - ECR image lifecycle policies for automated image cleanup
- **GitOps Ready** - Prepared for integration with GitOps workflows via Tekton pipelines

### Modern Deployment Pipeline

- **Kubernetes-Native CI/CD** - Tekton pipelines run directly on the cluster
- **Secure Image Building** - Kaniko for container building without privileged access
- **Automated Updates** - Pipeline-driven Helm deployments
- **Infrastructure Evolution** - Set up for blue/green and canary deployment patterns

## Kubernetes Observability Features

### Server Information Display

The application includes a built-in server information display that shows exactly which EKS pod is serving each request. This feature demonstrates cloud-native design principles and proper use of Kubernetes:

- **Pod Identity Visibility** - Real-time display of pod name, node name, and namespace
- **Kubernetes Downward API** - Leverages the Downward API to inject pod metadata as environment variables
- **EKS Validation** - Visually confirms proper operation of the EKS cluster and load balancing
- **Infrastructure Transparency** - Provides observability into the distributed nature of the application

The server information panel appears as a floating button in the corner of the application interface:

1. **Click the server icon** to reveal detailed information about the backend serving your request
2. **Refresh the page** to see load balancing in action as requests are distributed to different pods
3. **View timestamps** to monitor request handling times

This feature is particularly valuable for:
- Demonstrating the multi-pod architecture of the application
- Verifying proper operation of the EKS load balancer
- Debugging in a multi-node environment
- Educational purposes to visualize how Kubernetes works

### Implementation Details

The feature uses several Kubernetes and EKS best practices:

- **Downward API** - Securely exposes pod metadata to the application
- **Environment Variables** - No hardcoded values or configurations
- **Periodic Updates** - Auto-refreshes to show real-time information
- **Non-intrusive UI** - Collapsible interface that doesn't interfere with the application

## Overview

This application provides real-time weather information for cities around the world, leveraging OpenWeatherMap APIs. It features:

- Current weather conditions
- 5-day forecast
- Air quality index and pollution data
- Responsive design for mobile and desktop
- AWS cloud-native deployment
- GitOps-based continuous deployment

## Technology Stack

### Frontend
- **HTML5/CSS3/JavaScript** - Modern responsive interface
- **Font Awesome** - Icon library

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web application framework
- **Axios** - HTTP client for API requests

### Infrastructure & Cloud (AWS)
- **Amazon EKS** - Managed Kubernetes service with EKS access entries for authentication
- **Amazon ECR** - Container registry with lifecycle policies for image management
- **AWS Secrets Manager** - Secure storage for API keys
- **IAM Roles for Service Accounts (IRSA)** - Zero-trust pod identity model
- **Private VPC Architecture** - Cluster runs in private subnets with controlled NAT egress

### Container & Orchestration
- **Docker** - Application containerization
- **Kubernetes** - Container orchestration
- **Helm** - Kubernetes package manager
- **Tekton** - Kubernetes-native CI/CD

### Storage
- **EBS CSI Driver** - For persistent volume claims
- **gp3 Storage Class** - For improved performance

### Security
- **External Secrets Operator** - Sync AWS Secrets Manager with Kubernetes secrets
- **SecretStore & ExternalSecret** - K8s resources for secret management
- **Service Accounts with IRSA** - For secure AWS resource access

### Infrastructure as Code
- **Terraform** - For provisioning and managing all AWS resources and Kubernetes add-ons

## Project Structure

```
├── src/                     # Application source code
│   ├── Dockerfile           # Container configuration
│   ├── package.json         # Node.js dependencies
│   ├── server.js            # Express server
│   └── public/              # Frontend static files
│       ├── index.html       # Main HTML page
│       ├── css/             # CSS stylesheets
│       └── js/              # Frontend JavaScript
├── tekton/                  # CI/CD pipeline configuration
│   ├── pipeline.yaml        # Pipeline definition
│   ├── kaniko-ecr-task.yaml # Custom ECR build task
│   ├── pipelinerun.yaml     # Pipeline execution
│   └── workspace-pvc.yaml   # Persistent storage for pipelines
├── terraform/               # Infrastructure as code
│   └── main.tf              # AWS resources configuration
└── weather-app-chart/       # Helm chart for Kubernetes deployment
    ├── templates/           # K8s manifests templates
    ├── Chart.yaml           # Chart metadata
    └── values.yaml          # Configurable values
```

## Deployment Guide

### Prerequisites
- AWS CLI configured with appropriate permissions
- kubectl installed
- Helm installed
- Terraform installed

# Updated README.md Section

### Step 1: Deploy Infrastructure with Terraform

```bash
# Initialize and apply Terraform configuration
cd terraform
terraform init
terraform apply

# Save important outputs
export CLUSTER_NAME=$(terraform output -raw cluster_name)
export ECR_REPO=$(terraform output -raw ecr_repository_url)
```

### Step 2: Configure kubectl for EKS

```bash
# Configure kubectl to work with your EKS cluster
aws eks update-kubeconfig --region eu-north-1 --name $CLUSTER_NAME
```

### Step 3: Build and Push Docker Image

```bash
# Login to ECR
aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin $ECR_REPO

# Build the image
docker build -t $ECR_REPO:latest -f src/Dockerfile .

# Push to ECR
docker push $ECR_REPO:latest
```

### Step 4: Update Helm Chart Values

```bash
# Update the image repository in values.yaml
sed -i "s|repository: |repository: $ECR_REPO|" weather-app-chart/values.yaml
```

### Step 5: Deploy with Helm

```bash
# Install the application using Helm
helm install weather-app ./weather-app-chart -n weather-app
```

### Step 6: Set Up CI/CD Pipeline

```bash
# Apply the Tekton pipeline resources
kubectl apply -f tekton/pipeline.yaml

# Trigger the pipeline with a PipelineRun
kubectl apply -f tekton/pipelinerun.yaml
```

### Step 7: Access the Application

```bash
# Get the LoadBalancer URL
kubectl get svc -n weather-app weather-app
```


## Note on Infrastructure

Our Terraform configuration automatically:

- Creates and configures the ECR repository with lifecycle policies
- Creates all necessary Kubernetes namespaces (weather-app, tekton-pipelines, external-secrets)
- Installs Tekton Pipelines, Tekton Dashboard, and required Tekton Tasks
- Sets up service accounts with proper IAM roles for ECR access
- Creates persistent volume claims for pipeline workspaces

## Working with ECR Images

Our CI/CD pipeline uses IAM Roles for Service Accounts to automatically authenticate with ECR.

For local development:
1. Install the Amazon ECR Docker Credential Helper
2. Configure your `~/.docker/config.json` to use it
3. You can then run docker commands without manually refreshing tokens

See: https://github.com/awslabs/amazon-ecr-credential-helper for more details

## Security Features

### Zero-Trust Identity Model

The project implements a comprehensive zero-trust identity approach:

- **EKS Access Entries** - Modern IAM-to-Kubernetes authentication (replaces deprecated aws-auth ConfigMap)
- **Temporary Credentials** - AWS SSO and IAM roles provide short-lived access tokens
- **Pod Identity Isolation** - Each service component has its own identity with least-privilege policies
- **Infrastructure Identity Separation** - Different roles for cluster service, node groups, and operators

### API Key Management

This project uses the External Secrets Operator to securely handle the OpenWeatherMap API key:

1. The API key is stored in AWS Secrets Manager
2. IAM roles control access to the secret
3. The External Secrets Operator syncs the secret to Kubernetes
4. The application reads the API key from the environment

### IAM Roles for Service Accounts (IRSA)

The application leverages IRSA to provide secure access to AWS resources:

- Weather app service account for Secrets Manager access
- Tekton build service account for ECR access
- EBS CSI Driver service account for EBS volumes

## Monitoring and Maintenance

The application includes health and readiness endpoints at:
- `/health` - Liveness probe
- `/ready` - Readiness probe

## CI/CD Pipeline

The Tekton pipeline automates:

1. Fetching source code from Git
2. Building the Docker image with Kaniko
3. Pushing to ECR
4. Deploying to Kubernetes with Helm

## Future Enhancements

- Add AWS CloudWatch for monitoring and logging
- Implement autoscaling based on traffic patterns
- Add user accounts and preferences storage
- Integrate with AWS WAF for security
- Implement blue/green deployments

## License

MIT
