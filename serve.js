const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.use(express.static('dist', {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));

app.use((err, req, res, next) => {
  if (err) {
    console.error('Error:', err);
    res.status(500).json({
      error: 'Chunk loading failed',
      message: err.message
    });
  } else {
    next();
  }
});

app.get('*', (req, res, next) => {
  const filePath = path.join(__dirname, 'dist', req.path);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return next();
  }

  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`
   ┌──────────────────────────────────────────┐
   │                                          │
   │   Zodiac Framework Server                │
   │                                          │
   │   - Local:    http://localhost:${port}      │
   │                                          │
   │   Routes will be handled by the SPA      │
   │   Static files served from /dist         │
   │   CORS enabled for development           │
   │                                          │
   └──────────────────────────────────────────┘
  `);
});