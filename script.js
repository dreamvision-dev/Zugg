// Zugg - Ultimate Pro Version
// Voice & Mouse Controlled Retro Chess

let game = null;
let engine = null;
let recognition = null;
let audioCtx = null;

// Game State
let gameState = {
    isEngineReady: false,
    playerColor: 'w', // 'w' or 'b'
    difficulty: 5,
    gameMode: 'ai', // 'ai' or 'human'
    timeControl: 10, // minutes
    timers: { w: 600, b: 600 }, // seconds
    timerInterval: null,
    selectedSquare: null,
    voiceEnabled: false,
    isFlipped: false,
    speakMoves: true
};

// DOM Elements
const els = {
    board: document.getElementById('board-display'),
    log: document.getElementById('log-display'),
    input: document.getElementById('command-input'),
    status: document.getElementById('game-status'),
    turn: document.getElementById('turn-indicator'),
    voiceBtn: document.getElementById('btn-voice'),
    timerW: document.getElementById('timer-white'),
    timerB: document.getElementById('timer-black'),
    moveList: document.getElementById('move-list'),
    modal: document.getElementById('settings-modal'),
    // Settings inputs
    setTheme: document.getElementById('setting-theme'),
    setDiff: document.getElementById('setting-difficulty'),
    setDiffVal: document.getElementById('difficulty-val'),
    setMode: document.getElementById('setting-mode'),
    setSide: document.getElementById('setting-side'),
    setTime: document.getElementById('setting-time'),
    setSpeak: document.getElementById('setting-speak'),
};

// --- INITIALIZATION ---

function init() {
    log("INITIALIZING ZUGG PRO SYSTEM...");

    try {
        game = new Chess();
        log("CHESS LOGIC LOADED.");
    } catch (e) {
        log("CRITICAL ERROR: CHESS.JS FAILED.");
        return;
    }

    initEngine();
    initAudio();
    initVoice();
    setupEventListeners();

    // Initial Render
    setTheme('green');
    startNewGame();
}

function initEngine() {
    try {
        if (typeof STOCKFISH === "function") {
            engine = STOCKFISH();
            bindEngineEvents();
        } else if (typeof Worker === "function") {
            engine = new Worker('lib/stockfish.js');
            bindEngineEvents();
        } else {
            log("WARNING: STOCKFISH NOT FOUND.");
        }
    } catch (e) {
        log("WARNING: AI ENGINE ERROR: " + e.message);
    }
}

function bindEngineEvents() {
    engine.onmessage = function (event) {
        const line = event.data;
        if (line === 'uciok') {
            gameState.isEngineReady = true;
            // log("AI ENGINE ONLINE.");
        } else if (line.startsWith('bestmove')) {
            const move = line.split(' ')[1];
            makeMove(move);
        }
    };
    engine.postMessage('uci');
    engine.postMessage('isready');
}

function initAudio() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
    } catch (e) { }
}

function initVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            log("VOICE ENGINE STARTED.");
            updateVoiceUI(true);
        };

        recognition.onend = () => {
            // log("VOICE ENGINE STOPPED.");
            if (gameState.voiceEnabled) {
                try { recognition.start(); } catch (e) { }
            } else {
                updateVoiceUI(false);
            }
        };

        recognition.onerror = (event) => {
            log(`VOICE ERROR: ${event.error}`);
            if (event.error === 'not-allowed') {
                gameState.voiceEnabled = false;
                updateVoiceUI(false);
                log("CHECK MICROPHONE PERMISSIONS.");
            }
        };

        recognition.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript.trim();
            log(`> HEARD: "${transcript}"`);
            handleCommand(transcript);
        };
    } else {
        log("VOICE NOT SUPPORTED IN THIS BROWSER.");
        els.voiceBtn.disabled = true;
        els.voiceBtn.textContent = "[ VOICE: N/A ]";
    }
}

function toggleVoice() {
    if (!recognition) return;

    gameState.voiceEnabled = !gameState.voiceEnabled;

    if (gameState.voiceEnabled) {
        try {
            recognition.start();
        } catch (e) {
            log("VOICE START FAILED: " + e.message);
            gameState.voiceEnabled = false;
        }
    } else {
        recognition.stop();
    }
    updateVoiceUI(gameState.voiceEnabled);
}

