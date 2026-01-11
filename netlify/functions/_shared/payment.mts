
export function getPaymentProviderApiKey() {
  const apiKey = process.env.PAYMENT_PROVIDER_API_KEY;
  if (!apiKey) {
    throw new Error('PAYMENT_PROVIDER_API_KEY is not set in environment variables');
  }
  return apiKey;
}
