resource "azurerm_storage_account" "func" {
  name                     = substr(replace(var.name, "-", ""), 0, 24)
  resource_group_name      = var.resource_group_name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "azurerm_linux_function_app" "main" {
  name                       = var.name
  location                   = var.location
  resource_group_name        = var.resource_group_name
  service_plan_id            = var.app_service_plan_id
  storage_account_name       = azurerm_storage_account.func.name
  storage_account_access_key = azurerm_storage_account.func.primary_access_key

  identity {
    type = "SystemAssigned"
  }

  site_config {
    always_on = true
    application_stack {
      node_version = "20"
    }
  }

  app_settings = {
    FUNCTIONS_WORKER_RUNTIME            = "node"
    AzureWebJobsStorage                 = "DefaultEndpointsProtocol=https;AccountName=${azurerm_storage_account.func.name};AccountKey=${azurerm_storage_account.func.primary_access_key};EndpointSuffix=core.windows.net"
    AZURE_STORAGE_ACCOUNT_URL           = "https://${var.storage_account_name}.blob.core.windows.net"
    AZURE_BLOB_CONTAINER                = "claims-documents"
    AZURE_TEMP_BLOB_CONTAINER           = "claims-validation-temp"
    AZURE_SERVICEBUS_NAMESPACE          = var.servicebus_namespace_name
    AZURE_SERVICEBUS_VALIDATION_QUEUE   = var.validation_queue_name
    AZURE_SERVICEBUS_NOTIFICATION_QUEUE = var.notification_queue_name
    DB_HOST                             = ""
    DB_NAME                             = ""
    DB_USER                             = ""
    DB_PASSWORD                         = ""
  }
}
