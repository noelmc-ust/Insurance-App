resource "azurerm_servicebus_namespace" "main" {
  name                = var.name
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = "Standard"
}

resource "azurerm_servicebus_queue" "validation" {
  name         = "document-validation"
  namespace_id = azurerm_servicebus_namespace.main.id
}

resource "azurerm_servicebus_queue" "notifications" {
  name         = "document-notifications"
  namespace_id = azurerm_servicebus_namespace.main.id
}
