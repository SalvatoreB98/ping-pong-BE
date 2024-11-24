const express = require('express');
const { google } = require('googleapis');
require('dotenv').config();
const app = express();
const cors = require('cors');

const allowedOrigins = ['http://localhost:5173', 'https://ping-pong-woad.vercel.app']; // Your frontend origins

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true); // Allow the request
        } else {
            callback(new Error('Not allowed by CORS')); // Reject other origins
        }
    },
    methods: ['POST'], // Allow only POST requests
    allowedHeaders: ['Content-Type'], // Headers allowed in the request
}));

app.use(express.json());

const credentials = JSON.parse(Buffer.from(process.env.JSON_KEYS, 'base64').toString('utf-8'));

const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

app.post('/api/add-match', async (req, res) => {
    const { date, player1, player2, p1Score, p2Score } = req.body;

    if (!date || !player1 || !player2 || p1Score === undefined || p2Score === undefined) {
        return res.status(400).json({ error: 'Invalid data. Ensure all fields are provided.' });
    }

    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.SPREADSHEET;

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Partite',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [[date, player1, player2, p1Score, p2Score]],
            },
        });

        res.status(200).json({ message: 'Match added successfully' });
    } catch (error) {
        console.error('Error appending to sheet:', error);
        res.status(500).json({
            error: 'Failed to add match.',
            details: error.message,
        });
    }
});

app.all('/api/add-match', (req, res) => {
    res.status(405).json({ error: 'Method Not Allowed' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app; 
