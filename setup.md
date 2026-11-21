# AWS Setup Guide

Region used in this guide: `ap-south-1` (Mumbai). If you use another region, update `AWS_REGION` in `.github/workflows/ci-cd.yml`.

## 1. Secure your account

1. Enable MFA on the root user.
2. Create an IAM admin user for daily work and stop using root.
3. Go to **Billing > Budgets** and create a $1 monthly budget with email alerts.

## 2. Create the ECR repository

1. Open **Amazon ECR > Create repository**.
2. Name: `cicd-demo-app`, visibility: Private.

## 3. Launch the EC2 instance

1. Open **EC2 > Launch instance**.
2. AMI: Amazon Linux 2023. Type: `t3.micro` (or `t2.micro`, whichever is free tier eligible in your region).
3. Key pair: not needed (access is through SSM).
4. Security group: allow inbound **HTTP (80)** from anywhere. Do not open SSH.
5. Launch.

## 4. Create the EC2 instance role

1. **IAM > Roles > Create role**, trusted entity: EC2.
2. Attach: `AmazonSSMManagedInstanceCore` and `AmazonEC2ContainerRegistryReadOnly`.
3. Name it `cicd-demo-ec2-role`.
4. Attach it to the instance: **EC2 > Actions > Security > Modify IAM role**.

## 5. Install Docker on the instance

Connect using **EC2 > Connect > Session Manager**, then run:

```bash
sudo dnf install -y docker
sudo systemctl enable --now docker
```

## 6. Configure GitHub OIDC

1. **IAM > Identity providers > Add provider**
   - Type: OpenID Connect
   - Provider URL: `https://token.actions.githubusercontent.com`
   - Audience: `sts.amazonaws.com`
2. **IAM > Roles > Create role > Web identity**, choose the provider above.
3. Replace the placeholders in `infra/iam-trust-policy.json` (`<ACCOUNT_ID>`, `<GITHUB_USERNAME>`, `<REPO_NAME>`) and use it as the trust policy.
4. Create a policy from `infra/iam-permissions-policy.json` (replace `<ACCOUNT_ID>` and `<INSTANCE_ID>`) and attach it to the role.
5. Name the role `github-actions-cicd-role` and copy its ARN.

## 7. Add GitHub secrets

In your repository: **Settings > Secrets and variables > Actions > New repository secret**

| Name | Value |
|---|---|
| `AWS_ROLE_ARN` | ARN of `github-actions-cicd-role` |
| `EC2_INSTANCE_ID` | e.g. `i-0abc123...` |
| `EC2_PUBLIC_IP` | Public IPv4 of the instance |

## 8. Deploy

```bash
git add .
git commit -m "ci: initial pipeline"
git push origin main
```

Open the **Actions** tab. When all jobs are green, visit `http://<EC2_PUBLIC_IP>`.

## 9. Troubleshooting

| Problem | Likely cause |
|---|---|
| `Could not assume role` | Trust policy repo or branch name does not match |
| SSM command stuck or fails | EC2 role missing `AmazonSSMManagedInstanceCore`, or SSM agent not online |
| `docker: command not found` on EC2 | Docker not installed (step 5) |
| Health check fails | Security group does not allow port 80 |
| Image pull denied | EC2 role missing `AmazonEC2ContainerRegistryReadOnly` |
| Public IP changed after stop/start | Update the `EC2_PUBLIC_IP` secret or use an Elastic IP |

## 10. Cleanup

Terminate the EC2 instance, delete the ECR repository, release any Elastic IP, delete the IAM roles and the OIDC provider.
