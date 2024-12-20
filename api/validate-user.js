const { google } = require('googleapis');
require('dotenv').config();

module.exports = async (req, res) => {
    if (req.method === 'OPTIONS') {
        // Handle preflight CORS request
        res.setHeader('Access-Control-Allow-Origin', '*'); // Adjust origin if needed
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(200).end(); // Respond with 200 for preflight requests
    }

    if (req.method !== 'POST') {
        console.warn(`Unsupported method: ${req.method} on /api/validate-user`);
        return res.status(405).json({ error: `${req.method} method not allowed on this route.` });
    }

    try {
        console.log('Validating user...');

        const credentials = JSON.parse(Buffer.from(process.env.JSON_KEYS, 'base64').toString('utf-8'));
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const email = req?.body?.email;
        console.log(req.body);
        if (!email) {
            console.warn('Validation failed: Email not provided.');
            return res.status(400).json({ error: 'Email is required.' });
        }

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.SPREADSHEET;

        const playersResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Players', // Ensure this matches your spreadsheet tab name
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
};
