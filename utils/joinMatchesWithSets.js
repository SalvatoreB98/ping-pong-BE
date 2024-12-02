/**
 * Groups setsPoints data by match ID.
 * @param {Array} setsPointsData - The raw setsPoints data from the spreadsheet.
 * @returns {Object} - A mapping of match IDs to their respective sets.
 */
const groupSetsByMatchId = (setsPointsData) => {
    return setsPointsData.slice(1).reduce((acc, set) => {
        const matchId = set[0]; // Match ID
        const points = [parseInt(set[1], 10), parseInt(set[2], 10)]; // Points for the set
        if (!acc[matchId]) acc[matchId] = [];
        acc[matchId].push(points);
        return acc;
    }, {});
};

/**
 * Combines matches with grouped setsPoints data.
 * @param {Array} matches - Array of match objects with fields like id, giocatore1, etc.
 * @param {Object} groupedSets - A mapping of match IDs to their respective sets.
 * @returns {Array} - Matches with their respective setsPoints included.
 */
const joinMatchesWithSets = (matches, groupedSets) => {
    return matches.map(match => {
        const { id, data, giocatore1, giocatore2, p1, p2 } = match;
        return {
            id,
            data,
            giocatore1,
            giocatore2,
            p1,
            p2,
            setsPoints: groupedSets[id] || [] // Add setsPoint if available
        };
    });
};

module.exports = {
    groupSetsByMatchId,
    joinMatchesWithSets
};
