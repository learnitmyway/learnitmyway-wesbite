# Premium Content Encryption System

This system allows you to commit premium content to your public GitHub repository while keeping it secure through encryption.

## 🔐 Overview

- **Write** premium content as `*-premium.md` files locally
- **Encrypt** manually OR automatically on commit (via Git hook)
- **Commit** encrypted `.enc` files to public GitHub repo
- **Build** Netlify decrypts using secret environment variable
- **Deploy** Hugo processes decrypted content normally

## 🎯 Benefits

✅ **Version controlled** - Encrypted files tracked in Git  
✅ **Open source code** - All your engineering showcased on GitHub  
✅ **Secure content** - Encrypted files are gibberish without key  
✅ **Automated** - Pre-commit hook handles encryption  
✅ **Professional** - Uses AES-256-GCM encryption (industry standard)

## 🚀 Quick Start

### 1. Generate Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the 64-character hex string output.

### 2. Create Local .env File

```bash
echo "CONTENT_ENCRYPTION_KEY=<your_key>" > .env
```

Replace `<your_key>` with the key from step 1.

### 3. Create Premium Content

```bash
# Create a premium article
cat > content/post/my-tutorial-premium.md << 'EOF'
---
title: "My Premium Tutorial"
type: post
date: 2025-10-04
---

This is premium content that will be encrypted!

## Secret Section

Only paying customers will see this.
EOF
```

### 4. Commit (Automatic Encryption)

```bash
git add content/post/my-tutorial-premium.md
git commit -m "Add premium tutorial"
```

The pre-commit hook automatically:
- 🔐 Encrypts `my-tutorial-premium.md` → `my-tutorial-premium.md.enc`
- ✅ Stages the `.enc` file
- 🚀 Continues with commit

### 5. Push to GitHub

```bash
git push
```

Only the `.enc` file is pushed (source file is gitignored).

### 6. Configure Netlify

1. Go to: **Site settings → Environment variables**
2. Add variable:
   - **Key**: `CONTENT_ENCRYPTION_KEY`
   - **Value**: Your 64-character hex key (same as in `.env`)
3. Save

### 7. Update Build Command (Optional)

If you want automatic decryption during Netlify builds:

**Option A: Update netlify.toml**
```toml
[build]
  command = "node scripts/build-with-decryption.js"
  publish = "public"
```

**Option B: Update package.json**
```json
{
  "scripts": {
    "build": "node scripts/build-with-decryption.js"
  }
}
```

Then in netlify.toml:
```toml
[build]
  command = "npm run build"
  publish = "public"
```

## 📝 Manual Encryption (Optional)

If you prefer manual control:

```bash
node scripts/encrypt-content.js \
  content/post/article-premium.md \
  content/post/article-premium.md.enc
```

Then commit:
```bash
git add content/post/article-premium.md.enc
git commit -m "Add encrypted content"
```

## 🔄 Updating Premium Content

### With Auto-Encryption (Recommended)

```bash
# 1. Edit content
vim content/post/article-premium.md

# 2. Commit
git commit -am "Update premium content"
# Hook auto-encrypts and stages .enc file
```

### Manual

```bash
# 1. Edit content
vim content/post/article-premium.md

# 2. Re-encrypt
node scripts/encrypt-content.js \
  content/post/article-premium.md \
  content/post/article-premium.md.enc

# 3. Commit
git add content/post/article-premium.md.enc
git commit -m "Update premium content"
```

## 📁 File Structure

```
content/post/
├── my-article.md                  # Free content (committed)
├── my-tutorial-premium.md         # Premium source (NOT committed - gitignored)
└── my-tutorial-premium.md.enc     # Encrypted (committed to GitHub)
```

On GitHub, people see:
- ✅ `my-article.md` - Readable free content
- ✅ `my-tutorial-premium.md.enc` - Gibberish encrypted data
- ❌ `my-tutorial-premium.md` - Not present

## 🔒 Security Details

**Encryption Algorithm**: AES-256-GCM
- **Key size**: 256 bits (32 bytes)
- **IV**: Random 16 bytes per encryption
- **Auth tag**: 16 bytes for integrity verification
- **Industry standard**: Used by governments and enterprises

**What's Protected**:
- ✅ Content text (encrypted in public repo)
- ✅ Only readable with decryption key
- ✅ Key never in public repo

