app.post('/api/get-player-id', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required.' });
    }

    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.SPREADSHEET;

        // Get data from the sheet
        const sheetData = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Players', // Replace with the name of your sheet
        });

        const rows = sheetData.data.values || [];

        // Find the row with the matching email
        const header = rows[0]; // First row is the header
        const emailIndex = header.indexOf('email');
        const idIndex = header.indexOf('playerId');

        if (emailIndex === -1 || idIndex === -1) {
            return res.status(500).json({ error: 'Sheet is missing required columns: email or playerId.' });
        }

        const player = rows.find(row => row[emailIndex] === email);

        if (!player) {
            return res.status(404).json({ error: 'Player not found with the provided email.' });
        }

        const playerId = player[idIndex];
        res.status(200).json({ playerId });
    } catch (error) {
        console.error('Error retrieving player data:', error);
        res.status(500).json({ error: 'Failed to retrieve player ID.' });
    }
});

// Block all other methods
app.all('/api/get-player-id', (req, res) => {
    res.status(405).json({ error: `${req.method} method not allowed on this route.` });
});
