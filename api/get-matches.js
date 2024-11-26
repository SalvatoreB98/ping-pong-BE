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

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Partite',
        });

        const data = response.data;
        console.log("after response", data)
        const objToSend = parseData(data);
        console.log("objToSend", objToSend)

        res.status(200).json(objToSend);
    } catch (error) {
        console.error('Error fetching matches:', error);
        res.status(500).json({ error: 'Failed to fetch match data and statistics.' });
    }
};
