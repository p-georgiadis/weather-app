#!/bin/bash

# Ensure script fails on fatal errors, but continue on non-fatal errors
set -e

echo "===== Setting up Kubernetes resources for Weather App ====="

echo "1. Authenticating to the EKS cluster..."
aws eks update-kubeconfig --name weather-app-cluster --region eu-north-1

echo "2. Creating namespaces..."
kubectl create namespace external-secrets --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace weather-app --dry-run=client -o yaml | kubectl apply -f -
kubectl create namespace tekton-pipelines --dry-run=client -o yaml | kubectl apply -f -

# Add security permissions to tekton-pipelines namespace
kubectl label namespace tekton-pipelines pod-security.kubernetes.io/enforce=baseline pod-security.kubernetes.io/enforce-version=latest --overwrite

echo "3. Creating service accounts with IAM role annotations..."
kubectl create -n tekton-pipelines serviceaccount tekton-build-sa --dry-run=client -o yaml | kubectl apply -f -
kubectl annotate -n tekton-pipelines serviceaccount tekton-build-sa eks.amazonaws.com/role-arn=arn:aws:iam::595965639663:role/tekton-ecr-role --overwrite

kubectl create -n weather-app serviceaccount weather-app-sa --dry-run=client -o yaml | kubectl apply -f -
kubectl annotate -n weather-app serviceaccount weather-app-sa eks.amazonaws.com/role-arn=arn:aws:iam::595965639663:role/weather-app-secrets-role --overwrite

echo "4. Creating the gp3 StorageClass..."
cat <<EOF | kubectl apply -f -
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: gp3
provisioner: kubernetes.io/aws-ebs
parameters:
  type: gp3
  fsType: ext4
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
EOF

echo "5. Creating PVC for Tekton workspace..."
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: weather-app-workspace
  namespace: tekton-pipelines
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
  storageClassName: gp3
EOF

echo "6. Setting up Helm repositories..."
helm repo add external-secrets https://charts.external-secrets.io 2>/dev/null || true
helm repo add tekton https://cdfoundation.github.io/tekton-helm-chart/ 2>/dev/null || true
helm repo update

echo "7. Installing External Secrets Operator..."
helm upgrade --install external-secrets external-secrets/external-secrets -n external-secrets --set installCRDs=true

echo "8. Installing Tekton Pipelines..."
helm upgrade --install tekton-pipelines tekton/tekton-pipeline -n tekton-pipelines 

echo "9. Installing Tekton Dashboard..."
kubectl apply -f https://storage.googleapis.com/tekton-releases/dashboard/latest/release.yaml

echo "10. Waiting for External Secrets CRDs to be ready..."
echo "   This may take several minutes..."

# Wait for CRDs to be fully established
MAX_RETRIES=30
RETRY_INTERVAL=10
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if kubectl get crd externalsecrets.external-secrets.io >/dev/null 2>&1 && \
     kubectl get crd secretstores.external-secrets.io >/dev/null 2>&1; then
    echo "   External Secrets CRDs are installed, checking if they're established..."
    
    # Check if CRDs are established
    if kubectl get crd externalsecrets.external-secrets.io -o jsonpath='{.status.conditions[?(@.type=="Established")].status}' | grep -q "True" && \
       kubectl get crd secretstores.external-secrets.io -o jsonpath='{.status.conditions[?(@.type=="Established")].status}' | grep -q "True"; then
      echo "   External Secrets CRDs are fully established!"
      break
    fi
  fi
  
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "   Waiting for External Secrets CRDs to be fully established (attempt $RETRY_COUNT/$MAX_RETRIES)..."
  sleep $RETRY_INTERVAL
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "ERROR: Timed out waiting for External Secrets CRDs to be ready"
  exit 1
fi

# Add an additional delay to ensure CRDs are fully propagated
echo "   Waiting an additional 15 seconds for CRDs to propagate completely..."
sleep 15

echo "11. Waiting for Tekton webhook to be ready..."
echo "   Checking Tekton pods status (this may take a few minutes):"
kubectl get pods -n tekton-pipelines
echo "   Waiting for webhook pods to be ready (60 second delay)..."
sleep 60

