export function generateMagicLink(baseUrl: string, articleSlug: string, token: string): string {
  const url = new URL('/access', baseUrl);
  url.searchParams.set('article', articleSlug);
  url.searchParams.set('token', token);
  return url.toString();
}
