resource "azurerm_private_endpoint" "backend_pe" {
  name                = "pe-${var.backend_name}"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.private_endpoint_subnet_id

  private_service_connection {
    name                           = "psc-${var.backend_name}"
    private_connection_resource_id = var.backend_id
    subresource_names              = ["sites"]
    is_manual_connection           = false
  }
}

resource "azurerm_private_endpoint" "frontend_pe" {
  name                = "pe-${var.frontend_name}"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.private_endpoint_subnet_id

  private_service_connection {
    name                           = "psc-${var.frontend_name}"
    private_connection_resource_id = var.frontend_id
    subresource_names              = ["sites"]
    is_manual_connection           = false
  }
}
