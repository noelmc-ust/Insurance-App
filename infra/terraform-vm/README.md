# Azure VM Docker Compose deployment

This folder is for the Azure VM path where Docker Compose runs on a Linux VM in Azure.

## What it creates
- 1 resource group
- 1 virtual network + subnet
- 1 public IP
- 1 Linux VM
- Docker + Docker Compose installed automatically
- the repo cloned to /opt/insurance
- the existing docker-compose.yml started on the VM

## How to use it
1. Copy terraform.tfvars.example to terraform.tfvars.
2. Replace the placeholders with your real values.
3. Run:
   terraform init
   terraform plan
   terraform apply
4. Use the printed public IP and the example SSH command.

## Notes
- The VM uses the repository URL you provide and runs the existing Docker Compose stack from that repo.
- The OCR key is already pre-filled in the example tfvars file as requested.
- This folder is separate from the App Service Terraform path under infra/terraform/.
