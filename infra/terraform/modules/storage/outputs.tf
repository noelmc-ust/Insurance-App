output "account_name" { value = azurerm_storage_account.main.name }
output "primary_access_key" { value = azurerm_storage_account.main.primary_access_key }
output "id" { value = azurerm_storage_account.main.id }
output "claims_container_name" { value = azurerm_storage_container.claims.name }
output "temp_container_name" { value = azurerm_storage_container.temp.name }
