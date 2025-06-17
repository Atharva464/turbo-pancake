const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');

const upload = multer({ dest: 'uploads/' });

router.post('/flats', upload.single('file'), (req, res) => {
  const results = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      try {
        for (const row of results) {
          const [band] = await db.query('SELECT id FROM bands WHERE name = ?', [row.band_name]);
          if (!band.length) continue;

          const bandId = band[0].id;

          await db.query(
            `INSERT INTO flats (flat_no, wing, floor, area, configuration, status, band_id, custom_psf_rate)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              row.flat_no,
              row.wing,
              parseInt(row.floor),
              parseFloat(row.area),
              row.configuration,
              row.status,
              bandId,
              row.custom_psf_rate ? parseFloat(row.custom_psf_rate) : null
            ]
          );
        }

        fs.unlinkSync(req.file.path); // cleanup
        res.json({ message: 'Flats imported successfully' });
      } catch (err) {
        console.error('Import error:', err);
        res.status(500).json({ error: 'Import failed' });
      }
    });
});

module.exports = router;
