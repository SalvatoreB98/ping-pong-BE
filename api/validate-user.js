app.post('/api/validate-user', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required.' });
    }

    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.SPREADSHEET;

        // Get data from the Players sheet
        const playerSheetData = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Players', // Replace with the actual name of your Players sheet
        });

        const rows = playerSheetData.data.values || [];
        const header = rows[0];
        const emailIndex = header.indexOf('email');

        if (emailIndex === -1) {
            return res.status(500).json({ error: 'Players sheet is missing the "email" column.' });
        }

        // Check if the email exists
        const playerExists = rows.some(row => row[emailIndex] === email);

        if (playerExists) {
            return res.status(200).json({ registered: true });
        } else {
            return res.status(200).json({ registered: false });
        }
    } catch (error) {
        console.error('Error validating user:', error);
        res.status(500).json({ error: 'Failed to validate user.' });
    }
});