echo "12. Installing Tekton tasks..."
echo "   Creating git-clone task..."
kubectl apply -f - <<'EOF'
apiVersion: tekton.dev/v1beta1
kind: Task
metadata:
  name: git-clone
  namespace: tekton-pipelines
  labels:
    app.kubernetes.io/version: "0.9"
spec:
  description: >-
    These Tasks are Git tasks to work with repositories used by other tasks
    in your Pipeline.
    The git-clone Task will clone a repo from the provided url into the
    output Workspace. By default the repo will be cloned into the root of
    your Workspace.
  params:
  - name: url
    description: git url to clone
    type: string
  - name: revision
    description: git revision to checkout (branch, tag, sha, ref…)
    type: string
    default: ""
  - name: refspec
    description: git refspec to fetch before checking out revision
    default: ""
  - name: submodules
    description: defines if the resource should initialize and fetch the submodules
    type: string
    default: "true"
  - name: depth
    description: performs a shallow clone where only the most recent commit(s) will be fetched
    type: string
    default: "1"
  - name: sslVerify
    description: defines if http.sslVerify should be set to true or false in the global git config
    type: string
    default: "true"
  - name: subdirectory
    description: subdirectory inside the "output" workspace to clone the git repo into
    type: string
    default: ""
  - name: deleteExisting
    description: clean out the contents of the repo's destination directory if it exists before cloning the repo
    type: string
    default: "true"
  - name: httpProxy
    description: git HTTP proxy server for non-SSL requests
    type: string
    default: ""
  - name: httpsProxy
    description: git HTTPS proxy server for SSL requests
    type: string
    default: ""
  - name: noProxy
    description: git no proxy - opt out of proxying HTTP/HTTPS requests
    type: string
    default: ""
  - name: verbose
    description: log the commands used during execution
    type: string
    default: "true"
  - name: gitInitImage
    description: the image used where the git-init binary is
    type: string
    default: "gcr.io/tekton-releases/github.com/tektoncd/pipeline/cmd/git-init:v0.40.2"
  - name: userHome
    description: |
      Absolute path to the user's home directory.
    type: string
    default: "/home/git"
  results:
  - name: commit
    description: The precise commit SHA that was fetched by this Task
  - name: url
    description: The precise URL that was fetched by this Task
  workspaces:
  - name: output
    description: The git repo will be cloned onto the volume backing this Workspace
  steps:
  - name: clone
    image: $(params.gitInitImage)
    env:
    - name: HOME
      value: "$(params.userHome)"
    - name: PARAM_URL
      value: $(params.url)
    - name: PARAM_REVISION
      value: $(params.revision)
    - name: PARAM_REFSPEC
      value: $(params.refspec)
    - name: PARAM_SUBMODULES
      value: $(params.submodules)
    - name: PARAM_DEPTH
      value: $(params.depth)
    - name: PARAM_SSL_VERIFY
      value: $(params.sslVerify)
    - name: PARAM_SUBDIRECTORY
      value: $(params.subdirectory)
    - name: PARAM_DELETE_EXISTING
      value: $(params.deleteExisting)
    - name: PARAM_HTTP_PROXY
      value: $(params.httpProxy)
    - name: PARAM_HTTPS_PROXY
      value: $(params.httpsProxy)
    - name: PARAM_NO_PROXY
      value: $(params.noProxy)
    - name: PARAM_VERBOSE
      value: $(params.verbose)
    - name: WORKSPACE_OUTPUT_PATH
      value: $(workspaces.output.path)
    securityContext:
      allowPrivilegeEscalation: false
      capabilities:
        drop:
        - ALL
      runAsNonRoot: true
      seccompProfile:
        type: RuntimeDefault
    script: |
      #!/usr/bin/env sh
      set -eu

      if [ "${PARAM_VERBOSE}" = "true" ] ; then
        set -x
      fi

      if [ "${PARAM_HTTP_PROXY}" != "" ] ; then
        export HTTP_PROXY="${PARAM_HTTP_PROXY}"
        export http_proxy="${PARAM_HTTP_PROXY}"
      fi

      if [ "${PARAM_HTTPS_PROXY}" != "" ] ; then
        export HTTPS_PROXY="${PARAM_HTTPS_PROXY}"
        export https_proxy="${PARAM_HTTPS_PROXY}"
      fi

      if [ "${PARAM_NO_PROXY}" != "" ] ; then
        export NO_PROXY="${PARAM_NO_PROXY}"
        export no_proxy="${PARAM_NO_PROXY}"
      fi

      /ko-app/git-init \
        -url="${PARAM_URL}" \
        -revision="${PARAM_REVISION}" \
        -refspec="${PARAM_REFSPEC}" \
        -path="${WORKSPACE_OUTPUT_PATH}/${PARAM_SUBDIRECTORY}" \
        -sslVerify="${PARAM_SSL_VERIFY}" \
        -submodules="${PARAM_SUBMODULES}" \
        -depth="${PARAM_DEPTH}" \
        -deleteExisting="${PARAM_DELETE_EXISTING}"
      cd "${WORKSPACE_OUTPUT_PATH}/${PARAM_SUBDIRECTORY}"
      RESULT_COMMIT="$(git rev-parse HEAD)"
      EXIT_CODE="$?"
      if [ "${EXIT_CODE}" != 0 ] ; then
        exit "${EXIT_CODE}"
      fi
      printf "%s" "${RESULT_COMMIT}" > $(results.commit.path)
      printf "%s" "${PARAM_URL}" > $(results.url.path)
