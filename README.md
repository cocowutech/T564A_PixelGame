# Pixel Relay: Connect & Compose

A fast-paced, team-based English learning game where students drag an 80s pixel runner to connect letters→words→sentences from teacher-selected texts.

![Game Screenshot](https://via.placeholder.com/800x400?text=Pixel+Relay+Game)

## Game Overview

**Pixel Relay: Connect & Compose** is an innovative educational game that combines spelling, vocabulary, and sentence construction in an engaging, retro-inspired interface. Students work together in teams to complete language challenges while a pixel art runner provides visual feedback on their progress.

### Core Features

- **Two Learning Modes**:
  - Alphabet → Word (spelling & morphology)
  - Word → Sentence (syntax & comprehension)
  - Mixed Relay (combined challenges)

- **Diegetic Feedback System**: An 8-bit pixel runner character that:
  - Sprints forward on correct answers
  - Stumbles on errors
  - Provides visual progress indication

- **Team Competition**: Real-time team progress tracking with shared goals

- **Teacher Control Room**:
  - Live student monitoring
  - Analytics dashboard
  - Broadcast hints
  - Game controls (pause, extend time, etc.)

- **Accessibility Features**:
  - Keyboard navigation
  - High contrast mode (Ctrl+Shift+C)
  - Screen reader support
  - Scalable text

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- A Firebase account
- Modern web browser (Chrome, Firefox, Safari, or Edge)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/cocowutech/T564A_WridgesTeam.git
   cd T564A_WridgesTeam
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**

   a. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)

   b. Enable Realtime Database:
      - Go to Build → Realtime Database
      - Click "Create Database"
      - Start in test mode (for development)

   c. Get your Firebase configuration:
      - Go to Project Settings → General
      - Scroll to "Your apps" section
      - Click on the web icon (</>)
      - Copy the configuration object

   d. Update `js/firebase-config.js`:
   ```javascript
   const firebaseConfig = {
       apiKey: "YOUR_API_KEY",
       authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
       databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_PROJECT_ID.appspot.com",
       messagingSenderId: "YOUR_SENDER_ID",
       appId: "YOUR_APP_ID"
   };
   ```

4. **Set up Firebase Security Rules** (for production)

   In Firebase Console → Realtime Database → Rules:
   ```json
   {
     "rules": {
       "rooms": {
         "$roomCode": {
           ".read": true,
           ".write": true
         }
       }
     }
   }
   ```

5. **Run the application**

   Open `index.html` in your web browser, or use a local server:
   ```bash
   # Using Python 3
   python -m http.server 8000

   # Or using Node.js http-server
   npx http-server
   ```

   Then navigate to `http://localhost:8000`

## How to Play

### For Teachers

1. **Create a Game Room**
   - Click "Teacher Control Room"
   - Enter your name
   - Select a game mode:
     - **Alphabet → Word**: Students spell words letter by letter
     - **Word → Sentence**: Students construct sentences from words
     - **Mixed Relay**: Combination of both modes
   - Paste source text or use a ready prompt
   - Set game duration
   - Click "Create Room"

2. **Share Room Code**
   - Share the 6-character room code with students

3. **Control the Game**
   - Monitor student progress in real-time
   - Start/pause the game
   - Broadcast hints to all students
   - Extend time if needed
   - View live analytics

4. **Review Results**
   - See team completion status
   - View individual student scores
   - Analyze common errors
   - Export data (coming soon)

### For Students

1. **Join a Game**
   - Click "Student Mode"
   - Enter your name
   - Enter the room code from your teacher
   - Click "Join"

2. **Play the Game**
   - Wait for the teacher to start the game
   - **Drag to Connect**: Click and drag from one node to the next
   - **Alphabet → Word Mode**: Connect letters in order to spell the target word
   - **Word → Sentence Mode**: Connect words to build the target sentence

3. **Game Mechanics**
   - Start with 3 lives
   - Correct connection: Runner dashes forward, +1 life (max 5), +score
   - Incorrect connection: Runner stumbles, -1 life
   - Use hints (costs points)
   - Use undo button to fix mistakes

4. **Controls**
   - **Undo**: Click the Undo button or press Ctrl/Cmd+Z
   - **Hint**: Click the Hint button or press Ctrl/Cmd+H
   - **High Contrast**: Press Ctrl+Shift+C

## Game Modes

### Alphabet → Word Mode

Students spell target words by connecting individual letters in the correct order.

