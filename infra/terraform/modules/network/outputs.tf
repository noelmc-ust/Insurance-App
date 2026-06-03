output "vnet_id" { value = azurerm_virtual_network.main.id }
output "appgw_subnet_id" { value = azurerm_subnet.appgw.id }
output "appservice_subnet_id" { value = azurerm_subnet.appservice.id }
output "outbound_subnet_id" { value = azurerm_subnet.outbound.id }
output "db_endpoint_subnet_id" { value = azurerm_subnet.dbendpoint.id }
