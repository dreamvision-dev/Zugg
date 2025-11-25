# Zugg - Ultimate Pro Edition

[**PLAY NOW**](https://dreamvision-dev.github.io/Zugg/)

<p align="center">
  <img src="assets/zugg_logo.png" alt="Zugg Logo" width="600">
</p>

> A voice-controlled, retro-terminal chess app for the modern power user.

## About The Project

**Zugg** is a high-performance, single-screen chess application designed for hands-free play and multitasking. It combines a nostalgic CRT terminal aesthetic with cutting-edge Web Speech API technology. Created by **Mehmet T. AKALIN**.

**Ultimate Pro Features:**
*   **Hybrid Control:** Play using **Voice Commands** ("Zugg, e4") or **Mouse Click-to-Move**.
*   **Visual Settings:** Customize Themes (Green, Amber, Blue, Red), Difficulty, and Game Modes.
*   **Chess Clock:** Integrated countdown timers for Blitz, Rapid, and Classical games.
*   **Smart TTS:** The app speaks moves back to you ("Knight to f3"), allowing for eyes-free play.
*   **Robust AI:** Powered by Stockfish (via Web Worker) with adjustable skill levels (1-20).

## How to Play

### 1. Voice Control
The app listens for the wake word **"Zugg"** (or aliases like "Zac Brown", "Doug", "Doc").
*   **Move:** "Zugg, pawn to e4", "Zugg, knight takes f3", "Zugg, castle kingside".
*   **Commands:** "Zugg, new game", "Zugg, undo", "Zugg, export game".

### 2. Mouse Control
*   **Click-to-Move:** Click a piece to select it (highlighted), then click a destination square.
*   **Visual Hints:** Valid moves are illuminated on the board.

### 3. Settings Menu
Click **[ SETTINGS ]** to configure:
*   **Theme:** Phosphor Green, Amber Glow, Cyber Blue, Critical Red.
*   **Difficulty:** AI Level 1-20.
*   **Game Mode:** Human vs AI, Human vs Human.
*   **Side:** Play as White or Black.
*   **Time Control:** 5m, 10m, 30m, or None.
*   **Speak Moves:** Toggle Text-to-Speech confirmation (On/Off).

## Tech Stack
*   **Frontend:** Vanilla HTML5, CSS3 (Grid/Flexbox), JavaScript (ES6+)
*   **Chess Logic:** `chess.js`
*   **AI Engine:** `stockfish.js` (WebAssembly/Worker)
*   **Voice:** Web Speech API (SpeechRecognition & SpeechSynthesis)

## Running Locally
No build step required. Serve with any static file server:

```sh
# Python
python3 -m http.server 8080

# Node.js
npx http-server
```

Open `http://localhost:8080` in Chrome (recommended for best speech support).

## License
Distributed under the MIT License.
