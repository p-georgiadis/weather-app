# Weather App

A comprehensive weather application built with Node.js and Express, deployed on AWS EKS with Kubernetes, Helm, and Tekton CI/CD.

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
- **Amazon EKS** - Managed Kubernetes service
- **Amazon ECR** - Container registry for Docker images
- **AWS Secrets Manager** - Secure storage for API keys
- **IAM Roles for Service Accounts (IRSA)** - Secure pod identity

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

### Step 1: Deploy Infrastructure with Terraform

```bash
# Initialize and apply Terraform configuration
cd terraform
terraform init
terraform apply

# Save important outputs
export CLUSTER_NAME=$(terraform output -raw cluster_id)
export ECR_REPO=$(terraform output -raw ecr_repository_url)
```

### Step 2: Configure kubectl for EKS

```bash
# Configure kubectl to work with your EKS cluster
aws eks update-kubeconfig --region eu-north-1 --name $CLUSTER_NAME
```

### Step 3: Install Required Tekton Tasks

```bash
# Install the git-clone ClusterTask
kubectl apply -f https://raw.githubusercontent.com/tektoncd/catalog/main/task/git-clone/0.9/git-clone.yaml
```

### Step 4: Build and Push Docker Image

```bash
# Login to ECR
aws ecr get-login-password --region eu-north-1 | docker login --username AWS --password-stdin $ECR_REPO

# Build the image
docker build -t $ECR_REPO:latest -f src/Dockerfile .

# Push to ECR
docker push $ECR_REPO:latest
```

### Step 5: Update Helm Chart Values

```bash
# Update the image repository in values.yaml
sed -i "s|repository: |repository: $ECR_REPO|" weather-app-chart/values.yaml
```

### Step 6: Deploy with Helm

```bash
# Install the application using Helm
helm install weather-app ./weather-app-chart -n weather-app --create-namespace
```

### Step 7: Set Up CI/CD Pipeline

```bash
# Apply the Tekton pipeline resources
kubectl apply -f tekton/kaniko-ecr-task.yaml
kubectl apply -f tekton/pipeline.yaml
kubectl apply -f tekton/workspace-pvc.yaml

# Trigger the pipeline with a PipelineRun
kubectl apply -f tekton/pipelinerun.yaml
```

### Step 8: Access the Application

```bash
# Get the LoadBalancer URL
kubectl get svc -n weather-app weather-app
```

## Security Features

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