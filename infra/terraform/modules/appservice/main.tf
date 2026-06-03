resource "azurerm_service_plan" "main" {
  name                = var.app_service_plan_name
  resource_group_name = var.resource_group_name
  location            = var.location
  os_type             = "Linux"
  sku_name            = "B1"
}

resource "azurerm_linux_web_app" "backend" {
  name                = var.backend_name
  resource_group_name = var.resource_group_name
  location            = var.location
  service_plan_id     = azurerm_service_plan.main.id

  identity {
    type = "SystemAssigned"
  }

  site_config {
    always_on = true
    application_stack {
      docker_image_name   = var.backend_image_name
      docker_registry_url = "https://ghcr.io"
    }
  }

  app_settings = {
    PORT                                = "5000"
    NODE_ENV                            = "production"
    CORS_ORIGIN                         = var.cors_origin
    DB_HOST                             = var.sql_server_fqdn
    DB_PORT                             = "1433"
    DB_USER                             = var.sql_admin_login
    DB_PASSWORD                         = var.sql_admin_password
    DB_NAME                             = var.sql_database_name
    AZURE_BLOB_CONTAINER                = "claims-documents"
    AZURE_TEMP_BLOB_CONTAINER           = "claims-validation-temp"
    AZURE_STORAGE_ACCOUNT_NAME          = var.storage_account_name
    AZURE_STORAGE_ACCOUNT_URL           = "https://${var.storage_account_name}.blob.core.windows.net"
    AZURE_STORAGE_CONNECTION_STRING     = ""
    AZURE_SERVICEBUS_NAMESPACE          = var.azure_servicebus_namespace
    AZURE_SERVICEBUS_VALIDATION_QUEUE   = "document-validation"
    AZURE_SERVICEBUS_NOTIFICATION_QUEUE = "document-notifications"
    OCR_API_KEY                         = var.ocr_api_key
    OCR_API_URL                         = var.ocr_api_url
  }
}

resource "azurerm_linux_web_app" "frontend" {
  name                = var.frontend_name
  resource_group_name = var.resource_group_name
  location            = var.location
  service_plan_id     = azurerm_service_plan.main.id

  identity {
    type = "SystemAssigned"
  }

  site_config {
    always_on = true
    application_stack {
      docker_image_name   = var.frontend_image_name
      docker_registry_url = "https://ghcr.io"
    }
  }

  app_settings = {
    VITE_API_BASE = var.frontend_api_base
  }
}

resource "azurerm_app_service_virtual_network_swift_connection" "backend_vnet" {
  app_service_id = azurerm_linux_web_app.backend.id
  subnet_id      = var.outbound_subnet_id
}

resource "azurerm_app_service_virtual_network_swift_connection" "frontend_vnet" {
  app_service_id = azurerm_linux_web_app.frontend.id
  subnet_id      = var.outbound_subnet_id
}

module "private_endpoints" {
  source = "./private-endpoints"

  backend_name               = var.backend_name
  frontend_name              = var.frontend_name
  backend_id                 = azurerm_linux_web_app.backend.id
  frontend_id                = azurerm_linux_web_app.frontend.id
  location                   = var.location
  resource_group_name        = var.resource_group_name
  private_endpoint_subnet_id = var.app_service_subnet_id
}
