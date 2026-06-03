import { DefaultAzureCredential } from "@azure/identity";
import { ServiceBusClient } from "@azure/service-bus";
import { env } from "../../config/env.js";

class ValidationQueueService {
  private client: ServiceBusClient | null = null;

  private getClient() {
    if (!this.client) {
      if (env.azure.serviceBusConnectionString) {
        this.client = new ServiceBusClient(env.azure.serviceBusConnectionString);
        return this.client;
      }

      if (!env.azure.serviceBusNamespace) {
        throw new Error("Azure Service Bus is not configured. Set AZURE_SERVICEBUS_CONNECTION_STRING or AZURE_SERVICEBUS_NAMESPACE.");
      }

      this.client = new ServiceBusClient(env.azure.serviceBusNamespace, new DefaultAzureCredential());
    }
    return this.client;
  }

  async enqueueDocumentValidation(message: Record<string, unknown>) {
    const client = this.getClient();
    if (!client) {
      throw new Error("Service Bus client is not initialized.");
    }
    const sender = client.createSender(env.azure.validationQueueName);
    await sender.sendMessages({ body: message });
    await sender.close();
  }

  async enqueueNotification(message: Record<string, unknown>) {
    const client = this.getClient();
    if (!client) {
      throw new Error("Service Bus client is not initialized.");
    }
    const sender = client.createSender(env.azure.notificationQueueName);
    await sender.sendMessages({ body: message });
    await sender.close();
  }
}

export const validationQueueService = new ValidationQueueService();
