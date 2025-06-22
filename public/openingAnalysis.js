document.addEventListener('DOMContentLoaded', function() {
    const openingAnalysisSection = document.getElementById('opening-analysis');
    const playerCheckboxesContainer = document.getElementById('player-checkboxes');
    const selectAllBtn = document.getElementById('select-all-btn');
    const deselectAllBtn = document.getElementById('deselect-all-btn');
    const analyzeBtn = document.getElementById('analyze-btn');
    const mainAnalyzeBtn = document.getElementById('main-analyze-btn');
    const moveListContainer = document.getElementById('move-list');
    const positionStatsContainer = document.getElementById('position-stats');
    const prevMoveBtn = document.getElementById('prev-move');
    const nextMoveBtn = document.getElementById('next-move');
    const flipBoardBtn = document.getElementById('flip-board');

    let chessBoard = null;
    let chessGame = null;
    let currentPosition = 'start';
    let moveHistory = [];
    let boardOrientation = 'white';
    let selectedPlayers = [];
    let playerGameCounts = {};
    let openingTreeData = {};

    function initializeChess() {
        chessGame = new Chess();

        const boardConfig = {
            position: 'start',
            draggable: true,
            pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
            onDragStart: onDragStart,
            onDrop: onDrop,
            onSnapEnd: onSnapEnd
        };

        if (chessBoard) {
            chessBoard.destroy();
        }

        chessBoard = Chessboard('chess-board', boardConfig);

        moveHistory = [];
        currentPosition = 'start';
        updateMoveList();
        updatePositionStats();

        window.addEventListener('resize', function() {
            if (chessBoard) {
                chessBoard.resize();
            }
        });
    }

    function onDragStart(source, piece) {
        if (chessGame.game_over()) return false;

        if ((chessGame.turn() === 'w' && piece.search(/^b/) !== -1) ||
            (chessGame.turn() === 'b' && piece.search(/^w/) !== -1)) {
            return false;
        }
    }

    function onDrop(source, target) {
        const move = chessGame.move({
            from: source,
            to: target,
            promotion: 'q'
        });

        if (move === null) return 'snapback';

        moveHistory.push({
            notation: move.san,
            fen: chessGame.fen(),
            frequency: calculateMoveFrequency(move.san, moveHistory.length)
        });

        currentPosition = chessGame.fen();
        updateMoveList();
        updatePositionStats();
    }

    function calculateMoveFrequency(moveNotation, moveIndex) {
        if (!openingTreeData || !openingTreeData.moves) return 0;

        if (moveIndex === 0) {
            const move = openingTreeData.moves.find(m => m.san === moveNotation);
            if (move) {
                return Math.round((move.playCount / openingTreeData.totalGames) * 100);
            }
            return 0;
        }

        let currentNode = openingTreeData;
        for (let i = 0; i < moveIndex; i++) {
            const moveSan = moveHistory[i].notation;
            const nextNode = currentNode.moves.find(m => m.san === moveSan);
            if (!nextNode) return 0;
            currentNode = nextNode;
        }

        const move = currentNode.moves?.find(m => m.san === moveNotation);
        if (move && currentNode.playCount) {
            return Math.round((move.playCount / currentNode.playCount) * 100);
        }
        return 0;
    }

    function onSnapEnd() {
        chessBoard.position(chessGame.fen());
    }

    function updateMoveList() {
        moveListContainer.innerHTML = '';

        if (moveHistory.length === 0) {
            moveListContainer.innerHTML = '<div class="no-moves">No moves played yet.</div>';
            return;
        }

        const tempChess = new Chess();

        for (let i = 0; i < moveHistory.length; i++) {
            const move = moveHistory[i];
            const moveNumber = Math.floor(i / 2) + 1;
            const isWhiteMove = i % 2 === 0;

            const moveItem = document.createElement('div');
            moveItem.className = 'move-item';
            moveItem.dataset.index = i;

            moveItem.innerHTML = `
                <span class="move-number">${isWhiteMove ? moveNumber + '.' : ''}</span>
                <span class="move-notation">${move.notation}</span>
                <span class="move-frequency">${move.frequency > 0 ? (move.frequency + '%') : ''}</span>
            `;

            moveItem.addEventListener('click', function() {
                navigateToMove(parseInt(this.dataset.index));
            });

            moveListContainer.appendChild(moveItem);

            try {
                tempChess.move(move.notation);
            } catch (e) {
                console.error('Error replaying move:', e);
            }
        }
    }

    function updatePositionStats() {
        positionStatsContainer.innerHTML = '';

        const statsHeader = document.createElement('div');
        statsHeader.className = 'stats-header';
        statsHeader.textContent = 'Position Statistics';
        positionStatsContainer.appendChild(statsHeader);

        const statsGrid = document.createElement('div');
        statsGrid.className = 'stats-grid';

        const turnBox = createStatBox(
            'Turn',
            chessGame.turn() === 'w' ? 'White' : 'Black'
        );
        statsGrid.appendChild(turnBox);

        const evalBox = createStatBox(
            'Frequency',
            'Calculating...'
        );
        statsGrid.appendChild(evalBox);

        const contBox = createStatBox(
            'Top Continuation',
            'Analyzing...'
        );
        statsGrid.appendChild(contBox);

        const fenBox = createStatBox(
            'FEN',
            chessGame.fen().split(' ')[0]
        );
        statsGrid.appendChild(fenBox);

        positionStatsContainer.appendChild(statsGrid);

        updatePositionStatsFromData();
    }

    function updatePositionStatsFromData() {
        if (!openingTreeData || !openingTreeData.moves) {
            return;
        }

        let currentNode = openingTreeData;
        let frequency = 0;
        let topContinuation = '';
        let topContinuationCount = 0;

        for (let i = 0; i < moveHistory.length; i++) {
            const moveSan = moveHistory[i].notation;
            const nextNode = currentNode.moves?.find(m => m.san === moveSan);
            if (!nextNode) break;
            currentNode = nextNode;
        }

        if (currentNode.playCount && openingTreeData.totalGames) {
            frequency = Math.round((currentNode.playCount / openingTreeData.totalGames) * 100);
        }

        if (currentNode.moves && currentNode.moves.length > 0) {
            const sortedMoves = [...currentNode.moves].sort((a, b) => b.playCount - a.playCount);
            topContinuation = sortedMoves[0].san;
            topContinuationCount = sortedMoves[0].playCount;
        }

        const frequencyStat = document.querySelector('.stat-box:nth-child(2) .stat-value');
        if (frequencyStat) {
            frequencyStat.textContent = frequency > 0 ? `${frequency}%` : 'N/A';
        }

        const continuationStat = document.querySelector('.stat-box:nth-child(3) .stat-value');
        if (continuationStat) {
            if (topContinuation) {
                const percentage = currentNode.playCount ? Math.round((topContinuationCount / currentNode.playCount) * 100) : 0;
                continuationStat.textContent = `${topContinuation} (${percentage}%)`;
            } else {
                continuationStat.textContent = 'N/A';
            }
        }
    }

    function createStatBox(label, value) {
        const statBox = document.createElement('div');
        statBox.className = 'stat-box';

        statBox.innerHTML = `
            <div class="stat-label">${label}</div>
            <div class="stat-value">${value}</div>
        `;

        return statBox;
    }

    function navigateToMove(moveIndex) {
        if (moveIndex < 0 || moveIndex >= moveHistory.length) return;

        chessGame = new Chess();
        const tempChess = new Chess();

        for (let i = 0; i <= moveIndex; i++) {
            try {
                chessGame.move(moveHistory[i].notation);
                tempChess.move(moveHistory[i].notation);
            } catch (e) {
                console.error('Error replaying move:', e);
            }
        }

        chessBoard.position(chessGame.fen());
        currentPosition = chessGame.fen();

        const moveItems = document.querySelectorAll('.move-item');
        moveItems.forEach(item => {
            item.classList.remove('active');
            if (parseInt(item.dataset.index) === moveIndex) {
                item.classList.add('active');
                item.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });

        updatePositionStats();
    }

    function navigateToPreviousMove() {
        const currentMoveIndex = getCurrentMoveIndex();
        if (currentMoveIndex > 0) {
            navigateToMove(currentMoveIndex - 1);
        } else {
            chessGame = new Chess();
            chessBoard.position('start');
            currentPosition = 'start';
            updatePositionStats();

            const moveItems = document.querySelectorAll('.move-item');
            moveItems.forEach(item => item.classList.remove('active'));
        }
    }

    function navigateToNextMove() {
        const currentMoveIndex = getCurrentMoveIndex();
        if (currentMoveIndex < moveHistory.length - 1) {
            navigateToMove(currentMoveIndex + 1);
        }
    }

    function getCurrentMoveIndex() {
        for (let i = moveHistory.length - 1; i >= 0; i--) {
            if (moveHistory[i].fen.split(' ')[0] === currentPosition.split(' ')[0]) {
                return i;
            }
        }
        return -1;
    }

    function flipBoard() {
        boardOrientation = boardOrientation === 'white' ? 'black' : 'white';
        chessBoard.orientation(boardOrientation);
    }

    function addPlayerToSelection(player) {
        const checkbox = document.createElement('div');
        checkbox.className = 'player-checkbox';

        const gameCount = playerGameCounts[player.username] || '...';

        checkbox.innerHTML = `
            <input type="checkbox" id="player-${player.username}" value="${player.username}" checked>
            <div class="player-info">
                <div class="player-name">${player.username}</div>
                <div class="player-games"><span class="loading-games">Loading game count...</span></div>
            </div>
        `;

        const checkboxInput = checkbox.querySelector('input');
        checkboxInput.addEventListener('change', function() {
            if (this.checked) {
                if (!selectedPlayers.includes(player.username)) {
                    selectedPlayers.push(player.username);
                }
            } else {
                const index = selectedPlayers.indexOf(player.username);
                if (index !== -1) {
                    selectedPlayers.splice(index, 1);
                }
            }
        });

        playerCheckboxesContainer.appendChild(checkbox);

        fetchPlayerGames(player.username, player.platform).then(gameCount => {
            const gamesCountElement = checkbox.querySelector('.player-games');
            if (gamesCountElement) {
                gamesCountElement.innerHTML = `${gameCount} games analyzed`;
            }
        });
    }

    function selectAllPlayers() {
        const checkboxes = document.querySelectorAll('.player-checkbox input[type="checkbox"]');
        selectedPlayers = [];
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
            const username = checkbox.value;
            if (!selectedPlayers.includes(username)) {
                selectedPlayers.push(username);
            }
        });
    }

    function deselectAllPlayers() {
        const checkboxes = document.querySelectorAll('.player-checkbox input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        selectedPlayers = [];
    }

    async function fetchPlayerGames(username, platform) {
        try {
            const platformApiParam = platform === 'chess.com' ? 'chess.com' : 'lichess';
            const cleanUsername = username.trim();
            const apiUrl = `/api/openingtree/playerGames?site=${encodeURIComponent(platformApiParam)}&player=${encodeURIComponent(cleanUsername)}&literate=true&lastMoveIndex=10`;

            console.log(`Fetching games for ${cleanUsername} on ${platformApiParam}...`);

            const playerCheckbox = document.getElementById(`player-${username}`);
            if (playerCheckbox) {
                const gamesCountElement = playerCheckbox.parentNode.querySelector('.player-games');
                if (gamesCountElement) {
                    gamesCountElement.innerHTML = `<span class="loading-games">Loading game count...</span>`;
                }
            }

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 20000);

            const response = await fetch(apiUrl, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Error fetching games for ${username}: ${response.statusText}`);
            }

            const data = await response.json();

            let gameCount = 0;
            if (data.totalGames !== undefined) {
                gameCount = data.totalGames;
            } else if (data.games) {
                gameCount = data.games.length;

                if (data.metadata && data.metadata.total !== undefined) {
                    gameCount = data.metadata.total;
                }
            }

            console.log(`Found ${gameCount} games for ${username} on ${platformApiParam}`);
            playerGameCounts[username] = gameCount;

            if (playerCheckbox) {
                const gamesCountElement = playerCheckbox.querySelector('.player-games');
                if (gamesCountElement) {
                    gamesCountElement.textContent = `${gameCount} games analyzed`;
                }
            }

            return gameCount;
        } catch (error) {
            console.error(`Error fetching games for ${username}:`, error);

            const playerCheckbox = document.getElementById(`player-${username}`);
            if (playerCheckbox) {
                const gamesCountElement = playerCheckbox.querySelector('.player-games');
                if (gamesCountElement) {
                    gamesCountElement.innerHTML = `<span class="error-text">API Unavailable</span>`;
                }
            }

            return 0;
        }
    }

    async function fetchOpeningTreeData() {
        moveListContainer.innerHTML = '<div class="loading-moves">Analyzing games, please wait...</div>';
        positionStatsContainer.innerHTML = '<div class="loading-stats">Gathering statistics...</div>';

        try {
            const allGames = [];
            let totalGamesAvailable = 0;

            const playerDetails = selectedPlayers.map(username => getPlayerDetails(username)).filter(Boolean);
            const fetches = playerDetails.map(player => {
                const siteParam = player.platform === 'chess.com' ? 'chess.com' : 'lichess';
                const apiUrl = `/api/openingtree/playerGames?site=${encodeURIComponent(siteParam)}&player=${encodeURIComponent(player.username)}&limit=100&literate=true`;
                return fetch(apiUrl)
                    .then(response => response.ok ? response.json() : null)
                    .catch(() => null);
            });

            const results = await Promise.all(fetches);
            results.forEach((data, idx) => {
                if (data && Array.isArray(data.games)) {
                    const gameCount = data.games.length;
                    totalGamesAvailable += data.totalGames || gameCount;
                    data.games.forEach(game => {
                        if (game.moves && Array.isArray(game.moves) && game.moves.length > 0) {
                            allGames.push({
                                moves: game.moves,
                                result: game.result || "Unknown",
                                playerColor: game.playerColor || (Math.random() > 0.5 ? 'white' : 'black')
                            });
                        }
                    });
                }
            });

            if (allGames.length === 0) {
                moveListContainer.innerHTML = `
                    <div class="no-moves">
                        <p>No games found for selected players.</p>
                        <p>The OpeningTree API might be temporarily unavailable or there are no games for these players.</p>
                        <p>Try searching for different players or try again later.</p>
                    </div>`;
                positionStatsContainer.innerHTML = '<div class="no-stats">No statistics available.</div>';
                return;
            }

            const tree = {
                totalGames: allGames.length,
                playCount: allGames.length,
                moves: []
            };
            allGames.forEach((game, index) => {
                if (!game.moves || !Array.isArray(game.moves) || game.moves.length === 0) return;
                try {
                    let currentNode = tree;
                    const chess = new Chess();
                    for (let i = 0; i < game.moves.length; i++) {
                        const move = game.moves[i];
                        try {
                            const moveResult = chess.move(move);
                            if (!moveResult) continue;
                            let moveNode = currentNode.moves.find(m => m.san === moveResult.san);
                            if (!moveNode) {
                                moveNode = {
                                    san: moveResult.san,
                                    playCount: 1,
                                    moves: [],
                                    fen: chess.fen()
                                };
                                currentNode.moves.push(moveNode);
                            } else {
                                moveNode.playCount++;
                            }
                            currentNode = moveNode;
                        } catch (error) {
                            continue;
                        }
                    }
                } catch (error) {}
            });

            openingTreeData = tree;
            chessGame = new Chess();
            moveHistory = [];
            currentPosition = 'start';
            chessBoard.position('start');
            updateMoveList();
            updatePositionStats();
        } catch (error) {
            moveListContainer.innerHTML = `
                <div class="error-text">
                    <p>Error analyzing games: ${error.message}</p>
                    <p>Please try again later or select different players.</p>
                </div>`;
            positionStatsContainer.innerHTML = '<div class="error-text">Error gathering statistics.</div>';
        }
    }

    function getPlayerDetails(username) {
        const chesscomResults = document.getElementById('chesscom-results').querySelectorAll('.match-item');
        for (const result of chesscomResults) {
            const resultUsername = result.querySelector('.match-username').textContent.trim().replace(/^.+\s/, '');
            if (resultUsername.toLowerCase() === username.toLowerCase()) {
                return { username, platform: 'chess.com' };
            }
        }

        const lichessResults = document.getElementById('lichess-results').querySelectorAll('.match-item');
        for (const result of lichessResults) {
            const resultUsername = result.querySelector('.match-username').textContent.trim().replace(/^.+\s/, '');
            if (resultUsername.toLowerCase() === username.toLowerCase()) {
                return { username, platform: 'lichess' };
            }
        }

        return null;
    }

    function buildOpeningTree(games) {
        const tree = {
            totalGames: games.length,
            playCount: games.length,
            moves: []
        };

        games.forEach(game => {
            if (!game.moves || game.moves.length === 0) return;

            let currentNode = tree;
            let chess = new Chess();

            for (let i = 0; i < Math.min(game.moves.length, 10); i++) {
                const moveSan = game.moves[i];

                try {
                    chess.move(moveSan);
                } catch (e) {
                    console.error('Invalid move:', moveSan, e);
                    break;
                }

                let moveNode = currentNode.moves.find(m => m.san === moveSan);

                if (!moveNode) {
                    moveNode = {
                        san: moveSan,
                        playCount: 1,
                        moves: []
                    };
                    currentNode.moves.push(moveNode);
                } else {
                    moveNode.playCount++;
                }

                currentNode = moveNode;
            }
        });

        return tree;
    }

    async function startOpeningAnalysis() {
        if (selectedPlayers.length === 0) {
            alert('Please select at least one player to analyze.');
            return;
        }

        initializeChess();
        await fetchOpeningTreeData();
    }

    function initializeEventListeners() {
        prevMoveBtn.addEventListener('click', navigateToPreviousMove);
        nextMoveBtn.addEventListener('click', navigateToNextMove);
        flipBoardBtn.addEventListener('click', flipBoard);

        selectAllBtn.addEventListener('click', function(e) {
            e.preventDefault();
            selectAllPlayers();
        });

        deselectAllBtn.addEventListener('click', function(e) {
            e.preventDefault();
            deselectAllPlayers();
        });

        analyzeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            startOpeningAnalysis();
        });

        if (mainAnalyzeBtn) {
            mainAnalyzeBtn.addEventListener('click', function() {
                openingAnalysisSection.classList.remove('hidden');
                openingAnalysisSection.scrollIntoView({ behavior: 'smooth' });

                if (!chessBoard) {
                    initializeChess();
                }

                playerCheckboxesContainer.innerHTML = '';
                selectedPlayers = [];

                const checkboxes = document.querySelectorAll('.player-select-checkbox');
                checkboxes.forEach(checkbox => {
                    if (checkbox.checked) {
                        const username = checkbox.getAttribute('data-username');
                        const platform = checkbox.getAttribute('data-platform');

                        selectedPlayers.push(username);
                        addPlayerToSelection({ username, platform });
                    }
                });

                if (selectedPlayers.length > 0) {
                    startOpeningAnalysis();
                } else {
                    alert('Please select at least one player to analyze.');
                }
            });
        }
    }

    function checkForPlayersToAnalyze() {
        const resultsMutationObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.attributeName === 'class' &&
                    !document.getElementById('results').classList.contains('hidden')) {

                    const chesscomResults = document.getElementById('chesscom-results').children;
                    const lichessResults = document.getElementById('lichess-results').children;

                    playerCheckboxesContainer.innerHTML = '';
                    selectedPlayers = [];

                    let hasPlayers = false;

                    Array.from(chesscomResults).forEach(result => {
                        if (!result.classList.contains('no-results')) {
                            hasPlayers = true;

                            const username = result.querySelector('.match-username').textContent.trim().replace(/^.+\s/, '');
                            const player = { username, platform: 'chess.com' };

                            selectedPlayers.push(username);
                            addPlayerToSelection(player);
                        }
                    });

                    Array.from(lichessResults).forEach(result => {
                        if (!result.classList.contains('no-results')) {
                            hasPlayers = true;

                            const username = result.querySelector('.match-username').textContent.trim().replace(/^.+\s/, '');
                            const player = { username, platform: 'lichess' };

                            selectedPlayers.push(username);
                            addPlayerToSelection(player);
                        }
                    });

                    if (hasPlayers) {
                        openingAnalysisSection.classList.remove('hidden');

                        if (!chessBoard) {
                            initializeChess();
                        }
                    } else {
                        openingAnalysisSection.classList.add('hidden');
                    }
                }
            });
        });

        resultsMutationObserver.observe(document.getElementById('results'), { attributes: true });
    }

    function init() {
        initializeEventListeners();
        checkForPlayersToAnalyze();
    }

    init();
});
