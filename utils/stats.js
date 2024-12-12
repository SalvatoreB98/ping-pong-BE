let matches = [];
let wins = {};
let totPlayed = {};
let points = {};
let monthlyWinRates = {}; // Stores win rates for each player per month
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
        monthlyWinRates, // Include monthly win rates in the return
    };
}

// Calculate statistics for matches
function calculateStats() {
    wins = {};
    totPlayed = {};
    points = {};
    monthlyWinRates = {}; // Reset monthly win rates

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
