const { google } = require('googleapis');
require('dotenv').config();

module.exports = async (req, res) => {
    const credentials = JSON.parse(Buffer.from(process.env.JSON_KEYS, 'base64').toString('utf-8'));
    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required.' });
    }

    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.SPREADSHEET;

        // Fetch players data
        const playersResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Players', // Replace with the actual name of your Players sheet
        });

        if (!playersResponse.data.values) {
            return res.status(404).json({ error: 'No player data found in Players sheet.' });
        }

        const rows = playersResponse.data.values || [];
        const header = rows[0];
        const emailIndex = header.indexOf('email');

        if (emailIndex === -1) {
            return res.status(500).json({ error: 'Players sheet is missing the "email" column.' });
        }

        // Check if the email exists
        const playerExists = rows.some(row => row[emailIndex] === email);

        res.status(200).json({ registered: playerExists });
    } catch (error) {
        console.error('Error validating user:', error.message);
        res.status(500).json({ error: 'Failed to validate user.' });
    }
};
