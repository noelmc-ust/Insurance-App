import { DefaultAzureCredential } from "@azure/identity";
import { ServiceBusClient } from "@azure/service-bus";
import { env } from "../../config/env.js";

class ValidationQueueService {
  private client: ServiceBusClient | null = null;

  private getClient() {
    if (!this.client) {
      if (!env.azure.serviceBusNamespace) {
        throw new Error("Azure Service Bus namespace is not configured.");
      }
      this.client = new ServiceBusClient(env.azure.serviceBusNamespace, new DefaultAzureCredential());
    }
    return this.client;
  }

  async enqueueDocumentValidation(message: Record<string, unknown>) {
    const client = this.getClient();
    const sender = client.createSender(env.azure.validationQueueName);
    await sender.sendMessages({ body: message });
    await sender.close();
  }

  async enqueueNotification(message: Record<string, unknown>) {
    const client = this.getClient();
    const sender = client.createSender(env.azure.notificationQueueName);
    await sender.sendMessages({ body: message });
    await sender.close();
  }
}

export const validationQueueService = new ValidationQueueService();
