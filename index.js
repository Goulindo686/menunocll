const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Global states stored in memory
let userStates = {};
let userCommands = {};
let userSchemas = {}; // To store the dynamic menu structure

// --- PC CLIENT ROUTES (GOU MENU EXE) ---

// PC sends current config values
app.post('/api/update/:username', (req, res) => {
    const { username } = req.params;
    userStates[username] = req.body;
    res.json({ status: 'success' });
});

// PC sends the menu structure (tabs, subtabs, widgets)
app.post('/api/schema/:username', (req, res) => {
    const { username } = req.params;
    userSchemas[username] = req.body;
    res.json({ status: 'schema_updated' });
});

// PC polls for new commands from mobile
app.get('/api/commands/:username', (req, res) => {
    const { username } = req.params;
    const commands = userCommands[username] || [];
    userCommands[username] = []; // Clear after reading
    res.json(commands);
});

// --- MOBILE FRONTEND ROUTES ---

// Mobile gets the current values
app.get('/api/state/:username', (req, res) => {
    const { username } = req.params;
    res.json(userStates[username] || {});
});

// Mobile gets the menu structure
app.get('/api/schema/:username', (req, res) => {
    const { username } = req.params;
    res.json(userSchemas[username] || null);
});

// Mobile sends a toggle or slider change
app.post('/api/toggle', (req, res) => {
    const { username, category, feature, value } = req.body;
    if (!username) return res.status(400).json({ error: 'Username required' });
    
    if (!userCommands[username]) userCommands[username] = [];
    
    // Optimistic update: Update state immediately so mobile UI is snappy
    if (!userStates[username]) userStates[username] = {};
    if (!userStates[username][category]) userStates[username][category] = {};
    userStates[username][category][feature] = value;

    // Queue for PC to pick up
    userCommands[username].push({ category, feature, value });
    res.json({ status: 'queued', value });
});

// Serve the Mobile UI
app.get('/:username', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`GOU MENU Server running on port ${PORT}`);
});