resource "azurerm_public_ip" "main" {
  name                = "pip-${var.name}"
  location            = var.location
  resource_group_name = var.resource_group_name
  allocation_method   = "Static"
  sku                 = "Standard"
}

resource "azurerm_application_gateway" "main" {
  name                = var.name
  resource_group_name = var.resource_group_name
  location            = var.location

  sku {
    name     = "Standard_v2"
    tier     = "Standard_v2"
    capacity = 1
  }

  gateway_ip_configuration {
    name      = "gateway-ip-config"
    subnet_id = var.subnet_id
  }

  frontend_ip_configuration {
    name                 = "frontend-ip"
    public_ip_address_id = azurerm_public_ip.main.id
  }

  frontend_port {
    name = "http-port"
    port = 80
  }

  backend_address_pool {
    name  = "pool-backend"
    fqdns = [var.backend_app_service_name]
  }

  backend_address_pool {
    name  = "pool-frontend"
    fqdns = [var.frontend_app_service_name]
  }

  probe {
    name                = "probe-backend"
    host                = var.backend_app_service_name
    path                = "/"
    protocol            = "Http"
    interval            = 30
    timeout             = 30
    unhealthy_threshold = 3
    match {
      status_code = ["200-399"]
    }
  }

  probe {
    name                = "probe-frontend"
    host                = var.frontend_app_service_name
    path                = "/"
    protocol            = "Http"
    interval            = 30
    timeout             = 30
    unhealthy_threshold = 3
    match {
      status_code = ["200-399"]
    }
  }

  backend_http_settings {
    name                  = "backend-http"
    cookie_based_affinity = "Disabled"
    port                  = 80
    protocol              = "Http"
    request_timeout       = 30
    probe_name            = "probe-backend"
  }

  backend_http_settings {
    name                  = "frontend-http"
    cookie_based_affinity = "Disabled"
    port                  = 80
    protocol              = "Http"
    request_timeout       = 30
    probe_name            = "probe-frontend"
  }

  http_listener {
    name                           = "listener-http"
    frontend_ip_configuration_name = "frontend-ip"
    frontend_port_name             = "http-port"
    protocol                       = "Http"
  }

  request_routing_rule {
    name                       = "rule-path-based"
    priority                   = 100
    rule_type                  = "PathBasedRouting"
    http_listener_name         = "listener-http"
    backend_address_pool_name  = "pool-backend"
    backend_http_settings_name = "backend-http"
    url_path_map_name          = "path-map"
  }

  url_path_map {
    name                               = "path-map"
    default_backend_address_pool_name  = "pool-frontend"
    default_backend_http_settings_name = "frontend-http"

    path_rule {
      name                       = "api-rule"
      paths                      = ["/api/*"]
      backend_address_pool_name  = "pool-backend"
      backend_http_settings_name = "backend-http"
    }
  }
}
