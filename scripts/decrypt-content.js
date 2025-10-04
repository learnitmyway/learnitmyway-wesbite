#!/usr/bin/env node

/**
 * Decrypts premium content files during Netlify build
 * Usage: node scripts/decrypt-content.js <encrypted-file> <output-file>
 * 
 * Requires: CONTENT_ENCRYPTION_KEY environment variable
 */

const crypto = require('crypto');
const fs = require('fs');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function decrypt(encryptedHex, key) {
  // Extract IV (first 32 hex chars = 16 bytes)
  const iv = Buffer.from(encryptedHex.slice(0, IV_LENGTH * 2), 'hex');
  
  // Extract auth tag (next 32 hex chars = 16 bytes)
  const authTag = Buffer.from(
    encryptedHex.slice(IV_LENGTH * 2, (IV_LENGTH + AUTH_TAG_LENGTH) * 2),
    'hex'
  );
  
  // Extract encrypted content (rest)
  const encryptedContent = encryptedHex.slice((IV_LENGTH + AUTH_TAG_LENGTH) * 2);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(key, 'hex'), iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedContent, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

function main() {
  const [inputFile, outputFile] = process.argv.slice(2);
  
  if (!inputFile || !outputFile) {
    console.error('Usage: node decrypt-content.js <encrypted-file> <output-file>');
    process.exit(1);
  }
  
  const key = process.env.CONTENT_ENCRYPTION_KEY;
  if (!key) {
    console.error('Error: CONTENT_ENCRYPTION_KEY environment variable not set');
    process.exit(1);
  }
  
  if (!fs.existsSync(inputFile)) {
    console.error(`Error: Encrypted file not found: ${inputFile}`);
    process.exit(1);
  }
  
  const encryptedContent = fs.readFileSync(inputFile, 'utf8');
  const decrypted = decrypt(encryptedContent, key);
  
  fs.writeFileSync(outputFile, decrypted, 'utf8');
  
  console.log(`✓ Decrypted: ${inputFile} → ${outputFile}`);
}

main();
