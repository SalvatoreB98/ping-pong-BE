const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Enable CORS for all routes or specific origins
app.use(cors({ origin: 'http://localhost:5173' })); // Allow requests from your frontend's origin
app.use(express.json());

// Decode the Base64 credentials from the .env file
const credentials = JSON.parse(Buffer.from(process.env.JSON_KEYS, 'base64').toString('utf-8'));

// Google Sheets API setup
const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// POST endpoint to append data to a Google Sheet
app.post('/api/add-match', async (req, res) => {
    const { date, player1, player2, p1Score, p2Score } = req.body;

    if (!date || !player1 || !player2 || p1Score === undefined || p2Score === undefined) {
        return res.status(400).json({ error: 'Invalid data' });
    }

    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = 'YOUR_SPREADSHEET_ID'; // Replace with your Google Sheet ID

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
        res.status(500).json({ error: 'Failed to add match' });
    }
});

// Start the server (for local testing)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app; // Export for Vercel
