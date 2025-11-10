# Quick Setup Guide for Pixel Relay

## Step-by-Step Setup (5 minutes)

### 1. Firebase Configuration

This is the **most important step** to get the game working!

**a. Create Firebase Project:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name it (e.g., "pixel-relay-game")
4. Disable Google Analytics (optional, for simplicity)
5. Click "Create project"

**b. Enable Realtime Database:**
1. In Firebase Console, click "Build" → "Realtime Database"
2. Click "Create Database"
3. Choose a location (e.g., us-central1)
4. Select "Start in **test mode**" (for development)
5. Click "Enable"

**c. Get Firebase Configuration:**
1. Click the gear icon ⚙️ next to "Project Overview"
2. Click "Project settings"
3. Scroll down to "Your apps"
4. Click the web icon `</>`
5. Register your app (name it anything)
6. Copy the `firebaseConfig` object

**d. Update the Code:**
1. Open `js/firebase-config.js`
2. Replace the placeholder values with your Firebase config:

```javascript
const firebaseConfig = {
    apiKey: "AIza...",  // Your actual API key
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project.firebaseio.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123"
};
```

### 2. Run the Game

**Option A: Simple (Just double-click)**
- Open `index.html` in your browser
- If you see Firebase errors in the console, your config is wrong

**Option B: Local Server (Recommended)**
```bash
# Python 3
python -m http.server 8000

# Then open: http://localhost:8000
```

**Option C: Node.js http-server**
```bash
npx http-server

# Then open the URL shown in terminal
```

### 3. Test the Game

**Test as Teacher:**
1. Click "Teacher Control Room"
2. Enter your name: "Test Teacher"
3. Select mode: "Alphabet → Word"
4. Paste this sample text:
   ```
   Learning is a wonderful process that helps us grow and develop new skills.
   ```
5. Click "Create Room"
6. Note the room code (e.g., "ABC123")

**Test as Student:**
1. Open a new browser window/tab
2. Go to the same URL
3. Click "Student Mode"
4. Enter name: "Test Student"
5. Enter the room code from above
6. Click "Join"

**Play the Game:**
1. In teacher window, click "Start Game"
2. In student window, drag to connect letters to spell words
3. Watch the pixel runner animate!

## Troubleshooting

### Firebase Errors

**Error: "Firebase not initialized"**
- You didn't update `js/firebase-config.js` with your actual config

**Error: "Permission denied"**
- Your Realtime Database rules are too strict
- Go to Firebase Console → Realtime Database → Rules
- For testing, use:
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
⚠️ **Warning:** These rules are for development only! Secure them for production.

### Module Errors

**Error: "Cannot use import outside a module"**
- Make sure you're running from a server (Option B or C above)
- Don't just open the file directly in some browsers

### Nothing Happens When Playing

**Check:**
1. Open browser console (F12)
2. Look for red error messages
3. Most common: Firebase config is wrong

## Quick Firebase Rules for Production

```json
{
  "rules": {
    "rooms": {
      "$roomCode": {
        ".read": true,
        ".write": "auth != null || !data.exists()"
      }
    }
  }
}
```

## Next Steps

Once you have the basic game working:

1. **Customize the styling** in `styles/main.css`
2. **Add your own content** by modifying the ready prompts
3. **Integrate AI** for automatic content generation (optional)
4. **Deploy to hosting** (Firebase Hosting, Netlify, Vercel, etc.)

## Common Questions

**Q: Can I use this without Firebase?**
A: Not easily. Firebase handles the real-time multiplayer. You'd need to replace it with another real-time database (Socket.io, Supabase, etc.)

**Q: How many students can play at once?**
A: Firebase Spark (free) plan supports enough for a classroom (~30 students). For larger scale, upgrade to Blaze plan.

**Q: Can I customize the pixel runner?**
A: Yes! Edit `js/runner-animation.js`. The `drawRunner()` method draws the character using basic shapes.

**Q: How do I deploy this online?**
A:
1. Use Firebase Hosting: `firebase init hosting` → `firebase deploy`
2. Or use Netlify: Drag and drop your folder
3. Or use GitHub Pages: Enable in repository settings

## Support

If you get stuck:
1. Check the browser console for errors
2. Verify your Firebase config is correct
3. Make sure Realtime Database is enabled
4. Check that you're running from a server (not file://)

Good luck! 🎮
