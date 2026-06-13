const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static files from the 'public' directory at root
app.use(express.static(path.join(__dirname, 'public')));

// Serve static assets from 'assets' directory at /assets
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Fallback to index.html for single-page applications
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
