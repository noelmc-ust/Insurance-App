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
    if (env.azure.connectionString) {
      this.client = BlobServiceClient.fromConnectionString(env.azure.connectionString);
      const parsed = parseAccountAndKey(env.azure.connectionString);
      if (parsed.accountName && parsed.accountKey) {
        this.sharedCred = new StorageSharedKeyCredential(parsed.accountName, parsed.accountKey);
      }
    } else {
      const credential = new DefaultAzureCredential();
      this.client = new BlobServiceClient(env.azure.accountUrl, credential);
    }
  }

  async ensureContainer() {
    const container = this.client.getContainerClient(env.azure.container);
    await container.createIfNotExists();
  }

  async upload(buffer: Buffer, blobPath: string, contentType: string) {
    const container = this.client.getContainerClient(env.azure.container);
    const blockBlob = container.getBlockBlobClient(blobPath);
    await blockBlob.uploadData(buffer, {
      blobHTTPHeaders: {
        blobContentType: contentType
      }
    });
  }

  async getReadUrl(blobPath: string, expiresMinutes = 5) {
    const container = this.client.getContainerClient(env.azure.container);
    const blobClient = container.getBlobClient(blobPath);

    if (this.sharedCred) {
      const expiresOn = new Date(Date.now() + expiresMinutes * 60 * 1000);
      const sas = generateBlobSASQueryParameters(
        {
          containerName: env.azure.container,
          blobName: blobPath,
          expiresOn,
          permissions: BlobSASPermissions.parse("r"),
          protocol: SASProtocol.HttpsAndHttp
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
        startsOn: new Date(Date.now() - 60 * 1000),
        expiresOn: new Date(Date.now() + expiresMinutes * 60 * 1000),
        protocol: SASProtocol.Https
      },
      delegation,
      env.azure.accountName
    ).toString();
    return `${blobClient.url}?${sas}`;
  }
}

export const storageService = new StorageService();
