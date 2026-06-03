output "vm_public_ip" {
  description = "Public IP address of the Azure VM that runs the Docker Compose stack."
  value       = azurerm_public_ip.vm.ip_address
}

output "ssh_command" {
  description = "Example SSH command to connect to the VM."
  value       = "ssh ${var.admin_username}@${azurerm_public_ip.vm.ip_address}"
}

output "app_urls" {
  description = "URLs exposed by the Docker Compose stack on the VM."
  value = {
    frontend = "http://${azurerm_public_ip.vm.ip_address}:3000"
    backend  = "http://${azurerm_public_ip.vm.ip_address}:5000"
  }
}
