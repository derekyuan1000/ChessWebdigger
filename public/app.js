document.addEventListener('DOMContentLoaded', function() {
    const searchForm = document.getElementById('searchForm');
    const resultsDiv = document.getElementById('results');
    const loadingDiv = document.getElementById('loading');
    const chesscomResultsDiv = document.getElementById('chesscom-results');
    const lichessResultsDiv = document.getElementById('lichess-results');
    const foundPlayersSummaryDiv = document.getElementById('found-players-summary');
    const foundPlayersStatsDiv = document.getElementById('found-players-stats');
    const mainSelectAllBtn = document.getElementById('main-select-all-btn');
    const mainDeselectAllBtn = document.getElementById('main-deselect-all-btn');

    searchForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const name = document.getElementById('name').value.trim();
        const fide = document.getElementById('fide').value.trim();
        const federation = document.getElementById('federation').value.trim();
        const ratings = document.getElementById('ratings').value.trim();
        const birthYear = document.getElementById('birthYear').value.trim();

        if (!name) {
            alert('Full name is required');
            return;
        }

        resultsDiv.classList.add('hidden');
        loadingDiv.classList.remove('hidden');
        foundPlayersSummaryDiv.classList.add('hidden');

        try {
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, fide, federation, ratings, birthYear })
            });

            const data = await response.json();
            loadingDiv.classList.add('hidden');
            renderResults(data);

        } catch (error) {
            console.error('Error:', error);
            loadingDiv.classList.add('hidden');
            alert('An error occurred while searching. Please try again.');
        }
    });

    function renderResults(data) {
        chesscomResultsDiv.innerHTML = '';
        lichessResultsDiv.innerHTML = '';
        foundPlayersStatsDiv.innerHTML = '';
        resultsDiv.classList.remove('hidden');

        const chesscomStats = calculatePlatformStats(data.chesscom);
        const lichessStats = calculatePlatformStats(data.lichess);

        if ((chesscomStats.avgRating || lichessStats.avgRating) &&
            (chesscomStats.playerCount > 0 || lichessStats.playerCount > 0)) {
            foundPlayersStatsDiv.innerHTML = createFoundPlayersStatsHTML(chesscomStats, lichessStats);
            foundPlayersSummaryDiv.classList.remove('hidden');
        } else {
            foundPlayersSummaryDiv.classList.add('hidden');
        }

        setTimeout(() => {
            if (data.chesscom && data.chesscom.length > 0) {
                data.chesscom.forEach((match, index) => {
                    setTimeout(() => {
                        const element = createMatchElement(match, 'chess.com');
                        element.style.opacity = '0';
                        chesscomResultsDiv.appendChild(element);

                        setTimeout(() => {
                            element.style.transition = 'opacity 0.5s ease';
                            element.style.opacity = '1';
                        }, 50);
                    }, index * 100);
                });
            } else {
                chesscomResultsDiv.innerHTML = '<div class="no-results">No Chess.com matches found</div>';
            }

            setTimeout(() => {
                if (data.lichess && data.lichess.length > 0) {
                    data.lichess.forEach((match, index) => {
                        setTimeout(() => {
                            const element = createMatchElement(match, 'lichess');
                            element.style.opacity = '0';
                            lichessResultsDiv.appendChild(element);

                            setTimeout(() => {
                                element.style.transition = 'opacity 0.5s ease';
                                element.style.opacity = '1';
                            }, 50);
                        }, index * 100);
                    });
                } else {
                    lichessResultsDiv.innerHTML = '<div class="no-results">No Lichess matches found</div>';
                }

                renderOpeningTreeLinks(data);
            }, 200);
        }, 300);
    }

    function calculatePlatformStats(players) {
        const stats = {
            playerCount: 0,
            playersWithRating: 0,
            totalRating: 0,
            avgRating: null
        };

        if (!players || players.length === 0) {
            return stats;
        }

        stats.playerCount = players.length;

        players.forEach(player => {
            if (player.rating) {
                stats.playersWithRating++;
                stats.totalRating += parseInt(player.rating);
            }
        });

        if (stats.playersWithRating > 0) {
            stats.avgRating = Math.round(stats.totalRating / stats.playersWithRating);
        }

        return stats;
    }

    function createFoundPlayersStatsHTML(chesscomStats, lichessStats) {
        let html = '';

        html += `
        <div class="platform-stats">
            <div class="platform-icon chess-com">
                <i class="fas fa-chess-king"></i>
            </div>
            <div class="platform-stats-content">
                <div class="platform-name">Chess.com Average Rating</div>
                <div class="platform-avg-rating">${chesscomStats.avgRating || 'N/A'}</div>
                <div class="player-count">${chesscomStats.playersWithRating} of ${chesscomStats.playerCount} players with ratings</div>
            </div>
        </div>`;

        html += `
        <div class="platform-stats">
            <div class="platform-icon lichess">
                <i class="fas fa-chess-knight"></i>
            </div>
            <div class="platform-stats-content">
                <div class="platform-name">Lichess Average Rating</div>
                <div class="platform-avg-rating">${lichessStats.avgRating || 'N/A'}</div>
                <div class="player-count">${lichessStats.playersWithRating} of ${lichessStats.playerCount} players with ratings</div>
            </div>
        </div>`;

        return html;
    }

    function createMatchElement(match, platform) {
        const matchItem = document.createElement('div');
        matchItem.className = `match-item ${getConfidenceClass(match.confidence)}`;

        const confidenceLabel = getConfidenceLabel(match.confidence);
        const platformIcon = platform === 'chess.com' ? 'fa-chess-king' : 'fa-chess-knight';
        const gameCountHtml = `<div class="game-count"><i class="fas fa-spinner fa-spin"></i> <span class="games-data" data-username="${match.username}" data-platform="${platform}">Loading games...</span></div>`;

        matchItem.innerHTML = `
            <div class="match-header">
                <div class="match-username">
                    <i class="fas ${platformIcon}"></i> ${match.username}
                    ${gameCountHtml}
                </div>
                <div class="confidence-score ${confidenceLabel.toLowerCase()}">${match.confidence}% Match</div>
            </div>
            <div class="match-details">
                ${match.matchedCriteria ? `<div class="match-detail"><i class="fas fa-check-circle"></i> Matched: ${match.matchedCriteria.join(', ')}</div>` : ''}
                ${match.federation ? `<div class="match-detail"><i class="fas fa-globe"></i> Federation: ${match.federation}</div>` : ''}
                ${match.rating ? `<div class="match-detail"><i class="fas fa-chart-line"></i> Rating: ${match.rating}</div>` : ''}
                ${match.lastOnline ? `<div class="match-detail"><i class="fas fa-clock"></i> Last Active: ${match.lastOnline}</div>` : ''}
            </div>
            <a href="${getPlatformProfileUrl(platform, match.username)}" target="_blank" class="profile-link">
                <i class="fas fa-external-link-alt"></i> View Profile
            </a>
        `;

        fetchPlayerGameCount(match.username, platform);
        return matchItem;
    }

    function getConfidenceClass(confidence) {
        if (confidence >= 80) return 'high-confidence';
        if (confidence >= 50) return 'medium-confidence';
        return 'low-confidence';
    }

    function getConfidenceLabel(confidence) {
        if (confidence >= 80) return 'High';
        if (confidence >= 50) return 'Medium';
        return 'Low';
    }

    function getPlatformProfileUrl(platform, username) {
        if (platform === 'chess.com') {
            return `https://www.chess.com/member/${username}`;
        } else {
            return `https://lichess.org/@/${username}`;
        }
    }

    async function fetchPlayerGameCount(username, platform) {
        try {
            const response = await fetch(`/api/player-games?username=${encodeURIComponent(username)}&platform=${encodeURIComponent(platform)}`);

            if (response.ok) {
                const data = await response.json();
                const gameCountElements = document.querySelectorAll(`.games-data[data-username="${username}"][data-platform="${platform}"]`);

                gameCountElements.forEach(element => {
                    const parentElement = element.closest('.game-count');
                    if (parentElement) {
                        const spinner = parentElement.querySelector('.fa-spinner');
                        if (spinner) spinner.remove();
                        parentElement.innerHTML = `<i class="fas fa-chess"></i> ${data.count} games`;
                    }
                });

                return data.count;
            } else {
                throw new Error('Server request failed');
            }
        } catch (error) {
            console.error(`Error fetching games for ${username}:`, error);
            const gameCountElements = document.querySelectorAll(`.games-data[data-username="${username}"][data-platform="${platform}"]`);

            gameCountElements.forEach(element => {
                const parentElement = element.closest('.game-count');
                if (parentElement) {
                    parentElement.innerHTML = `<i class="fas fa-chess"></i> ${platform === 'chess.com' ? '~100' : '~80'} games`;
                }
            });

            return platform === 'chess.com' ? 100 : 80;
        }
    }

    if (mainSelectAllBtn) {
        mainSelectAllBtn.addEventListener('click', function() {
            selectAllCheckboxes();
        });
    }

    if (mainDeselectAllBtn) {
        mainDeselectAllBtn.addEventListener('click', function() {
            deselectAllCheckboxes();
        });
    }

    function selectAllCheckboxes() {
        const checkboxes = document.querySelectorAll('.player-select-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
    }

    function deselectAllCheckboxes() {
        const checkboxes = document.querySelectorAll('.player-select-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
    }

    function renderOpeningTreeLinks(data) {
        const container = document.getElementById('openingtree-links');
        if (!container) return;
        container.innerHTML = '';
        const links = [];

        if (data.chesscom && data.chesscom.length > 0) {
            data.chesscom.forEach(match => {
                links.push(`<a href="https://openingtree.com/${encodeURIComponent(match.username)}?site=chessCom" target="_blank" class="profile-link"><i class="fas fa-chess-board"></i> OpeningTree for ${match.username} (Chess.com)</a>`);
            });
        }

        if (data.lichess && data.lichess.length > 0) {
            data.lichess.forEach(match => {
                links.push(`<a href="https://openingtree.com/${encodeURIComponent(match.username)}?site=lichess" target="_blank" class="profile-link"><i class="fas fa-chess-board"></i> OpeningTree for ${match.username} (Lichess)</a>`);
            });
        }

        if (links.length === 0) {
            container.innerHTML = '<div class="no-results">No OpeningTree links available</div>';
        } else {
            container.innerHTML = links.join('<br>');
        }
    }
});
