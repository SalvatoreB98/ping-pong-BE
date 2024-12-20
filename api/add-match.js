const express = require('express');
const { google } = require('googleapis');
require('dotenv').config();
const cors = require('cors');

const app = express();

const corsOptions = {
    origin: ['http://localhost:*', 'https://ping-pong-woad.vercel.app/'], 
    methods: ['POST'], // Allowed methods
  };
app.use(cors(corsOptions));



app.use(express.json());

const credentials = JSON.parse(Buffer.from(process.env.JSON_KEYS, 'base64').toString('utf-8'));
const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

app.post('/api/add-match', async (req, res) => {
    const { matchId, date, player1, player2, p1Score, p2Score, setsPoints } = req.body;

    if (!date || !player1 || !player2 || p1Score === undefined || p2Score === undefined) {
        return res.status(400).json({ error: 'Invalid data. Ensure all fields are provided.' });
    }

    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.SPREADSHEET;
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Matches',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[matchId, date, player1, player2, p1Score, p2Score]],
            },
        });
        const setsValues = setsPoints.map(point => [matchId, point.player1, point.player2]);
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'SetsPoints',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: setsValues,
            },
        });


        res.status(200).json({ message: 'Match added successfully' });
    } catch (error) {
        console.error('Error appending to sheet:', error);
        res.status(500).json({ error: 'Failed to add match' });
    }
});

// Block all other methods (GET, PUT, DELETE, etc.)
app.all('/api/add-match', (req, res) => {
    res.status(405).json({ error: `${req.method} method not allowed on this route.` });
});


module.exports = app; 
