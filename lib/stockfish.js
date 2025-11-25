// Fallback Stockfish (Random Mover)
// Used when real stockfish.js cannot be loaded.

importScripts('chess.js');

const game = new Chess();

onmessage = function (e) {
    const cmd = e.data;

    if (cmd === 'uci') {
        postMessage('id name Stockfish (Fallback)');
        postMessage('id author Zugg');
        postMessage('uciok');
    } else if (cmd === 'isready') {
        postMessage('readyok');
    } else if (cmd.startsWith('position startpos')) {
        game.reset();
        if (cmd.includes('moves')) {
            const moves = cmd.split('moves ')[1].split(' ');
            for (const move of moves) {
                // We need to convert coordinate notation to something chess.js understands?
                // chess.js move() handles {from, to}.
                const from = move.substring(0, 2);
                const to = move.substring(2, 4);
                const promotion = move.length > 4 ? move.substring(4, 5) : undefined;
                game.move({ from, to, promotion: promotion || 'q' });
            }
        }
    } else if (cmd.startsWith('position fen')) {
        const fen = cmd.replace('position fen ', '');
        // FEN might be followed by "moves ..."
        if (fen.includes(' moves ')) {
            const parts = fen.split(' moves ');
            game.load(parts[0]);
            const moves = parts[1].split(' ');
            for (const move of moves) {
                const from = move.substring(0, 2);
                const to = move.substring(2, 4);
                const promotion = move.length > 4 ? move.substring(4, 5) : undefined;
                game.move({ from, to, promotion: promotion || 'q' });
            }
        } else {
            game.load(fen);
        }
    } else if (cmd.startsWith('go')) {
        setTimeout(() => {
            const moves = game.moves({ verbose: true });
            if (moves.length > 0) {
                const m = moves[Math.floor(Math.random() * moves.length)];
                postMessage('bestmove ' + m.from + m.to + (m.promotion || ''));
            } else {
                // No moves (mate or stalemate)
            }
        }, 500); // Simulate thinking time
    } else if (cmd.startsWith('ucinewgame')) {
        game.reset();
    }
};