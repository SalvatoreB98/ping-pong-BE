let matches = [];
let wins = {};
let totPlayed = {};
let points = {};
let monthlyWinRates = {}; // Stores win rates for each player per month
let badges = {}; // Stores badges for players
let players = ['SALVO', 'RAFF', 'GIORGIO'];

export function parseData(data) {
    const [headers, ...rows] = data.values || [];
    matches = rows.map(row =>
        Object.fromEntries(row.map((value, index) => [headers[index], value]))
    );
    calculateStats();
    return {
        players,
        matches,
        wins,
        totPlayed,
        points,
        monthlyWinRates,
        badges, // Include badges in the return
    };
}

// Calculate statistics for matches
function calculateStats() {
    wins = {};
    totPlayed = {};
    points = {};
    monthlyWinRates = {}; // Reset monthly win rates
    badges = {}; // Reset badges

    matches.forEach(({ giocatore1, giocatore2, p1, p2, data }) => {
        if (!wins[giocatore1]) wins[giocatore1] = 0;
        if (!wins[giocatore2]) wins[giocatore2] = 0;
        if (!totPlayed[giocatore1]) totPlayed[giocatore1] = 0;
        if (!totPlayed[giocatore2]) totPlayed[giocatore2] = 0;

        const score1 = Number(p1) || 0;
        const score2 = Number(p2) || 0;

        totPlayed[giocatore1] += score1 + score2;
        totPlayed[giocatore2] += score1 + score2;

        wins[giocatore1] += score1;
        wins[giocatore2] += score2;

        const mese = data.split('/')[1];
        // Track monthly stats
        if (!monthlyWinRates[mese]) {
            monthlyWinRates[mese] = {};
        }
        if (!monthlyWinRates[mese][giocatore1]) {
            monthlyWinRates[mese][giocatore1] = { wins: 0, totPlayed: 0 };
        }
        if (!monthlyWinRates[mese][giocatore2]) {
            monthlyWinRates[mese][giocatore2] = { wins: 0, totPlayed: 0 };
        }

        monthlyWinRates[mese][giocatore1].wins += score1;
        monthlyWinRates[mese][giocatore1].totPlayed += score1 + score2;

        monthlyWinRates[mese][giocatore2].wins += score2;
        monthlyWinRates[mese][giocatore2].totPlayed += score1 + score2;
    });

    calculatePoints();
    calculateMonthlyWinRates();
    calculateBadges();
}

// Calculate win percentages for players
function calculatePoints() {
    players.forEach(player => {
        points[player] = ((wins[player] / totPlayed[player]) * 100 || 0).toFixed(1);
    });
}

// Calculate win rates for each player per month
function calculateMonthlyWinRates() {
    Object.keys(monthlyWinRates).forEach(mese => {
        Object.keys(monthlyWinRates[mese]).forEach(player => {
            const { wins, totPlayed } = monthlyWinRates[mese][player];
            const winRate = ((wins / totPlayed) * 100 || 0).toFixed(1);
            monthlyWinRates[mese][player] = winRate; // Replace stats with win rate
        });
    });
}

// Calculate badges for players
function calculateBadges() {
    const totalLosses = {};
    const winStreaks = {};
    const currentStreaks = {};

    players.forEach(player => {
        badges[player] = [];
        totalLosses[player] = totPlayed[player] - wins[player];
        winStreaks[player] = 0;
        currentStreaks[player] = 0;
    });

    matches.forEach(({ giocatore1, giocatore2, p1, p2, data }) => {
        const score1 = Number(p1) || 0;
        const score2 = Number(p2) || 0;
        const mese = data.split('/')[1];

        if (score1 > score2) {
            currentStreaks[giocatore1]++;
            currentStreaks[giocatore2] = 0;
        } else if (score2 > score1) {
            currentStreaks[giocatore2]++;
            currentStreaks[giocatore1] = 0;
        }

        players.forEach(player => {
            winStreaks[player] = Math.max(winStreaks[player], currentStreaks[player]);
        });
    });

    // Assign monthly badges based on win rates
    Object.keys(monthlyWinRates).forEach(mese => {
        const topPlayer = Object.entries(monthlyWinRates[mese]).reduce((a, b) => (Number(b[1]) > Number(a[1]) ? b : a), [null, 0])[0];
        if (topPlayer) {
            badges[topPlayer].push(`CHAMPION_OF_THE_MONTH-${mese}`);
        }
    });

    // Assign badges for most played games and losses
    const mostPlayed = Object.entries(totPlayed).reduce((a, b) => (b[1] > a[1] ? b : a), [null, 0])[0];
    const mostLosses = Object.entries(totalLosses).reduce((a, b) => (b[1] > a[1] ? b : a), [null, 0])[0];
    const longestStreak = Object.entries(winStreaks).reduce((a, b) => (b[1] > a[1] ? b : a), [null, 0])[0];

    if (mostPlayed) {
        badges[mostPlayed].push('MAX_TOTAL');
    }
    if (mostLosses) {
        badges[mostLosses].push('MAX_LOSSES');
    }
    if (longestStreak) {
        badges[longestStreak].push('MAX_WIN_STREAK');
    }
}