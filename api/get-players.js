const { google } = require('googleapis');
require('dotenv').config();

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

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Giocatori', // The range from the Google Sheet
        });

        const data = response.data.values;

        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'No data found in Giocatori sheet.' });
        }

        const [headers, ...rows] = data; // Extract headers and player data
        const players = rows.map(row => {
            const player = {};
            headers.forEach((header, index) => {
                player[header] = row[index];
            });
            return player;
        });

        // Return the list of players
        res.status(200).json(players);
    } catch (error) {
        console.error('Error fetching players:', error);
        res.status(500).json({ error: 'Failed to fetch players.' });
    }
};
