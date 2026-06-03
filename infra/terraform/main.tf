terraform {
  required_version = ">= 1.6.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
}

provider "azurerm" {
  features {}
}

module "network" {
  source = "./modules/network"

  name                    = var.name
  location                = var.location
  resource_group_name     = azurerm_resource_group.main.name
  vnet_cidr               = var.vnet_cidr
  appgw_subnet_cidr       = var.appgw_subnet_cidr
  appservice_subnet_cidr  = var.appservice_subnet_cidr
  outbound_subnet_cidr    = var.outbound_subnet_cidr
  db_endpoint_subnet_cidr = var.db_endpoint_subnet_cidr
}

module "storage" {
  source = "./modules/storage"

  name                       = "insurancedocsnmc1"
  location                   = var.location
  resource_group_name        = azurerm_resource_group.main.name
  vnet_id                    = module.network.vnet_id
  private_endpoint_subnet_id = module.network.db_endpoint_subnet_id
}

module "sql" {
  source = "./modules/sql"

  name                       = "noel-sql-server"
  location                   = var.location
  resource_group_name        = azurerm_resource_group.main.name
  admin_login                = var.sql_admin_login
  admin_password             = var.sql_admin_password
  database_name              = var.sql_database_name
  vnet_id                    = module.network.vnet_id
  private_endpoint_subnet_id = module.network.db_endpoint_subnet_id
}

module "servicebus" {
  source = "./modules/servicebus"

  name                = "sb-insurance-${var.name}"
  location            = var.location
  resource_group_name = azurerm_resource_group.main.name
}

module "function" {
  source = "./modules/function"

  name                           = "func-insurance-${var.name}"
  location                       = var.location
  resource_group_name            = azurerm_resource_group.main.name
  app_service_plan_id            = module.appservice.plan_id
  storage_account_name           = module.storage.account_name
  storage_account_key            = module.storage.primary_access_key
  servicebus_namespace_name      = module.servicebus.namespace_name
  validation_queue_name          = module.servicebus.validation_queue_name
  notification_queue_name        = module.servicebus.notification_queue_name
  app_service_subnet_id          = module.network.appservice_subnet_id
  app_service_outbound_subnet_id = module.network.outbound_subnet_id
}

module "appservice" {
  source = "./modules/appservice"

  name                       = var.name
  location                   = var.location
  resource_group_name        = azurerm_resource_group.main.name
  app_service_plan_name      = "plan-${var.name}"
  backend_name               = "insurance-backend-app"
  frontend_name              = "insurance-frontend-app"
  vnet_id                    = module.network.vnet_id
  app_service_subnet_id      = module.network.appservice_subnet_id
  outbound_subnet_id         = module.network.outbound_subnet_id
  storage_account_name       = module.storage.account_name
  storage_account_key        = module.storage.primary_access_key
  backend_image_name         = var.backend_image_name
  frontend_image_name        = var.frontend_image_name
  cors_origin                = var.cors_origin
  frontend_api_base          = var.frontend_api_base
  azure_servicebus_namespace = var.azure_servicebus_namespace
  ocr_api_key                = var.ocr_api_key
  ocr_api_url                = var.ocr_api_url
  sql_server_fqdn            = module.sql.server_fqdn
  sql_database_name          = module.sql.database_name
  sql_admin_login            = var.sql_admin_login
  sql_admin_password         = var.sql_admin_password
}

module "appgateway" {
  source = "./modules/appgateway"

  name                      = "agw-${var.name}"
  location                  = var.location
  resource_group_name       = azurerm_resource_group.main.name
  subnet_id                 = module.network.appgw_subnet_id
  vnet_id                   = module.network.vnet_id
  frontend_app_service_name = module.appservice.frontend_default_hostname
  backend_app_service_name  = module.appservice.backend_default_hostname
}

resource "azurerm_resource_group" "main" {
  name     = "rg-${var.name}"
  location = var.location
}
