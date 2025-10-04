#!/usr/bin/env node

/**
 * Encrypts premium content files for safe commit to public repository
 * Usage: node scripts/encrypt-content.js <input-file> <output-file>
 * 
 * Requires: CONTENT_ENCRYPTION_KEY environment variable (32-byte hex string)
 * Generate key: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function encrypt(text, key) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key, 'hex'), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Return: iv + authTag + encrypted content (all hex)
  return iv.toString('hex') + authTag.toString('hex') + encrypted;
}

function main() {
  const [inputFile, outputFile] = process.argv.slice(2);
  
  if (!inputFile || !outputFile) {
    console.error('Usage: node encrypt-content.js <input-file> <output-file>');
    console.error('Example: node encrypt-content.js content/post/article-premium.md content/post/article-premium.md.enc');
    process.exit(1);
  }
  
  const key = process.env.CONTENT_ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    console.error('Error: CONTENT_ENCRYPTION_KEY must be set (64-character hex string)');
    console.error('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
    process.exit(1);
  }
  
  if (!fs.existsSync(inputFile)) {
    console.error(`Error: Input file not found: ${inputFile}`);
    process.exit(1);
  }
  
  const content = fs.readFileSync(inputFile, 'utf8');
  const encrypted = encrypt(content, key);
  
  fs.writeFileSync(outputFile, encrypted, 'utf8');
  
  console.log(`✓ Encrypted: ${inputFile} → ${outputFile}`);
  console.log(`  Size: ${content.length} bytes → ${encrypted.length} bytes`);
}

main();
