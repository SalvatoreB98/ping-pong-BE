const { google } = require('googleapis');
require('dotenv').config();
const { parseData } = require('../utils/stats.js');
const { groupSetsByMatchId, joinMatchesWithSets } = require('../utils/joinMatchesWithSets.js');

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

        // Fetch matches data
        const matchesResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Matches',
        });

        if (!matchesResponse.data.values) {
            return res.status(404).json({ error: 'No match data found in Matches sheet.' });
        }

        const matchesData = matchesResponse.data; // Raw data

        // Parse matches data using parseData
        const { players, matches, wins, totPlayed, points, monthlyWinRates, badges } = parseData(matchesData);
        // Fetch setsPoint data
        const setsPointsResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'SetsPoints!A:C',
        });

        if (!setsPointsResponse.data.values) {
            return res.status(404).json({ error: 'No set points data found in SetsPoints sheet.' });
        }

        const setsPointsData = setsPointsResponse.data.values;

        // Group sets by match ID
        const groupedSets = groupSetsByMatchId(setsPointsData);

        // Combine matches with sets
        const matchesWithSets = joinMatchesWithSets(matches, groupedSets);

        // Construct final response
        const objToSend = {
            players,
            matches: matchesWithSets,
            wins,
            totPlayed,
            points,
            monthlyWinRates,
            badges
        };
        res.status(200).json(objToSend);
    } catch (error) {
        console.error('Error fetching matches or players:', error.message);
        res.status(500).json({ error: 'Failed to fetch match or player data.' });
    }
};
