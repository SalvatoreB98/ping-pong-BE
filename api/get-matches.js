const { google } = require('googleapis');
require('dotenv').config();
const { parseData } = require('../utils/stats.js');

const groupSetsByMatchId = (setsPoint) => {
    return setsPoint.slice(1).reduce((acc, set) => {
        console.info("set point", setsPoint);
        const matchId = set[0]; // Match ID
        const points = [parseInt(set[1], 10), parseInt(set[2], 10)]; // Points for the set
        if (!acc[matchId]) acc[matchId] = [];
        acc[matchId].push(points);
        return acc;
    }, {});
};

module.exports = async (req, res) => {
    const credentials = JSON.parse(Buffer.from(process.env.JSON_KEYS, 'base64').toString('utf-8'));
    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.SPREADSHEET;
        // Fetch matches data
        const matchesResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Partite',
        });

        if (!matchesResponse.data.values) {
            return res.status(404).json({ error: 'No match data found in Partite sheet.' });
        }

        const matchesData = matchesResponse.data.values;

        // Fetch setsPoint data
        const setsPointResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'SetPoints',
        });

        if (!setsPointResponse.data.values) {
            return res.status(404).json({ error: 'No set points data found in SetPoint sheet.' });
        }

        const setsPointData = setsPointResponse.data.values;

        // Group sets by match ID
        const groupedSets = groupSetsByMatchId(setsPointData);

        // Process matches data and combine with grouped sets
        const objToSend = matchesData.slice(1).map(match => {
            console.log("groupedSets outside", groupedSets)
            const [id, date, giocatore1, giocatore2, p1, p2] = match;
            return {
                id,
                data: date,
                giocatore1,
                giocatore2,
                p1,
                p2,
                sets: groupedSets[id] || [], // Include grouped sets or an empty array if no sets
            };
        });

        // Fetch player data
        const playersResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Giocatori',
        });

        if (!playersResponse.data.values) {
            return res.status(404).json({ error: 'No player data found in Giocatori sheet.' });
        }

        const playersData = playersResponse.data.values;

        // Extract player names
        const [headers, ...rows] = playersData;
        const nameColumnIndex = headers.findIndex(header =>
            header.toLowerCase() === 'name'
        ); // Case-insensitive check for 'name'

        if (nameColumnIndex === -1) {
            return res.status(404).json({ error: "No 'name' column found in Giocatori sheet." });
        }

        const players = rows
            .map(row => row[nameColumnIndex])
            .filter(player => player); // Filter any empty player names

        // Add players to the response
        objToSend.players = players;
        res.status(200).json({ success: true, data: objToSend });
    } catch (error) {
        console.error('Error fetching matches or players:', error.message);
        res.status(500).json({ error: 'Failed to fetch match or player data.' });
    }
};
