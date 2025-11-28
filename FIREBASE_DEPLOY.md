# Firebase Hosting Deployment Guide

This guide will help you deploy the Word Relay game to Firebase Hosting.

## Prerequisites
- A Firebase project (you already have one: `pixel-relay-game`)
- Node.js and npm installed (you have these)
- Firebase CLI installed

---

## Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

If you already have it installed, update it:
```bash
npm install -g firebase-tools@latest
```

---

## Step 2: Login to Firebase

```bash
firebase login
```

This will:
- Open your browser to authenticate
- Ask for permission to access your Firebase projects
- Return you to the terminal once authenticated

---

## Step 3: Initialize Firebase in Your Project

Navigate to your project root and initialize:

```bash
cd /Users/cocowu/Harvard-VC/vibe_coding_w5
firebase init hosting
```

When prompted:
1. **"What do you want to use as your public directory?"** → Type: `./` (current directory, since your `index.html` is in the root)
2. **"Configure as a single-page app?"** → Type: `y` (yes)
3. **"Set up automatic builds and deploys with GitHub?"** → Type: `n` (no, skip for now)
4. **"Overwrite index.html?"** → Type: `n` (no, keep your existing file)

This creates:
- `firebase.json` (deployment config)
- `.firebaserc` (project configuration)

---

## Step 4: Review Configuration Files

### `firebase.json` (auto-generated)
Should look similar to:
```json
{
  "hosting": {
    "public": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### `.firebaserc` (auto-generated)
Should contain:
```json
{
  "projects": {
    "default": "pixel-relay-game"
  }
}
```

---

## Step 5: Deploy to Firebase

```bash
firebase deploy
```

This will:
1. Build and upload your files
2. Show a live URL where your game is hosted
3. Display the deployment summary

**Example output:**
```
✔ Deploy complete!

Project Console: https://console.firebase.google.com/project/pixel-relay-game/overview
Hosting URL: https://pixel-relay-game.web.app
```

---

## Step 6: View Your Live Game

Once deployed, your game will be live at:
- **Primary URL:** `https://pixel-relay-game.web.app`
- **Alternate URL:** `https://pixel-relay-game.firebaseapp.com`

---

## Subsequent Deployments

For future updates, simply run:
```bash
firebase deploy
```

---

## Troubleshooting

### "firebase: command not found"
- Firebase CLI isn't in your PATH
- Solution: Try `npm install -g firebase-tools` again, then close and reopen terminal

### "Error: Failed to get document from Bucket"
- Network issue or Firebase credentials missing
- Solution: Run `firebase login` again

### "Hosting URL not responding"
- Files may still be uploading
- Solution: Wait 1-2 minutes and refresh the page

### "CORS errors in console"
- Your Firebase rules may be blocking requests
- Solution: Check Firebase Console → Realtime Database → Rules

---

## Optional: Add Custom Domain

1. Go to Firebase Console → Hosting → Connect domain
2. Follow the domain verification steps
3. Update DNS records (instructions provided by Firebase)

---

## Next Steps

After deployment:
1. Share the URL with your users
2. Monitor analytics in Firebase Console
3. Update content and redeploy with `firebase deploy`
4. Enable GitHub auto-deploy (optional) in Firebase Console

