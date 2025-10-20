# Zugg

<p align="center">
  <img src="https://github.com/dreamvision-dev/Zugg/blob/main/assets/zugg_logo.png?raw=true" alt="Zugg Logo - A pixelated rook next to a pixelated 'Z'">
</p>

> A voice-controlled, retro-terminal chess app.

## About The Project

**Zugg** (from *Zugzwang*) is a minimalist, single-screen chess application designed for hands-free play. It runs entirely in the browser, using a retro CRT terminal aesthetic and the Web Speech API to accept voice commands.

This project was built for a specific use-case: playing a quick game of chess against the computer while working on another task (or another computer), without needing to touch the mouse or keyboard.

**Short Description:** Zugg is a voice-controlled chess app for hands-free play. Featuring a retro CRT terminal aesthetic, it runs entirely in your browser. Use the wake word "Zugg" followed by your move (e.g., "Zugg, pawn e4") to play against a powerful AI opponent. Perfect for multitasking. Built with JavaScript, the Web Speech API, and Stockfish.

### Features
* ⌨️ **Retro Terminal UI:** A single-screen, no-scroll interface styled like a classic green-screen or amber terminal.
* 🎤 **Voice-Only Control:** Play the entire game using the "Zugg" wake word.
* 🤖 **Powerful AI Opponent:** Powered by `stockfish.js`, with adjustable difficulty.
* ♟️ **Full Chess Logic:** All standard chess rules are enforced via `chess.js`.
* 🔊 **Audio/Visual Feedback:** The terminal responds to your commands and indicates move status, checks, and checkmates.

## Tech Stack

* **Frontend:** Vanilla HTML, CSS & JavaScript
* **Chess Logic:** [chess.js](https://github.com/jhlywa/chess.js)
* **Chess AI:** [stockfish.js (WASM)](https://github.com/niklasf/stockfish.js)
* **Voice Input:** [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

## How to Play: Voice Commands

The app is always listening for its wake word: **"Zugg"**.

To issue a command, simply say "Zugg" followed by your instruction.

### Basic Commands
* **"Zugg, new game"**: Starts a new game.
* **"Zugg, set difficulty 5"**: Sets the AI's thinking depth.
* **"Zugg, undo move"**: Takes back the last move (yours and the AI's).

### Making Moves
The speech recognition will try to parse standard moves. For best results, speak clearly.

* **Coordinate Notation (Recommended):**
    * "Zugg, e2 to e4"
    * "Zugg, g1 to f3"
* **Algebraic Notation (More advanced):**
    * "Zugg, pawn e4"
    * "Zugg, knight f3"
* **Castling:**
    * "Zugg, castle kingside"
* **Promotion:**
    * "Zugg, e7 to e8, Queen"

The application will provide text feedback in the terminal log, such as `> INVALID MOVE: e2 to e5` or `> OK. Computer is thinking...`.

## Running Locally

This project requires no build step. You just need a local server to serve the files (which is necessary for the `stockfish.js` WASM module).

1.  **Clone the repo:**
    ```sh
    git clone [https://github.com/dreamvision-dev/Zugg.git](https://github.com/dreamvision-dev/Zugg.git)
    cd Zugg
    ```

2.  **Download Dependencies:**
    * Download `chess.js` and `stockfish.js` from their repositories and place them in a `lib/` folder.

3.  **Run a local server:**
    If you have Node.js, you can use `http-server`:
    ```sh
    npx http-server
    ```
    Or, if you have Python:
    ```sh
    python -m http.server
    ```

4.  **Open the app:**
    Open your browser (Chrome-based recommended for best Speech API support) and go to `http://localhost:8080`.

## License

Distributed under the MIT License. See `LICENSE` for more information.
