const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/sale-requests', async (req, res) => {
  try {
    const [requests] = await db.query(`
      SELECT id, flat_no, wing, data, created_at
      FROM sale_requests
      WHERE status = 'pending'
      ORDER BY created_at DESC
    `);

    const formatted = requests.map(req => {
      const snap = JSON.parse(req.data || '{}');
      return {
        id: req.id,
        flat_no: req.flat_no,
        wing: req.wing,
        data: snap,
        created_at: req.created_at
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('Failed to fetch pending sale requests:', err);
    res.status(500).json({ error: 'Failed to fetch pending sale requests' });
  }
});

router.post('/sale-requests/approve', async (req, res) => {
  const { requestId } = req.body;
  if (!requestId) return res.status(400).json({ error: 'Missing request ID' });

  try {
    const [[request]] = await db.query('SELECT * FROM sale_requests WHERE id = ?', [requestId]);
    if (!request) return res.status(404).json({ error: 'Sale request not found' });

    const snapshot = JSON.parse(request.data || '{}');
    const { flat_no, wing, request_type, pass } = snapshot;
    const newStatus = request_type === 'hold' ? 'hold' : 'sold';

    const [[flat]] = await db.query('SELECT * FROM flats WHERE flat_no = ? AND wing = ?', [flat_no, wing]);
    if (!flat) return res.status(404).json({ error: 'Flat not found' });

    await db.query('UPDATE flats SET status = ?, sale_pass = ? WHERE id = ?', [newStatus, pass, flat.id]);

    await db.query(`
      INSERT INTO flat_sale_snapshots (flat_id, flat_no, wing, data)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE data = VALUES(data)
    `, [flat.id, flat_no, wing, JSON.stringify({
      flat_no,
      wing,
      area: flat.area,
      configuration: flat.configuration,
      pass: pass || '—',
      request_type,
      approved_at: new Date().toISOString()
    })]);

    await db.query('UPDATE sale_requests SET status = "approved" WHERE id = ?', [requestId]);

    res.json({ message: `✅ ${newStatus.toUpperCase()} request approved and flat marked as ${newStatus}` });
  } catch (err) {
    console.error('❌ Error approving sale request:', err);
    res.status(500).json({ error: 'Failed to approve sale request' });
  }
});

router.post('/sale-requests/reject', async (req, res) => {
  const { requestId } = req.body;
  if (!requestId) return res.status(400).json({ error: 'Missing request ID' });

  try {
    await db.query('UPDATE sale_requests SET status = "rejected" WHERE id = ?', [requestId]);
    res.json({ message: '❌ Sale request rejected' });
  } catch (err) {
    console.error('❌ Error rejecting sale request:', err);
    res.status(500).json({ error: 'Failed to reject sale request' });
  }
});

router.post('/bands/update-rate', async (req, res) => {
  const { band, rate } = req.body;
  if (!band || !rate) return res.status(400).json({ error: 'Missing band or rate' });

  try {
    const [result] = await db.query('UPDATE bands SET rate = ? WHERE name = ?', [rate, band]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Band not found' });
    }
    res.json({ message: '✅ Band rate updated successfully' });
  } catch (err) {
    console.error('❌ Error updating band rate:', err);
    res.status(500).json({ error: 'Failed to update band rate' });
  }
});

router.post('/bands', async (req, res) => {
  const { name, rate } = req.body;
  if (!name || !rate) return res.status(400).json({ error: 'Missing band name or rate' });

  try {
    const [existing] = await db.query('SELECT * FROM bands WHERE name = ?', [name]);
    if (existing.length) return res.status(409).json({ error: 'Band already exists' });

    await db.query('INSERT INTO bands (name, rate) VALUES (?, ?)', [name, rate]);
    res.json({ message: '✅ Band created successfully' });
  } catch (err) {
    console.error('❌ Error creating band:', err);
    res.status(500).json({ error: 'Failed to create band' });
  }
});

router.post('/update-status', async (req, res) => {
  const { flatId, status, pass } = req.body;
  if (!flatId || !status) {
    return res.status(400).json({ error: 'Missing flat ID or status' });
  }

  try {
    let passValue = null;

    if (['sold', 'hold'].includes(status)) {
      if (!pass || !/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6}$/.test(pass)) {
        return res.status(400).json({ error: 'Invalid pass format' });
      }
      passValue = pass;
    }

    const [result] = await db.query(
      'UPDATE flats SET status = ?, sale_pass = ? WHERE id = ?',
      [status, passValue, flatId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Flat not found or not updated' });
    }

    res.json({ message: '✅ Status updated successfully' });
  } catch (err) {
    console.error('❌ Failed to update flat status:', err);
    res.status(500).json({ error: 'Failed to update flat status' });
  }
});

module.exports = router;