function setupEventListeners() {
    // Input Box
    els.input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleCommand(els.input.value);
            els.input.value = '';
        }
    });

    // Buttons
    document.getElementById('btn-new-game').onclick = startNewGame;
    document.getElementById('btn-undo').onclick = undoMove;
    document.getElementById('btn-settings').onclick = () => els.modal.classList.remove('hidden');
    document.getElementById('btn-close-settings').onclick = () => els.modal.classList.add('hidden');
    document.getElementById('btn-save-settings').onclick = applySettings;

    els.voiceBtn.onclick = toggleVoice;

    // Settings
    els.setDiff.oninput = (e) => els.setDiffVal.textContent = e.target.value;
}

// --- CORE GAME LOGIC ---

function startNewGame() {
    game.reset();
    gameState.timers.w = gameState.timeControl * 60;
    gameState.timers.b = gameState.timeControl * 60;
    gameState.selectedSquare = null;

    // Apply initial settings
    if (gameState.isEngineReady) engine.postMessage('ucinewgame');

    stopTimer();
    if (gameState.timeControl > 0) startTimer();

    renderBoard();
    updateStatus();
    updateHistory();
    updateTimerDisplay();
    log("NEW GAME STARTED.");
    speak("New game started.");

    // If AI is white (player is black)
    if (gameState.gameMode === 'ai' && gameState.playerColor === 'b') {
        makeAiMove();
    }
}

function makeMove(moveStr) {
    if (game.game_over()) return;

    let move = null;
    try {
        // Try simple move first
        move = game.move(moveStr, { sloppy: true });

        // Try verbose object if string failed (for promotion etc)
        if (!move && typeof moveStr === 'string' && moveStr.length >= 4) {
            const from = moveStr.substring(0, 2);
            const to = moveStr.substring(2, 4);
            const promotion = moveStr.length > 4 ? moveStr.substring(4, 5) : 'q'; // Default to queen
            move = game.move({ from, to, promotion });
        }
    } catch (e) { }

    if (move) {
        playTone(800, 'square', 0.1); // Success sound
        renderBoard();
        updateStatus();
        updateHistory();

        // Speak move
        const pieceNames = { p: 'Pawn', n: 'Knight', b: 'Bishop', r: 'Rook', q: 'Queen', k: 'King' };
        const piece = pieceNames[move.piece] || 'Piece';
        const capture = move.flags.includes('c') ? 'takes ' : 'to ';
        const text = `${piece} ${capture} ${move.to}`;
        speak(text);

        // Check Game Over
        if (game.game_over()) {
            stopTimer();
            const result = game.in_checkmate() ? "Checkmate" : "Draw";
            log("GAME OVER: " + result.toUpperCase());
            speak("Game over. " + result);
            return;
        }

        if (game.in_check()) {
            speak("Check");
        }

        // AI Turn
        if (gameState.gameMode === 'ai' && game.turn() !== gameState.playerColor) {
            makeAiMove();
        }
    } else {
        playTone(150, 'sawtooth', 0.3); // Error sound
        log(`INVALID MOVE: ${moveStr}`);
        speak("Invalid move");
    }
}

function makeAiMove() {
    if (gameState.isEngineReady) {
        // log("THINKING...");
        engine.postMessage(`position fen ${game.fen()}`);
        engine.postMessage(`go depth ${gameState.difficulty}`);
    }
}

function undoMove() {
    game.undo();
    if (gameState.gameMode === 'ai') game.undo(); // Undo AI too
    renderBoard();
    updateStatus();
    updateHistory();
    log("MOVE UNDONE.");
    speak("Move undone");
}

// --- INTERACTION ---

