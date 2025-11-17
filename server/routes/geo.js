const express = require('express');
const router = express.Router();
const { geocodeAddress, suggestAddresses } = require('../services/geo.service');

// Public geocode endpoint with suggestions support
// GET /api/geo/geocode?q=12 Delhi 110043
router.get('/geocode', async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim();
    if (!q) {
      return res.status(400).json({ status: 'error', message: 'Query parameter q is required' });
    }
    const result = await geocodeAddress(q);
    if (!result) {
      return res.status(404).json({ status: 'error', message: 'No results for the provided address' });
    }
    res.json({ status: 'success', data: result });
  } catch (err) {
    console.error('Geo geocode error:', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to geocode address' });
  }
});

module.exports = router;
// Extra: suggestions endpoint
router.get('/suggest', async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim();
    const limit = parseInt(req.query.limit || '5');
    if (!q) {
      return res.status(400).json({ status: 'error', message: 'Query parameter q is required' });
    }
    const items = await suggestAddresses(q, Math.min(Math.max(limit, 1), 10));
    res.json({ status: 'success', data: items });
  } catch (err) {
    console.error('Geo suggest error:', err.message);
    res.status(500).json({ status: 'error', message: 'Failed to get address suggestions' });
  }
});
