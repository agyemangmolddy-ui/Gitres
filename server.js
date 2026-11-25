const express = require('express');
const path = require('path');
const api = require('./api');
const app = express();
const PORT = process.env.PORT || 3000;
app.use(api);
app.use(express.static(path.join(__dirname)));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'API route not found.' });
  res.sendFile(path.join(__dirname, 'index.html'), err => err && next(err));
});
app.listen(PORT, () => console.log(`DataVault running at http://localhost:${PORT}`));