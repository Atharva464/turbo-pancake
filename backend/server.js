const express = require('express');
const app = express();
const path = require('path');

app.use(express.json());
app.use(express.static('public'));

const flatRoutes = require('./routes/flats');
const adminRoutes = require('./routes/admin');

app.use('/api/flats', flatRoutes);
app.use('/admin', adminRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/user', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));