function handleSquareClick(square) {
    if (gameState.gameMode === 'ai' && game.turn() !== gameState.playerColor) return; // Not your turn
    if (game.game_over()) return;

    // If selecting same square, deselect
    if (gameState.selectedSquare === square) {
        gameState.selectedSquare = null;
        renderBoard();
        return;
    }

    // If we have a selected square, try to move
    if (gameState.selectedSquare) {
        const move = {
            from: gameState.selectedSquare,
            to: square,
            promotion: 'q' // Always promote to queen for simplicity in click-to-move
        };

        // Check if valid move
        const validMove = game.move(move);
        if (validMove) {
            game.undo(); // Undo the test move
            makeMove(validMove.from + validMove.to + (validMove.promotion || ''));
            gameState.selectedSquare = null;
            return;
        }

        // If not valid move, but clicking another piece of own color, select it
        const piece = game.get(square);
        if (piece && piece.color === game.turn()) {
            gameState.selectedSquare = square;
            renderBoard();
        } else {
            gameState.selectedSquare = null;
            renderBoard();
        }
    } else {
        // Select piece
        const piece = game.get(square);
        if (piece && piece.color === game.turn()) {
            gameState.selectedSquare = square;
            renderBoard();
        }
    }
}

function handleCommand(raw) {
    const cmd = raw.toLowerCase().replace(/[^a-z0-9\s]/g, '');

    // Wake word aliases (common mishearings)
    // Sort by length (descending) to ensure "zac brown" is matched before "zac"
    const wakeWords = [
        'zac brown', 'zac pawn', 'zugg', 'zug', 'zag', 'zog',
        'doug', 'doc', 'duck', 'thug', 'bug', 'jug',
        'sack', 'sock', 'zac', 'zack', 'zach', 'jack'
    ];
    const pattern = new RegExp(`^(${wakeWords.join('|')})\\s+`);

    const clean = cmd.replace(pattern, '').trim();

    if (clean === 'new game') return startNewGame();
    if (clean === 'undo') return undoMove();
    if (clean === 'export game') {
        navigator.clipboard.writeText(game.pgn());
        log("PGN COPIED.");
        speak("Game exported");
        return;
    }

    // Settings commands
    if (clean.startsWith('set theme')) {
        const t = clean.split(' ').pop();
        setTheme(t);
        return;
    }

    // Move parsing
    const move = parseMove(clean);
    if (move) makeMove(move);
    else {
        log("UNKNOWN COMMAND.");
        speak("Unknown command");
    }
}

function parseMove(text) {
    let clean = text.replace(/\sto\s/g, '');

    // Handle captures
    clean = clean.replace(/\s(takes|captures|capture|x)\s/g, 'x');

    // Number words
    const nums = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8 };
    for (let k in nums) clean = clean.replace(new RegExp(k, 'g'), nums[k]);

    // Piece names
    const pieces = { pawn: '', knight: 'N', bishop: 'B', rook: 'R', queen: 'Q', king: 'K' };
    for (let k in pieces) if (clean.startsWith(k)) clean = clean.replace(k, pieces[k]);

    return clean.replace(/\s/g, '');
}

// --- UI & RENDERING ---

function renderBoard() {
    const boardArr = game.board();
    let html = '<div class="chess-grid">';

    // Flip board if playing as black
    const isFlipped = gameState.playerColor === 'b' && gameState.gameMode === 'ai';

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            // Adjust indices based on orientation
            const i = isFlipped ? 7 - r : r;
            const j = isFlipped ? 7 - c : c;

            const square = boardArr[i][j];
            const squareName = String.fromCharCode(97 + j) + (8 - i);
            const isLight = (i + j) % 2 === 0;

            let classes = `cell ${isLight ? 'light' : 'dark'}`;
            if (gameState.selectedSquare === squareName) classes += ' selected';

            // Highlight valid moves
            if (gameState.selectedSquare) {
                const moves = game.moves({ square: gameState.selectedSquare, verbose: true });
                if (moves.find(m => m.to === squareName)) classes += ' highlight';
            }

            const piece = square ? getPieceSymbol(square.type, square.color) : '';

            let coords = '';
            if (j === (isFlipped ? 7 : 0)) coords += `<span class="rank">${8 - i}</span>`;
            if (i === (isFlipped ? 0 : 7)) coords += `<span class="file">${String.fromCharCode(97 + j)}</span>`;

            html += `<div class="${classes}" onclick="handleSquareClick('${squareName}')">
                        ${coords}
                        <span class="piece">${piece}</span>
                     </div>`;
        }
    }
    html += '</div>';
    els.board.innerHTML = html;
}

