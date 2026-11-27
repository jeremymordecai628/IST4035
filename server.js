
/*
 * server.js
 * Main entry point for the Lost and Found application.
 */

require('dotenv').config();

const express = require('express');
const path = require('path');

const app = express();

// Server configuration
const PORT = process.env.PORT || 3000;

// Configure EJS as the template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware configuration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Home route
app.get('/', (req, res) => {
    res.send(`
        <h1>Lost and Found Management System</h1>
        <p>Express server is running successfully.</p>
    `);
});

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Server is operational',
        timestamp: new Date().toISOString()
    });
});

// Handle undefined routes
app.use((req, res) => {
    res.status(404).send('404 - Page not found');
});

// Start server
app.listen(PORT, () => {
    console.log(`
    =====================================
       LOST AND FOUND MANAGEMENT SYSTEM
    =====================================
       Server: http://localhost:${PORT}
       Environment: ${process.env.NODE_ENV || 'development'}
       Status: Running
    =====================================
    `);
});

