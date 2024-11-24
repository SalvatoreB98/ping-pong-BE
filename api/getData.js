const express = require('express');
const fetch = require('node-fetch'); // Use fetch in Node.js
const app = express();

const apiKey = 'AIzaSyAfC0xq6NMAIkalojWF39kWdhq0uCXub1E';
const googleSheet = '1fU2jxEs3S6WFNcNHR3Kczfff-7rw8QavwvEAIwSm4nM';

const players = ['GIORGIO', 'RAFF', 'SALVO'];
let matches = [];
let wins = {};
let totPlayed = {};
let points = {};

// Endpoint to fetch data and calculate stats
app.get('/api/stats', async (req, res) => {
    try {
        console.log("Fetching data...");
        const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${googleSheet}/values/Partite?key=${apiKey}`, {
            headers: {},
        });
        const data = await response.json();
        parseData(data);
        res.status(200).json({ matches, wins, totPlayed, points, players });
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ error: "Failed to fetch data or calculate stats." });
    }
});

function parseData(data) {
    const [headers, ...rows] = data.values;
    matches = rows.map(row =>
        Object.fromEntries(row.map((value, index) => [headers[index], value]))
    );
    calculateStats();
}

function calculateStats() {
    // Reset stats
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

function calculatePoints() {
    players.forEach(player => {
        points[player] = ((wins[player] / totPlayed[player]) * 100 || 0).toFixed(1);
    });
}

// Export the app for deployment or local use
module.exports = app;

// Start the server if running locally
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}