EOF

echo "   Creating helm-upgrade task..."
kubectl apply -f - <<'EOF'
apiVersion: tekton.dev/v1beta1
kind: Task
metadata:
  name: helm-upgrade
  namespace: tekton-pipelines
  labels:
    app.kubernetes.io/version: "0.1"
spec:
  description: >-
    These Tasks deploys a helm chart using helm upgrade
  params:
  - name: charts_dir
    description: The directory in the source repository where the Helm chart is located
    type: string
    default: "."
  - name: release_name
    description: The name of the helm release
    type: string
  - name: release_namespace
    description: The namespace to install the release into
    type: string
    default: "default"
  - name: values_file
    description: The name of the values file to use for the upgrade
    type: string
    default: "values.yaml"
  - name: upgrade_extra_params
    description: Extra parameters passed for the helm upgrade command (-f, --atomic, etc)
    type: string
    default: "--install"
  workspaces:
  - name: source
    description: The git repo
  steps:
  - name: helm-upgrade
    image: alpine/helm:3.10.3
    securityContext:
      allowPrivilegeEscalation: false
      capabilities:
        drop:
        - ALL
      runAsNonRoot: false
      seccompProfile:
        type: RuntimeDefault
    script: |
      #!/bin/sh
      set -e
      cd $(workspaces.source.path)
      cd $(params.charts_dir)
      helm upgrade $(params.release_name) . -f $(params.values_file) -n $(params.release_namespace) $(params.upgrade_extra_params)
EOF

echo "   Creating kaniko-ecr-task..."
kubectl apply -f - <<'EOF'
apiVersion: tekton.dev/v1beta1
kind: Task
metadata:
  name: kaniko-ecr
  namespace: tekton-pipelines
spec:
  description: >-
    This Task builds a container image using Kaniko and pushes it to an ECR repository.
    It assumes you have an IAM role for service account (IRSA) set up.
  params:
  - name: IMAGE
    description: Name (reference) of the image to build.
  - name: DOCKERFILE
    description: Path to the Dockerfile to build.
    default: ./Dockerfile
  - name: CONTEXT
    description: The build context used by Kaniko.
    default: ./
  - name: EXTRA_ARGS
    description: Additional arguments to pass to Kaniko.
    default: ""
  - name: BUILDER_IMAGE
    description: The image on which builds will run.
    default: gcr.io/kaniko-project/executor:v1.12.0-debug
  workspaces:
  - name: source
    description: Workspace containing the source code to build.
  steps:
  - name: build-and-push
    image: $(params.BUILDER_IMAGE)
    args:
    - --dockerfile=$(params.DOCKERFILE)
    - --context=$(workspaces.source.path)/$(params.CONTEXT)
    - --destination=$(params.IMAGE)
    - $(params.EXTRA_ARGS)
    securityContext:
      runAsUser: 0
EOF

echo "===== Kubernetes resources setup complete! ====="
echo "You can now proceed with your application deployment using the original steps:"
echo "1. Build and push your Docker image"
echo "2. Install your application with helm"
echo "3. Set up the CI/CD pipeline with Tekton"