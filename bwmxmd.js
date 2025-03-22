const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8000;

// Import routes
const qr = require('./qr');
const code = require('./pair');

// Prevent max listeners warning
require('events').EventEmitter.defaultMaxListeners = 500;

// Middleware setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Define routes
app.use('/qr', qr);
app.use('/code', code);
app.use('/pair', (req, res) => {
    res.sendFile(path.join(__dirname, '/pair.html'));
});
app.use('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`
Bwm XMD scanner online ✅

Made by Ibrahim Adams

Server running on http://localhost:${PORT}
    `);
});

// Export the app instance
module.exports = app;
