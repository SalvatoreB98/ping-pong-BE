const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');

const app = express();

// Middleware to parse JSON request bodies
app.use(bodyParser.json());

// Replace these placeholders with your actual credentials
const credentials = {
    type: "service_account",
    project_id: "YOUR_PROJECT_ID",
    private_key_id: "YOUR_PRIVATE_KEY_ID",
    private_key: "YOUR_PRIVATE_KEY",
    client_email: "YOUR_CLIENT_EMAIL",
    client_id: "YOUR_CLIENT_ID",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: "YOUR_CERT_URL",
};
const spreadsheetId = 'YOUR_SPREADSHEET_ID';

// POST endpoint to add a match
app.post('/api/add-match', async (req, res) => {
    const { date, player1, player2, p1Score, p2Score } = req.body;

    // Validate the request data
    if (!date || !player1 || !player2 || p1Score === undefined || p2Score === undefined) {
        return res.status(400).json({ error: 'Invalid data' });
    }

    try {
        // Authenticate with Google Sheets API
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        // Append data to the Google Sheet
        sheets.spreadsheets.values.append({
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

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
