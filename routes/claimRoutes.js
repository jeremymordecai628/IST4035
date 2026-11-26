
const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const itemsFile = path.join(__dirname, '../data/items.json');
const claimsFile = path.join(__dirname, '../data/claims.json');

// Read JSON files
function readData(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    return [];
  }
}

// Save claims
function saveClaims(claims) {
  fs.writeFileSync(claimsFile, JSON.stringify(claims, null, 2));
}

// GET: Display claim form
router.get('/:id/claim', (req, res) => {
  const items = readData(itemsFile);
  const item = items.find(i => i.id === req.params.id);

  if (!item || item.reportType !== 'found' ||
      !['Open', 'Under Review'].includes(item.status)) {
    return res.status(404).send('Item is not available for claiming.');
  }

  res.render('claim-item', {
    title: 'Claim This Item',
    active: 'browse',
    item,
    error: ''
  });
});

// POST: Submit a claim
router.post('/:id/claim', (req, res) => {
  const { name, email, phone, proof } = req.body;

  const items = readData(itemsFile);
  const item = items.find(i => i.id === req.params.id);

  if (!item || item.reportType !== 'found' ||
      !['Open', 'Under Review'].includes(item.status)) {
    return res.status(404).send('Item is not available for claiming.');
  }

  if (![name, email, phone, proof].every(
    value => typeof value === 'string' && value.trim()
  )) {
    return res.status(400).send('Please complete all fields.');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).send('Please enter a valid email address.');
  }

  const claims = readData(claimsFile);

  const duplicate = claims.some(claim =>
    claim.itemId === item.id &&
    claim.email.toLowerCase() === email.trim().toLowerCase() &&
    claim.status !== 'Rejected'
  );

  if (duplicate) {
    return res.status(409).send('You have already submitted a claim for this item.');
  }

  const claim = {
    id: Date.now().toString(),
    itemId: item.id,
    itemName: item.itemName,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    proof: proof.trim(),
    status: 'Pending',
    createdAt: new Date().toISOString()
  };

  claims.push(claim);
  saveClaims(claims);

  res.send('Your claim has been submitted successfully. It is now awaiting admin review.');
});

module.exports = router;
