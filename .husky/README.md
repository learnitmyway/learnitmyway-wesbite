# Pre-commit Hook for Encrypted Content

Automatically encrypts premium content before committing - no manual steps required!

## 🎯 Problem It Solves

You edit `content/post/article-premium.md` but forget to run the encryption script. **This hook does it for you automatically!** 🎉

## 🛡️ How It Works

Before every commit, the hook:

1. ✅ Finds all `*-premium.md` files in `content/`
2. ✅ Checks if they're newer than their `.enc` versions
3. ✅ Auto-encrypts any that need updating
4. ✅ Auto-stages the updated `.enc` files

## 📦 Setup

Already done! The hook is installed at `.husky/pre-commit`.

## 🧪 Test It

### 1. Create premium content:
```bash
echo "# Premium Content\nThis is secret!" > content/post/test-premium.md
```

### 2. Set encryption key in .env:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" > key.txt
echo "CONTENT_ENCRYPTION_KEY=$(cat key.txt)" > .env
rm key.txt
```

### 3. Try to commit:
```bash
git add content/post/test-premium.md
git commit -m "Add premium content"
```

**✨ Hook automatically encrypts!**
```
🔐 Checking for premium content to encrypt...

⚡ Encrypting: content/post/test-premium.md
✓ Encrypted and staged: content/post/test-premium.md.enc

✓ Auto-encrypted 1 file(s)

[paywal-encrypt-premium-content abc1234] Add premium content
```

### 4. Edit the content:
```bash
echo "\nMore secret content!" >> content/post/test-premium.md
```

### 5. Commit again:
```bash
git commit -am "Update premium content"
```

**✨ Hook re-encrypts automatically!**

## 🔧 What Gets Checked

The hook compares:
- **File modification times** (mtime) - Is source newer than encrypted version?
- **Git status** - Was the source file modified?

If source file is newer OR modified → **Auto-encrypt and stage**

## ⚙️ Configuration

The hook runs automatically. No configuration needed!

To skip the check (not recommended):
```bash
git commit --no-verify -m "Skip pre-commit hooks"
```

## 💡 Tips

1. **Set CONTENT_ENCRYPTION_KEY in .env** - The hook skips encryption if key is not set
2. **Premium files are gitignored** - Only `.enc` files are committed
3. **Check git status** - You'll see the `.enc` file staged automatically

## 🎬 Workflow

```bash
# 1. Edit content
vim content/post/article-premium.md

# 2. Commit (hook does the rest!)
git commit -am "Update premium content"
# ✨ Hook auto-encrypts → auto-stages .enc → commit succeeds
```

That's it! No manual encryption needed.

## 🐛 Troubleshooting

**Hook doesn't run:**
```bash
# Make it executable
chmod +x .husky/pre-commit
```

**"CONTENT_ENCRYPTION_KEY not set" warning:**
```bash
# Create .env file with your key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy output to .env
echo "CONTENT_ENCRYPTION_KEY=<your_key>" > .env
```

**Want to disable:**
```bash
# Remove the hook
rm .husky/pre-commit
```

## 🚀 Why This Matters

Without this hook:
- ❌ Easy to forget encryption step
- ❌ Old content deploys to production
- ❌ Manual encryption every time
- ❌ Extra git add command

With this hook:
- ✅ **Fully automatic** - just edit and commit
- ✅ Always deploy latest content
- ✅ No manual steps to remember
- ✅ .enc files automatically staged
- ✅ Zero-friction workflow
