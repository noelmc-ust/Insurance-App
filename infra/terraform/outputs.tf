output "resource_group_name" {
  value = azurerm_resource_group.main.name
}

output "frontend_hostname" {
  value = module.appservice.frontend_default_hostname
}

output "backend_hostname" {
  value = module.appservice.backend_default_hostname
}
