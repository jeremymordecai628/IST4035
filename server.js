
const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Claim routes
const claimRoutes = require('./routes/claimRoutes');
app.use('/items', claimRoutes);

// Home route
app.get('/', (req, res) => {
    res.redirect('/items/1/claim');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
