variable "name" {
  type    = string
  default = "insurance"
}

variable "location" {
  type    = string
  default = "westus2"
}

variable "vnet_cidr" { default = "192.168.0.0/16" }
variable "appgw_subnet_cidr" { default = "192.168.10.0/24" }
variable "appservice_subnet_cidr" { default = "192.168.20.0/24" }
variable "outbound_subnet_cidr" { default = "192.168.30.0/24" }
variable "db_endpoint_subnet_cidr" { default = "192.168.40.0/24" }

variable "sql_admin_login" { default = "noelad" }
variable "sql_admin_password" { default = "Insurancedb@123" }
variable "sql_database_name" { default = "insurance_db" }

variable "backend_image_name" { default = "ghcr.io/your-org/insurance-app-backend:latest" }
variable "frontend_image_name" { default = "ghcr.io/your-org/insurance-app-frontend:latest" }
variable "cors_origin" { default = "https://your-domain.example" }
variable "frontend_api_base" { default = "https://your-domain.example/api" }
variable "azure_servicebus_namespace" { default = "" }
variable "ocr_api_key" { default = "K84743447488957" }
variable "ocr_api_url" { default = "https://api.ocr.space/parse/image" }
