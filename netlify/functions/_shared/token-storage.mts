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

export async function getToken(
  articleSlug: string,
  uuid: string
): Promise<TokenRecord | null> {
  const store = getTokensStore();
  const key = getTokenKey(articleSlug, uuid);

  try {
    const tokenData = await store.get(key, { type: 'text' });
    if (!tokenData) {
      return null;
    }
    // tokenData is already a string when using type: 'text'
    return JSON.parse(tokenData) as TokenRecord;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Failed to get token: ${message}`);
    throw new Error(`Failed to get token: ${message}`);
  }
}

export async function renewToken(
  articleSlug: string,
  uuid: string,
  email: string
): Promise<void> {
  const tokenExpirationDays = 30;
  const expiresAtUtc = new Date();
  expiresAtUtc.setDate(expiresAtUtc.getDate() + tokenExpirationDays);
  const expiresAtUtcString = expiresAtUtc.toISOString();

  await storeToken({ articleSlug, uuid, email, expiresAtUtc: expiresAtUtcString });
  console.log(`✅ Token renewed: ${getTokenKey(articleSlug, uuid)}`);
}