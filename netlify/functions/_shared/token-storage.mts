import { getStore } from '@netlify/blobs';

export interface TokenRecord {
  email: string;
  createdAtUtc: string;
  expiresAtUtc: string;
  articleSlug: string;
}

function getTokensStore() {
  return getStore('tokens');
}

function getTokenKey(articleSlug: string, uuid: string) {
  return `token:${articleSlug}:${uuid}`;
}

export async function storeToken(
{ articleSlug, uuid, email, expiresAtUtc }: { articleSlug: string; uuid: string; email: string; expiresAtUtc: string; }): Promise<void> {
  const store = getTokensStore();
  const key = getTokenKey(articleSlug, uuid);
  const tokenRecord: TokenRecord = {
    email: email.toLowerCase().trim(),
    createdAtUtc: new Date().toISOString(),
    expiresAtUtc,
    articleSlug,
  };

  try {
    await store.set(key, JSON.stringify(tokenRecord));
    console.log(`✅ Token stored: ${key}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Failed to store token: ${message}`);
    throw new Error(`Failed to store token: ${message}`);
  }
}