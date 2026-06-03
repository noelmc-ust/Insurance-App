output "plan_id" { value = azurerm_service_plan.main.id }
output "backend_default_hostname" { value = azurerm_linux_web_app.backend.default_hostname }
output "frontend_default_hostname" { value = azurerm_linux_web_app.frontend.default_hostname }
