# Architecture

## Flow

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant GH as GitHub
    participant GA as GitHub Actions
    participant IAM as AWS IAM (OIDC)
    participant ECR as Amazon ECR
    participant SSM as AWS SSM
    participant EC2 as EC2 + Docker

    Dev->>GH: git push to main
    GH->>GA: Trigger workflow
    GA->>GA: Job 1: install + run tests
    GA->>IAM: Request token via OIDC
    IAM-->>GA: Short-lived credentials
    GA->>ECR: Job 2: push image tagged with commit SHA
    GA->>SSM: Job 3: send deploy command
    SSM->>EC2: Run shell script
    EC2->>ECR: Pull new image
    EC2->>EC2: Replace running container
    GA->>EC2: Health check GET /health
```

## Design decisions

| Decision | Reason |
|---|---|
| OIDC instead of access keys | Credentials are short-lived and never stored in GitHub |
| Image tagged with commit SHA | Every deployment is traceable and rollback is easy |
| SSM instead of SSH | No open SSH port, no key management, all commands are audited |
| Health check at the end | Pipeline fails if the new version is not actually serving traffic |
| Non-root container user | Reduces the impact of a container compromise |

## Diagram assets

Export a draw.io or Excalidraw version of this diagram as `docs/architecture.png`.
