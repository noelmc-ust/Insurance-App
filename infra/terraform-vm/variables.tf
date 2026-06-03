variable "name" {
  type    = string
  default = "insurance-vm"
}

variable "location" {
  type    = string
  default = "westus2"
}

variable "vnet_cidr" {
  type    = string
  default = "10.10.0.0/16"
}

variable "subnet_cidr" {
  type    = string
  default = "10.10.1.0/24"
}

variable "vm_name" {
  type    = string
  default = "insurance-docker-vm"
}

variable "vm_size" {
  type    = string
  default = "Standard_B2s"
}

variable "admin_username" {
  type    = string
  default = "azureuser"
}

variable "admin_ssh_public_key" {
  type = string
}

variable "repo_url" {
  type    = string
  default = "https://github.com/your-org/insurance.git"
}

variable "azure_storage_connection_string" {
  type    = string
  default = ""
}

variable "azure_blob_container" {
  type    = string
  default = "claims-documents"
}

variable "azure_temp_blob_container" {
  type    = string
  default = "claims-validation-temp"
}

variable "azure_servicebus_namespace" {
  type    = string
  default = ""
}

variable "azure_servicebus_validation_queue" {
  type    = string
  default = "document-validation"
}

variable "azure_servicebus_notification_queue" {
  type    = string
  default = "document-notifications"
}

variable "ocr_api_key" {
  type    = string
  default = "K84743447488957"
}

variable "ocr_api_url" {
  type    = string
  default = "https://api.ocr.space/parse/image"
}
