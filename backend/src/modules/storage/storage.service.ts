import {
  BlobSASPermissions,
  BlobServiceClient,
  SASProtocol,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters
} from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";
import { env } from "../../config/env.js";

function parseAccountAndKey(connectionString: string) {
  const map = new Map<string, string>();
  for (const part of connectionString.split(";")) {
    const [k, v] = part.split("=");
    if (k && v) map.set(k, v);
  }
  return {
    accountName: map.get("AccountName") || "",
    accountKey: map.get("AccountKey") || ""
  };
}

class StorageService {
  private client: BlobServiceClient;
  private sharedCred: StorageSharedKeyCredential | null = null;

  constructor() {
    const hasPlaceholder = (v: string) => /<[^>]+>/.test(v);

    if (env.azure.connectionString && !hasPlaceholder(env.azure.connectionString)) {
      this.client = BlobServiceClient.fromConnectionString(env.azure.connectionString);
      const parsed = parseAccountAndKey(env.azure.connectionString);
      if (parsed.accountName && parsed.accountKey) {
        this.sharedCred = new StorageSharedKeyCredential(parsed.accountName, parsed.accountKey);
      }
    } else {
      if (
        !env.azure.accountUrl ||
        !env.azure.accountName ||
        hasPlaceholder(env.azure.accountUrl) ||
        hasPlaceholder(env.azure.accountName)
      ) {
        throw new Error(
          "Azure storage is not configured correctly. Provide a real AZURE_STORAGE_CONNECTION_STRING, or valid AZURE_STORAGE_ACCOUNT_NAME + AZURE_STORAGE_ACCOUNT_URL."
        );
      }
      const credential = new DefaultAzureCredential();
      this.client = new BlobServiceClient(env.azure.accountUrl, credential);
    }
  }

  async ensureContainer(containerName = env.azure.container) {
    const container = this.client.getContainerClient(containerName);
    await container.createIfNotExists();
  }

  async upload(buffer: Buffer, blobPath: string, contentType: string, containerName = env.azure.container) {
    const container = this.client.getContainerClient(containerName);
    const blockBlob = container.getBlockBlobClient(blobPath);
    await blockBlob.uploadData(buffer, {
      blobHTTPHeaders: {
        blobContentType: contentType
      }
    });
  }

  async uploadToContainer(buffer: Buffer, blobPath: string, contentType: string, containerName: string) {
    return this.upload(buffer, blobPath, contentType, containerName);
  }

  async copyBlob(sourceContainer: string, sourcePath: string, destinationContainer: string, destinationPath: string) {
    const source = this.client.getContainerClient(sourceContainer).getBlockBlobClient(sourcePath);
    const destination = this.client.getContainerClient(destinationContainer).getBlockBlobClient(destinationPath);
    await destination.beginCopyFromURL(source.url);
  }

  async deleteBlob(containerName: string, blobPath: string) {
    const container = this.client.getContainerClient(containerName);
    await container.getBlockBlobClient(blobPath).deleteIfExists();
  }

  async getReadUrl(blobPath: string, expiresMinutes = 5) {
    const container = this.client.getContainerClient(env.azure.container);
    const blobClient = container.getBlobClient(blobPath);

    if (this.sharedCred) {
      const startsOn = new Date(Date.now() - 5 * 60 * 1000);
      const expiresOn = new Date(Date.now() + expiresMinutes * 60 * 1000);
      const sas = generateBlobSASQueryParameters(
        {
          containerName: env.azure.container,
          blobName: blobPath,
          startsOn,
          expiresOn,
          permissions: BlobSASPermissions.parse("r"),
          protocol: SASProtocol.Https,
          version: "2020-08-04"
        },
        this.sharedCred
      ).toString();
      return `${blobClient.url}?${sas}`;
    }

    const delegation = await this.client.getUserDelegationKey(
      new Date(Date.now() - 5 * 60 * 1000),
      new Date(Date.now() + expiresMinutes * 60 * 1000)
    );
    const sas = generateBlobSASQueryParameters(
      {
        containerName: env.azure.container,
        blobName: blobPath,
        permissions: BlobSASPermissions.parse("r"),
        startsOn: new Date(Date.now() - 5 * 60 * 1000),
        expiresOn: new Date(Date.now() + expiresMinutes * 60 * 1000),
        protocol: SASProtocol.Https,
        version: "2020-08-04"
      },
      delegation,
      env.azure.accountName
    ).toString();
    return `${blobClient.url}?${sas}`;
  }

  async download(blobPath: string) {
    const container = this.client.getContainerClient(env.azure.container);
    const blobClient = container.getBlobClient(blobPath);
    return blobClient.download();
  }
}

export const storageService = new StorageService();
