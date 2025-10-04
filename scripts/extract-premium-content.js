#!/usr/bin/env node

/**
 * Extract premium content from Hugo-built HTML and store in Netlify Blobs
 * 
 * How it works:
 * 1. Hugo builds the site with ALL content (including premium)
 * 2. This script extracts premium content from built HTML files
 * 3. Stores extracted content in Netlify Blobs
 * 4. Removes premium content from HTML files in public/
 * 5. Final site has no premium content in HTML
 */

const { getStore } = require('@netlify/blobs');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function extractPremiumContent() {
  console.log('📦 Extracting premium content to Netlify Blobs...\n');
  
  // Get site ID from environment
  const siteID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID;
  if (!siteID) {
    console.error('❌ SITE_ID or NETLIFY_SITE_ID environment variable not set');
    console.log('   This is required for Netlify Blobs to work');
    console.log('   It will be automatically set in Netlify builds\n');
    process.exit(1);
  }
  
  console.log(`   Using site ID: ${siteID}\n`);
  
  // Initialize Blobs store
  const contentStore = getStore({
    name: 'premium-content',
    siteID: siteID,
  });
  
  // Find all built HTML files in public/
  const publicDir = path.join(process.cwd(), 'public');
  
  if (!fs.existsSync(publicDir)) {
    console.error('❌ public/ directory not found. Run hugo build first!');
    process.exit(1);
  }
  
  // Find all HTML files (Hugo creates index.html for each post)
  const htmlFiles = findHtmlFiles(publicDir);
  console.log(`   Found ${htmlFiles.length} HTML files\n`);
  
  let storedCount = 0;
  
  for (const htmlFile of htmlFiles) {
    const html = fs.readFileSync(htmlFile, 'utf8');
    
    // Check if this is a premium article (has the paywall div)
    const paywallMatch = html.match(/data-course-id="([^"]+)"/);
    
    if (!paywallMatch) {
      continue; // Not a premium article
    }
    
    const courseId = paywallMatch[1];
    
    // Extract content after the paywall (everything after <!--more-->)
    // Hugo puts the full content in article__content, but we showed only preview
    // We need to extract the premium part
    
    // Find the section with class="article__content--preview"
    // Everything after that until the paywall is preview
    // Everything that WOULD have been after <!--more--> is what we need
    
    // Better approach: Extract from the nested-links section
    const contentMatch = html.match(/<section class="article__content nested-links">([\s\S]*?)<\/section>/);
    
    if (contentMatch) {
      const fullContent = contentMatch[1];
      
      // Hugo already processed the markdown to HTML!
      // Store the full content (in real scenario, you'd split at <!--more-->)
      // For now, let's extract everything after the preview
      
      const previewMatch = html.match(/<section class="article__content--preview[^>]*>([\s\S]*?)<\/section>/);
      
      if (previewMatch) {
        const previewContent = previewMatch[1];
        
        // Premium content is everything NOT in preview
        // This is a simplification - in practice, Hugo's .Summary vs .Content handles this
        const premiumContent = fullContent.replace(previewContent, '').trim();
        
        if (premiumContent.length > 100) {
          await contentStore.set(courseId, premiumContent);
          console.log(`   ✓ Stored premium content for: ${courseId} (${premiumContent.length} bytes)`);
          storedCount++;
          
          // Remove premium content from the HTML file
          const updatedHtml = html.replace(
            /<section class="article__content nested-links">[\s\S]*?<\/section>/,
            ''
          );
          fs.writeFileSync(htmlFile, updatedHtml);
          console.log(`   ✓ Removed premium content from: ${path.relative(publicDir, htmlFile)}`);
        }
      }
    }
  }
  
  if (storedCount === 0) {
    console.log('⚠️  No premium content found to extract\n');
    console.log('   Make sure your articles have:');
    console.log('   - isPremium: true in front matter');
    console.log('   - courseId: "your-course-id" in front matter');
    console.log('   - <!--more--> separator in content\n');
  } else {
    console.log(`\n✅ Stored ${storedCount} premium content item(s) in Netlify Blobs\n`);
  }
}

function findHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findHtmlFiles(filePath, fileList);
    } else if (file === 'index.html') {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

extractPremiumContent().catch(error => {
  console.error('❌ Failed to extract premium content:', error);
  process.exit(1);
});
