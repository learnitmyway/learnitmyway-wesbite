function getBaseUrl(): string {
  const baseUrl = process.env.URL;
  if (!baseUrl) {
    throw new Error('URL is not set in environment variables');
  }
  return baseUrl;
}

export function generateMagicLink(articleSlug: string, token: string): string {
  const baseUrl = getBaseUrl();
  const url = new URL('/access', baseUrl);
  url.searchParams.set('article', articleSlug);
  url.searchParams.set('token', token);
  return url.toString();
}