**Features:**
- Ghost outlines show target word length
- Green letters indicate correct position
- Amber letters show valid letters in wrong position (optional)

**Example:**
Target: "LEARNING"
Students drag: L → E → A → R → N → I → N → G

### Word → Sentence Mode

Students construct sentences by connecting words in the correct grammatical order.

**Features:**
- Sentence slot frames (Subject / Verb / Object / Modifier)
- Auto-scroll for long sentences
- Mini-map for navigation
- Grammar checking with micro-explanations

**Example:**
Target: "The quick brown fox jumps over the lazy dog"
Students connect words in the correct order

### Mixed Relay Mode

Combines both modes in sequence, creating a complete learning journey from letters to sentences.

## Teacher Ready Prompts

The game includes ready-to-use prompts for content generation:

1. "Extract 8 key academic words and 3 collocations at B1 level"
2. "Create 2 focus sentences using today's vocabulary in active voice"
3. "Generate 1 complex sentence with a relative clause and 1 with a time adverbial"

*Note: In production, these would integrate with AI to generate appropriate content.*

## Scoring System

- **Correct Letter Connection**: +10 points × chain length
- **Correct Word Connection**: +100 points × chain length
- **Speed Bonus**: Extra points for quick completions
- **Accuracy Bonus**: Bonus for no mistakes
- **Hint Usage**: -10 points per hint
- **Life Bonus**: Remaining lives × 50 points at end

## Analytics (Teacher Dashboard)

- **Live Metrics**:
  - Total students
  - Average progress
  - Average score
  - Completion count
  - Struggling students (lives ≤ 1)

- **Post-Game Analytics** (Planned):
  - Common letter confusions
  - Mis-ordered sentence pieces
  - Time-to-complete histograms
  - Error heatmaps
  - Export to CSV/Google Sheets

## Accessibility

### Keyboard Controls

- **Tab**: Navigate between interactive elements
- **Enter/Space**: Select/activate buttons
- **Ctrl/Cmd + Z**: Undo last connection
- **Ctrl/Cmd + H**: Request hint
- **Ctrl + Shift + C**: Toggle high contrast mode
- **Escape**: Close modals

### Screen Reader Support

- ARIA labels on all interactive elements
- Live regions for game feedback
- Semantic HTML structure

### Visual Accessibility

- High contrast mode
- Clear focus indicators
- Scalable text
- Color-blind friendly palette

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Technologies Used

- **Frontend**: Vanilla HTML, CSS, JavaScript (ES6 modules)
- **Real-time Database**: Firebase Realtime Database
- **Animation**: Canvas API for pixel runner
- **Styling**: CSS Custom Properties, Flexbox, Grid

## Project Structure

```
vibe_coding_w5/
├── index.html              # Main HTML file
├── styles/
│   ├── main.css           # Core styles and variables
│   ├── student.css        # Student board styles
│   └── teacher.css        # Teacher control room styles
├── js/
│   ├── main.js            # Application entry point
│   ├── firebase-config.js # Firebase configuration
│   ├── game-state.js      # Game state management
│   ├── student-controller.js  # Student logic
│   ├── teacher-controller.js  # Teacher logic
│   ├── drag-connect.js    # Drag-to-connect mechanic
│   └── runner-animation.js    # Pixel runner animation
├── package.json
└── README.md
```

## Roadmap

### MLP (Minimum Lovable Product) ✅
- [x] Teacher paste text & auto-extract targets
- [x] Student drag-to-connect interaction
- [x] Lives system (3 lives)
- [x] Timer
- [x] Team progress bar
- [x] Accessibility (keyboard, high contrast)

### Next Features
- [ ] Mixed Relay mode (Alphabet→Word → Word→Sentence)
- [ ] Tiered hints with configurable penalties
- [ ] Difficulty tiers (A2–B2) with morphological focus
- [ ] Badges (No-Hint Hero, Clean Chain, Comeback)
- [ ] Advanced analytics (confusion heatmaps, error rates)
- [ ] Export to CSV/Google Sheets
- [ ] LMS integration (join codes)
- [ ] Homework mode
- [ ] Daily classroom leaderboard
- [ ] Sound effects and music toggle
- [ ] Mobile app version

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by classic 80s arcade games
- Built for Harvard VC T564A course
- Designed by the Wridges Team

## Support

For issues, questions, or suggestions, please:
- Open an issue on GitHub
- Contact: [your-email@example.com]

---

**Made with ♥ by the Wridges Team**

*Pixel Relay: Connect & Compose - Making language learning fun, one pixel at a time!*
