const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const [flats] = await db.query(`
      SELECT flats.*, bands.name AS band, 
             bands.rate AS psf_rate,
             flats.sale_pass
      FROM flats
      LEFT JOIN bands ON flats.band_id = bands.id
    `);
    if (!Array.isArray(flats)) throw new Error("Expected flat list array");
    res.json(flats);
  } catch (err) {
    console.error('Failed to fetch flats:', err);
    res.status(500).json({ error: 'Failed to fetch flats' });
  }
});


router.post('/sale-request', async (req, res) => {
  const { flatNo, wing, snapshot } = req.body;

  if (!flatNo || !wing || !snapshot) {
    return res.status(400).json({ error: 'Missing data' });
  }

  try {
    const [[flat]] = await db.query(
      'SELECT * FROM flats WHERE flat_no = ? AND wing = ?',
      [flatNo, wing]
    );
    if (!flat) return res.status(404).json({ error: 'Flat not found' });

    const minimalSnapshot = {
      flat_no: flat.flat_no,
      wing: flat.wing,
      area: flat.area,
      configuration: flat.configuration,
      request_type: snapshot.request_type,
      pass: snapshot.pass || '—',
      created_at: new Date().toISOString()
    };

    await db.query(
      `INSERT INTO sale_requests (flat_no, wing, data, status)
       VALUES (?, ?, ?, 'pending')`,
      [flatNo, wing, JSON.stringify(minimalSnapshot)]
    );

    res.json({ message: 'Request submitted successfully' });
  } catch (err) {
    console.error('Error submitting sale request:', err);
    res.status(500).json({ error: 'Sale request failed' });
  }
});

router.post('/update-status', async (req, res) => {
  const { flatId, status, pass } = req.body;
  if (!flatId || !status) {
    return res.status(400).json({ error: 'Missing flat ID or status' });
  }

  try {
    if (['sold', 'hold'].includes(status)) {
      if (!pass || !/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6}$/.test(pass)) {
        return res.status(400).json({ error: '❗ Pass must be 6-character alphanumeric' });
      }

      await db.query(
        'UPDATE flats SET status = ?, sale_pass = ? WHERE id = ?',
        [status, pass, flatId]
      );
    } else {
      await db.query(
        'UPDATE flats SET status = ?, sale_pass = NULL WHERE id = ?',
        [status, flatId]
      );
    }

    res.json({ message: 'Status updated successfully' });
  } catch (err) {
    console.error('Failed to update flat status:', err);
    res.status(500).json({ error: 'Failed to update flat status' });
  }
});

module.exports = router;
