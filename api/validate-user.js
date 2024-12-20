const express = require('express');
const { google } = require('googleapis');
require('dotenv').config();
const cors = require('cors');

const app = express();

// Configure CORS with dynamic origin handling
const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = ['http://localhost:5173', 'https://ping-pong-woad.vercel.app', "bs-local.com*"];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, 
};
app.options('*', cors(corsOptions));
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
});



app.options('*', cors(corsOptions));


app.post('/api/validate-user', async (req, res) => {
    try {
        console.log('Validating user...');
        const credentials = JSON.parse(Buffer.from(process.env.JSON_KEYS, 'base64').toString('utf-8'));
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const { email } = req.body;


        if (!email) {
            console.warn('Validation failed: Email not provided.');
            return res.status(400).json({ error: 'Email is required.' });
        }

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.SPREADSHEET;

        const playersResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Players', 
        });

        const rows = playersResponse.data.values || [];
        if (rows.length === 0) {
            console.warn('No data found in Players sheet.');
            return res.status(404).json({ error: 'No player data found in Players sheet.' });
        }

        const header = rows[0];
        const emailIndex = header.indexOf('email');

        if (emailIndex === -1) {
            console.error('Players sheet is missing the "email" column.');
            return res.status(500).json({ error: 'Players sheet is missing the "email" column.' });
        }


        const playerExists = rows.some(row => row[emailIndex] === email);

        console.log(`User validation complete. Email: ${email}, Registered: ${playerExists}`);
        return res.status(200).json({ registered: playerExists });
    } catch (error) {
        console.error('Error validating user:', error);
        return res.status(500).json({ error: 'Failed to validate user.', details: error.message });
    }
});

app.all('/api/validate-user', (req, res) => {
    console.warn(`Unsupported method: ${req.method} on /api/validate-user`);
    return res.status(405).json({ error: `${req.method} method not allowed on this route.` });
});


module.exports = app;
