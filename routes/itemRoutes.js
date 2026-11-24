// routes/itemRoutes.js
// Member 3: homepage, browse/search items, item details page.
// In server.js this file is used with:  app.use('/', require('./routes/itemRoutes'));

const express = require('express');
const router = express.Router();
const storage = require('../utils/fileStorage');

// Lists used by the filter dropdowns (the report forms should use the same lists)
const categories = ['Electronics', 'Bags', 'Books and Stationery', 'Clothing', 'Keys', 'ID Cards and Wallets', 'Water Bottles', 'Other'];
const locations = ['Library', 'Cafeteria', 'Student Centre', 'Lecture Halls', 'Computer Labs', 'Sports Grounds', 'Parking', 'Security Office', 'Other'];

// Messages for the green banner. Other pages redirect to /items?success=lost etc.
const messages = {
  lost: 'Your lost item report has been saved.',
  found: 'Thank you! Your found item report has been saved.',
  claim: 'Your claim has been submitted. The admin will contact you.'
};

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Read all items from data/items.json
// (Member 1: if your storage function has another name, change it here only)
function getItems() {
  const items = storage.readData('items');
  if (Array.isArray(items)) {
    return items;
  }
  return [];
}

// Items with status "Removed" are never shown to the public
function getPublicItems() {
  const all = getItems();
  const result = [];
  for (let i = 0; i < all.length; i++) {
    if (all[i].status !== 'Removed') {
      result.push(all[i]);
    }
  }
  return result;
}

// "2026-11-05" becomes "5 Nov 2026"
function formatDate(text) {
  if (!text) return '';
  const parts = String(text).slice(0, 10).split('-');
  if (parts.length !== 3) return '';
  const month = months[Number(parts[1]) - 1];
  if (!month) return '';
  return Number(parts[2]) + ' ' + month + ' ' + parts[0];
}

// Cut long descriptions so the cards stay the same size
function shorten(text, max) {
  text = String(text || '');
  if (text.length > max) {
    return text.slice(0, max) + '...';
  }
  return text;
}

// Put the CSS class for each status
function statusClass(status) {
  if (status === 'Under Review') return 'status-review';
  if (status === 'Ready for Pickup') return 'status-ready';
  if (status === 'Returned') return 'status-returned';
  return 'status-open';
}

// Newest reports first
function sortNewest(a, b) {
  if (a.createdAt < b.createdAt) return 1;
  if (a.createdAt > b.createdAt) return -1;
  return 0;
}

// Only copy the fields that are safe to show on public pages.
// Email, phone, storageLocation and verificationDetail are NOT copied on purpose.
function makeViewItem(item) {
  const isFound = item.reportType === 'found';
  const status = item.status || 'Open';
  let photo = '';
  if (item.imagePath && String(item.imagePath).startsWith('/uploads/')) {
    photo = item.imagePath;
  }
  const firstName = String(item.reporterName || '').trim().split(' ')[0];

  return {
    id: item.id,
    type: isFound ? 'found' : 'lost',
    typeLabel: isFound ? 'Found' : 'Lost',
    itemName: item.itemName || 'Unnamed item',
    category: item.category || 'Other',
    description: item.description || '',
    shortDescription: shorten(item.description, 110),
    location: item.location || 'Not specified',
    placeLabel: isFound ? 'Found at' : 'Last seen at',
    dateLabel: isFound ? 'Date found' : 'Date lost',
    displayDate: formatDate(item.eventDate),
    reportedOn: formatDate(item.createdAt),
    reporterFirstName: firstName || 'A student',
    imagePath: photo,
    status: status,
    statusClass: statusClass(status)
  };
}

// Get the banner message from the ?success= part of the link
function getBanner(req) {
  const key = req.query.success;
  if (key === 'lost' || key === 'found' || key === 'claim') {
    return messages[key];
  }
  return '';
}

// Does the item contain all the words the user typed?
function matchesSearch(item, search) {
  if (!search) return true;
  const text = (item.itemName + ' ' + item.description + ' ' + item.category).toLowerCase();
  const words = search.toLowerCase().split(' ');
  for (let i = 0; i < words.length; i++) {
    if (words[i] !== '' && !text.includes(words[i])) {
      return false;
    }
  }
  return true;
}

// GET /  -> homepage
router.get('/', function (req, res) {
  const items = getPublicItems();

  // count for the three boxes on the homepage
  let lostCount = 0;
  let foundCount = 0;
  let returnedCount = 0;
  for (let i = 0; i < items.length; i++) {
    if (items[i].status === 'Returned') {
      returnedCount++;
    } else if (items[i].reportType === 'found') {
      foundCount++;
    } else {
      lostCount++;
    }
  }

  // show the 6 newest items
  items.sort(sortNewest);
  const recent = items.slice(0, 6).map(makeViewItem);

  res.render('index', {
    title: 'Home',
    active: 'home',
    stats: { lost: lostCount, found: foundCount, returned: returnedCount },
    recent: recent,
    success: getBanner(req)
  });
});

// GET /items  -> browse page with search and filters
router.get('/items', function (req, res) {
  // read what the user typed / picked (empty string if nothing)
  const filters = {
    q: typeof req.query.q === 'string' ? req.query.q.trim() : '',
    category: typeof req.query.category === 'string' ? req.query.category : '',
    location: typeof req.query.location === 'string' ? req.query.location : '',
    type: typeof req.query.type === 'string' ? req.query.type : ''
  };

  const allItems = getPublicItems();
  const results = [];

  for (let i = 0; i < allItems.length; i++) {
    const item = allItems[i];
    if (!matchesSearch(item, filters.q)) continue;
    if (filters.category !== '' && item.category !== filters.category) continue;
    if (filters.location !== '' && item.location !== filters.location) continue;
    if (filters.type !== '' && item.reportType !== filters.type) continue;
    results.push(item);
  }

  results.sort(sortNewest);

  res.render('browse-items', {
    title: 'Browse Items',
    active: 'browse',
    items: results.map(makeViewItem),
    total: allItems.length,
    filters: filters,
    hasFilters: filters.q !== '' || filters.category !== '' || filters.location !== '' || filters.type !== '',
    categories: categories,
    locations: locations,
    success: getBanner(req)
  });
});

// GET /items/:id  -> one item
router.get('/items/:id', function (req, res) {
  const items = getPublicItems();
  let found = null;
  for (let i = 0; i < items.length; i++) {
    if (String(items[i].id) === req.params.id) {
      found = items[i];
    }
  }

  // item does not exist (or was removed)
  if (found === null) {
    return res.status(404).render('item-details', {
      title: 'Item not found',
      active: 'browse',
      item: null,
      canClaim: false,
      success: ''
    });
  }

  const item = makeViewItem(found);

  // the claim button only shows for found items that are not yet approved/returned
  const canClaim = item.type === 'found' && (item.status === 'Open' || item.status === 'Under Review');

  res.render('item-details', {
    title: item.itemName,
    active: 'browse',
    item: item,
    canClaim: canClaim,
    success: getBanner(req)
  });
});

module.exports = router;
