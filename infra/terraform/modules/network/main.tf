resource "azurerm_virtual_network" "main" {
  name                = "vnet-${var.name}"
  address_space       = [var.vnet_cidr]
  location            = var.location
  resource_group_name = var.resource_group_name
}

resource "azurerm_subnet" "appgw" {
  name                 = "AppGw"
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [var.appgw_subnet_cidr]
}

resource "azurerm_subnet" "appservice" {
  name                 = "AppService"
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [var.appservice_subnet_cidr]
}

resource "azurerm_subnet" "outbound" {
  name                 = "AppOutBound"
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [var.outbound_subnet_cidr]
}

resource "azurerm_subnet" "dbendpoint" {
  name                 = "DBEndpoint"
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [var.db_endpoint_subnet_cidr]
}
