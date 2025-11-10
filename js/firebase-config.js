// Firebase Configuration
// Using Firebase Compat SDK (loaded from CDN in index.html)

const firebaseConfig = {
  apiKey: "AIzaSyAGvSIRYI_BDBcXPH1Vr9m8FxD63UMhm3g",
  authDomain: "pixel-relay-game.firebaseapp.com",
  databaseURL: "https://pixel-relay-game-default-rtdb.firebaseio.com",
  projectId: "pixel-relay-game",
  storageBucket: "pixel-relay-game.firebasestorage.app",
  messagingSenderId: "334467411448",
  appId: "1:334467411448:web:02e9368c76581419a77a0d"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