function updateStatus() {
    let status = 'IN PROGRESS';
    if (game.in_checkmate()) status = 'CHECKMATE';
    else if (game.in_draw()) status = 'DRAW';
    else if (game.in_check()) status = 'CHECK';

    els.status.textContent = status;
    els.turn.textContent = game.turn() === 'w' ? 'WHITE' : 'BLACK';
}

function updateHistory() {
    const history = game.history({ verbose: true });
    let html = '';
    for (let i = 0; i < history.length; i += 2) {
        const num = Math.floor(i / 2) + 1;
        const w = history[i] ? history[i].san : '';
        const b = history[i + 1] ? history[i + 1].san : '';
        html += `<div class="move-row"><span class="move-num">${num}.</span><span class="move-white">${w}</span><span class="move-black">${b}</span></div>`;
    }
    els.moveList.innerHTML = html;
    els.moveList.scrollTop = els.moveList.scrollHeight;
}

// --- SETTINGS & UTILS ---

function applySettings() {
    setTheme(els.setTheme.value);
    gameState.difficulty = parseInt(els.setDiff.value);
    gameState.gameMode = els.setMode.value;
    gameState.playerColor = els.setSide.value;
    gameState.timeControl = parseInt(els.setTime.value);
    gameState.speakMoves = els.setSpeak.value === 'on';

    if (gameState.isEngineReady) {
        engine.postMessage(`setoption name Skill Level value ${gameState.difficulty}`);
    }

    els.modal.classList.add('hidden');
    startNewGame(); // Restart with new settings
}

function setTheme(theme) {
    document.body.className = `theme-${theme}`;
    els.setTheme.value = theme;
}

function toggleVoice() {
    if (!recognition) return;

    gameState.voiceEnabled = !gameState.voiceEnabled;

    if (gameState.voiceEnabled) {
        try {
            recognition.start();
        } catch (e) {
            log("VOICE START FAILED: " + e.message);
            gameState.voiceEnabled = false;
        }
    } else {
        recognition.stop();
    }
    updateVoiceUI(gameState.voiceEnabled);
}

function updateVoiceUI(active) {
    els.voiceBtn.textContent = `[ VOICE: ${active ? 'ON' : 'OFF'} ]`;
    els.voiceBtn.style.color = active ? '#0f0' : 'var(--terminal-color)';
}

// --- TIMER ---

function startTimer() {
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);
    gameState.timerInterval = setInterval(() => {
        const turn = game.turn();
        if (gameState.timers[turn] > 0) {
            gameState.timers[turn]--;
            updateTimerDisplay();
        } else {
            stopTimer();
            log(`TIME OUT! ${turn === 'w' ? 'BLACK' : 'WHITE'} WINS.`);
            speak("Time out");
        }
    }, 1000);
}

function stopTimer() {
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);
}

function updateTimerDisplay() {
    els.timerW.textContent = formatTime(gameState.timers.w);
    els.timerB.textContent = formatTime(gameState.timers.b);
}

function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

// --- AUDIO ---
function playTone(freq, type, dur) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + dur);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + dur);
}

function speak(text) {
    if (!gameState.speakMoves) return;
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    }
}

function getPieceSymbol(type, color) {
    const symbols = {
        w: { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔' },
        b: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♔' } // Fixed black king symbol
    };
    return symbols[color][type] || '?';
}

function log(msg) {
    const div = document.createElement('div');
    div.className = 'log-entry';
    div.textContent = `> ${msg}`;
    els.log.appendChild(div);
    els.log.scrollTop = els.log.scrollHeight;
}

// Add Grid CSS
const style = document.createElement('style');
style.textContent = `
    .chess-grid {
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        grid-template-rows: repeat(8, 1fr);
        width: 100%;
        max-width: 500px;
        aspect-ratio: 1;
        border: 2px solid var(--terminal-color);
    }
    .cell {
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
        font-size: 2rem;
        user-select: none;
    }
    .cell.light { background-color: rgba(51, 255, 0, 0.1); }
    .cell.dark { background-color: rgba(51, 255, 0, 0.05); }
    .rank { position: absolute; left: 2px; top: 2px; font-size: 0.6rem; }
    .file { position: absolute; right: 2px; bottom: 2px; font-size: 0.6rem; }
`;
document.head.appendChild(style);

window.onload = init;
