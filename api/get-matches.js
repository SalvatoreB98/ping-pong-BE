const { google } = require('googleapis');
require('dotenv').config();
const { parseData } = require('../utils/stats.js');

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
        console.info(spreadsheetId)
        const matchesResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Partite',
        });

        if (!matchesResponse.data.values) {
            return res.status(404).json({ error: 'No match data found in Partite sheet.' });
        }

        const matchData = matchesResponse.data;
        const objToSend = parseData(matchData);

        // Fetch player data from the 'Giocatori' sheet
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

        // Add players to the object to send
        objToSend.players = players;

        console.log("objToSend", objToSend);

        res.status(200).json(objToSend);
    } catch (error) {
        console.error('Error fetching matches or players:', error.message);
        res.status(500).json({ error: 'Failed to fetch match or player data.' });
    }
};
