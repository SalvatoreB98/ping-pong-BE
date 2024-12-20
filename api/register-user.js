const express = require('express');
const { google } = require('googleapis');
require('dotenv').config();
const cors = require('cors');

const app = express();

// CORS Configuration
const corsOptions = {
    origin: ['http://localhost:5173', 'https://ping-pong-woad.vercel.app/', 'https://staging-ping-pong-woad.vercel.app/'], // Update with allowed origins
    methods: ['POST'],
};
app.use(cors(corsOptions));
app.use(express.json()); // Middleware to parse JSON requests

// Register User Route
app.post('/api/register-user', async (req, res) => {
    try {
        const credentials = JSON.parse(Buffer.from(process.env.JSON_KEYS, 'base64').toString('utf-8'));
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const { email, name } = req.body;

        // Validate input
        if (!email) {
            return res.status(400).json({ error: 'Email is required.' });
        }

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.SPREADSHEET;

        // Fetch existing users from the Google Sheet
        const usersResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Players',
        });

        const rows = usersResponse.data.values || [];
        const header = rows[0];
        const emailIndex = header.indexOf('email');

        if (emailIndex === -1) {
            return res.status(500).json({ error: 'Users sheet is missing the "email" column.' });
        }

        const userExists = rows.some(row => row[emailIndex] === email);
        if (userExists) {
            return res.status(409).json({ error: 'Email is already registered.' });
        }
        if (name) {
            await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: 'Players',
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [[email, name || '']],
                },
            });
            res.status(201).json({ message: 'User registered successfully.' });
        } else {
            res.status(400).json({ message: 'Username not provided' });
        }

    } catch (error) {
        console.error('Error registering user:', error.message);
        res.status(500).json({ error: 'Failed to register user.' });
    }
});

// Handle unsupported methods for this route
app.all('/api/register-user', (req, res) => {
    return res.status(405).json({ error: `${req.method} method not allowed on this route.` });
});

module.exports = app;
