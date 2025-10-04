#!/usr/bin/env node

/**
 * Pre-commit hook: Auto-encrypts premium content if source files have changed
 * 
 * This automatically:
 * 1. Finds all unencrypted *-premium.md files
 * 2. Checks if they're newer than their .enc versions
 * 3. Re-encrypts them automatically
 * 4. Stages the updated .enc files
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Colors for terminal output
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

function encrypt(text, key) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key, 'hex'), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return iv.toString('hex') + authTag.toString('hex') + encrypted;
}

function getModifiedFiles() {
  try {
    // Get both staged and unstaged changes
    const staged = execSync('git diff --cached --name-only', { encoding: 'utf8' });
    const unstaged = execSync('git diff --name-only', { encoding: 'utf8' });
    return [...new Set([...staged.trim().split('\n'), ...unstaged.trim().split('\n')])].filter(Boolean);
  } catch (error) {
    return [];
  }
}

function findPremiumFiles() {
  const files = [];
  
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
        walk(fullPath);
      } else if (entry.isFile() && entry.name.match(/-premium\.md$/)) {
        files.push(fullPath);
      }
    }
  }
  
  walk('content');
  return files;
}

function main() {
  const key = process.env.CONTENT_ENCRYPTION_KEY;
  
  if (!key || key.length !== 64) {
    console.log(`${YELLOW}⚠${RESET}  CONTENT_ENCRYPTION_KEY not set, skipping auto-encryption\n`);
    return;
  }
  
  console.log(`${BLUE}🔐 Checking for premium content to encrypt...${RESET}\n`);
  
  const premiumFiles = findPremiumFiles();
  const modifiedFiles = getModifiedFiles();
  
  if (premiumFiles.length === 0) {
    console.log(`${GREEN}✓${RESET} No premium content found\n`);
    return;
  }
  
  let encryptedCount = 0;
  
  for (const sourceFile of premiumFiles) {
    const encFile = sourceFile + '.enc';
    
    // Check if source file was modified
    const sourceModified = modifiedFiles.includes(sourceFile);
    
    // Check if encrypted version exists and is older
    let needsEncryption = false;
    
    if (!fs.existsSync(encFile)) {
      needsEncryption = true;
    } else {
      const sourceStat = fs.statSync(sourceFile);
      const encStat = fs.statSync(encFile);
      
      if (sourceStat.mtime > encStat.mtime) {
        needsEncryption = true;
      }
    }
    
    if (needsEncryption || sourceModified) {
      console.log(`${YELLOW}⚡${RESET} Encrypting: ${sourceFile}`);
      
      try {
        const content = fs.readFileSync(sourceFile, 'utf8');
        const encrypted = encrypt(content, key);
        fs.writeFileSync(encFile, encrypted, 'utf8');
        
        // Stage the encrypted file
        try {
          execSync(`git add "${encFile}"`, { stdio: 'pipe' });
          console.log(`${GREEN}✓${RESET} Encrypted and staged: ${encFile}\n`);
          encryptedCount++;
        } catch (error) {
          console.log(`${GREEN}✓${RESET} Encrypted: ${encFile}\n`);
          encryptedCount++;
        }
      } catch (error) {
        console.error(`${YELLOW}⚠${RESET}  Failed to encrypt ${sourceFile}:`, error.message);
      }
    }
  }
  
  if (encryptedCount === 0) {
    console.log(`${GREEN}✓${RESET} All premium content is up to date\n`);
  } else {
    console.log(`${GREEN}✓${RESET} Auto-encrypted ${encryptedCount} file(s)\n`);
  }
}

main();
