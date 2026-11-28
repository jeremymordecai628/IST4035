const express = require('express');
const bcrypt = require('bcryptjs');
const storage = require('../utils/fileStorage');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// Display admin login page
router.get('/login', (req, res) => {
    if (req.session.isAdmin) {
        return res.redirect('/admin/dashboard');
    }

    res.render('login', {
        error: ''
    });
});

// Process admin login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    if (!adminEmail || !adminPasswordHash) {
        return res.status(500).send('Admin credentials are not configured.');
    }

    if (
        typeof email !== 'string' ||
        typeof password !== 'string' ||
        email.trim().toLowerCase() !== adminEmail.trim().toLowerCase()
    ) {
        return res.status(401).render('login', {
            error: 'Invalid email or password.'
        });
    }

    const passwordMatches = await bcrypt.compare(
        password,
        adminPasswordHash
    );

    if (!passwordMatches) {
        return res.status(401).render('login', {
            error: 'Invalid email or password.'
        });
    }

    req.session.regenerate((err) => {
        if (err) {
            return res.status(500).send('Unable to start admin session.');
        }

        req.session.isAdmin = true;
        res.redirect('/admin/dashboard');
    });
});

// Display admin dashboard
router.get('/dashboard', adminAuth, (req, res) => {
    const claims = storage.readData('claims');

    res.render('admin-dashboard', {
        claims
    });
});

// Approve a claim
router.post('/claims/:id/approve', adminAuth, (req, res) => {
    const claims = storage.readData('claims');
    const items = storage.readData('items');

    const claim = claims.find(c => c.id === req.params.id);

    if (!claim || claim.status !== 'Pending') {
        return res.status(404).send('Pending claim not found.');
    }

    const item = items.find(i => i.id === claim.itemId);

    if (!item || !['Open', 'Under Review'].includes(item.status)) {
        return res.status(400).send('This item is no longer available.');
    }

    claim.status = 'Approved';
    item.status = 'Returned';

    storage.writeData('claims', claims);
    storage.writeData('items', items);

    res.redirect('/admin/dashboard');
});

// Reject a claim
router.post('/claims/:id/reject', adminAuth, (req, res) => {
    const claims = storage.readData('claims');

    const claim = claims.find(c => c.id === req.params.id);

    if (!claim || claim.status !== 'Pending') {
        return res.status(404).send('Pending claim not found.');
    }

    claim.status = 'Rejected';

    storage.writeData('claims', claims);

    res.redirect('/admin/dashboard');
});

// Admin logout
router.post('/logout', adminAuth, (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Unable to log out.');
        }

        res.clearCookie('connect.sid');
        res.redirect('/admin/login');
    });
});

module.exports = router;