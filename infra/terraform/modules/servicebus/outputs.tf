output "namespace_id" { value = azurerm_servicebus_namespace.main.id }
output "namespace_name" { value = azurerm_servicebus_namespace.main.name }
output "validation_queue_name" { value = azurerm_servicebus_queue.validation.name }
output "notification_queue_name" { value = azurerm_servicebus_queue.notifications.name }