**What's Public**:
- Encrypted files (useless without key)
- All code (Hugo templates, scripts, etc.)
- Site structure and free content

**Attack Vectors**:
- ✅ Reading `.enc` files on GitHub → Just gibberish
- ✅ Cloning repo → Can't decrypt without key
- ⚠️ Compromised encryption key → Could decrypt all content
- ⚠️ Netlify account access → Could read environment variables

## 🛠️ Scripts Reference

### encrypt-content.js
Manually encrypt a file:
```bash
node scripts/encrypt-content.js <input> <output>
```

### decrypt-content.js
Manually decrypt a file (requires CONTENT_ENCRYPTION_KEY):
```bash
node scripts/decrypt-content.js <encrypted> <output>
```

### auto-encrypt-content.js
Pre-commit hook that automatically encrypts modified premium files:
```bash
node scripts/auto-encrypt-content.js
```

### build-with-decryption.js
Build script for Netlify that decrypts before Hugo build:
```bash
node scripts/build-with-decryption.js
```

## 🧪 Testing Locally

```bash
# 1. Create test premium file
echo "# Secret\nPremium content" > content/post/test-premium.md

# 2. Set encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" > .key
echo "CONTENT_ENCRYPTION_KEY=$(cat .key)" > .env
rm .key

# 3. Test manual encryption
node scripts/encrypt-content.js \
  content/post/test-premium.md \
  content/post/test-premium.md.enc

# 4. Test decryption
node scripts/decrypt-content.js \
  content/post/test-premium.md.enc \
  content/post/test-decrypted.md

# 5. Verify content matches
diff content/post/test-premium.md content/post/test-decrypted.md
# Should show no differences

# 6. Test build script
node scripts/build-with-decryption.js

# 7. Clean up test files
rm content/post/test-*
```

## 🆘 Troubleshooting

### "CONTENT_ENCRYPTION_KEY must be set (64-character hex string)"

**Problem**: Environment variable not configured  
**Solution**: Create `.env` file with your key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy output
echo "CONTENT_ENCRYPTION_KEY=<output>" > .env
```

### "Error: Invalid key length"

**Problem**: Key is not exactly 64 hex characters (32 bytes)  
**Solution**: Generate a new key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Decrypted files appearing in Git

**Problem**: `.gitignore` not configured correctly  
**Solution**: Verify `.gitignore` contains:
```
content/**/*-premium.md
```

### Build fails on Netlify

**Problem**: Encryption key not set in Netlify  
**Solution**:
1. Go to Site Settings → Environment Variables
2. Add `CONTENT_ENCRYPTION_KEY` with your key
3. Redeploy

### Pre-commit hook not running

**Problem**: Hook file not executable  
**Solution**:
```bash
chmod +x .husky/pre-commit scripts/auto-encrypt-content.js
```

## 🤔 FAQ

**Q: Can someone decrypt my content by reading the scripts?**  
A: No. The scripts show HOW to decrypt, but not the KEY. Without the 64-character secret key, the encrypted files are useless.

**Q: What if I lose my encryption key?**  
A: You'll need to re-encrypt all premium files with a new key. Keep the key safe (password manager, etc.)!

**Q: Can I use different keys for different files?**  
A: The current setup uses one key for all files. You could modify the scripts to support multiple keys, but it adds complexity.

**Q: Is this more secure than a private repo?**  
A: Private repos are more secure (content never public). This is best for: open source code + protected content.

**Q: Does this work with Hugo's live reload?**  
A: Yes! Decrypted files are treated as normal markdown by Hugo.

## 📚 Additional Resources

- [Husky Git Hooks Documentation](https://typicode.github.io/husky/)
- [Node.js Crypto Module](https://nodejs.org/api/crypto.html)
- [AES-GCM Encryption](https://en.wikipedia.org/wiki/Galois/Counter_Mode)
- [Netlify Environment Variables](https://docs.netlify.com/configure-builds/environment-variables/)

## 🎉 Summary

This encryption system gives you:
1. ✅ Version control for premium content
2. ✅ Open source code repository
3. ✅ Protected premium content
4. ✅ Automated workflow (pre-commit hook)
5. ✅ Professional-grade encryption

**Simple workflow**: Edit → Commit → Push → Deploy!

The hook handles encryption automatically. Just code and commit normally! 🚀
