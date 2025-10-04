#!/usr/bin/env node

/**
 * Build script that decrypts premium content before Hugo build
 * Run during Netlify build process
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const glob = require('glob');

async function buildWithDecryption() {
  console.log('🔐 Starting build with content decryption...\n');
  
  // Step 1: Find all encrypted content files
  const encryptedFiles = glob.sync('content/**/*.enc');
  
  if (encryptedFiles.length === 0) {
    console.log('ℹ️  No encrypted files found, skipping decryption');
  } else {
    console.log(`📄 Found ${encryptedFiles.length} encrypted file(s):\n`);
    
    // Step 2: Decrypt each file
    for (const encFile of encryptedFiles) {
      const outputFile = encFile.replace('.enc', '');
      console.log(`   Decrypting: ${encFile}`);
      
      try {
        execSync(`node scripts/decrypt-content.js "${encFile}" "${outputFile}"`, {
          stdio: 'inherit'
        });
      } catch (error) {
        console.error(`❌ Failed to decrypt ${encFile}`);
        process.exit(1);
      }
    }
    console.log('');
  }
  
  // Step 3: Build Hugo site with premium content included
  console.log('🏗️  Building Hugo site...\n');
  try {
    execSync('hugo', {
      stdio: 'inherit'
    });
    console.log('\n✅ Build complete!');
  } catch (error) {
    console.error('❌ Hugo build failed');
    process.exit(1);
  }
}

buildWithDecryption().catch(error => {
  console.error('Build failed:', error);
  process.exit(1);
});
