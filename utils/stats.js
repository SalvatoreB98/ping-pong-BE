


let matches = [];
let wins = {};
let totPlayed = {};
let points = {};
let players = ['SALVO', 'RAFF', 'GIORGIO']

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
    }
}

// Calculate statistics for matches
function calculateStats() {
    wins = {};
    totPlayed = {};
    points = {};

    matches.forEach(({ giocatore1, giocatore2, p1, p2 }) => {
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
    });
    calculatePoints();
}

// Calculate win percentages for players
function calculatePoints() {
    players.forEach(player => {
        points[player] = ((wins[player] / totPlayed[player]) * 100 || 0).toFixed(1);
    });
    console.log("players", players);

}
