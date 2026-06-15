require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;
const HASS_URL = process.env.HASS_URL || 'http://localhost:8123';
const HASS_TOKEN = process.env.HASS_TOKEN;

if (!HASS_TOKEN) {
  console.warn('[proxy] WARNING: HASS_TOKEN is not defined in .env. Home Assistant authentication will fail.');
}

// ── WebSocket Proxy ──────────────────────────────────────────────────────────
wss.on('connection', (ws) => {
  console.log('[proxy] Frontend client connected');

  // Convert HTTP URL to WS URL
  const haWsUrl = HASS_URL.replace(/^http/, 'ws') + '/api/websocket';
  const haWs = new WebSocket(haWsUrl);

  haWs.on('open', () => {
    console.log('[proxy] Connected to Home Assistant');
  });

  haWs.on('message', (data) => {
    const msg = JSON.parse(data);
    
    // Handle HA authentication challenge
    if (msg.type === 'auth_required') {
      console.log('[proxy] Authenticating with Home Assistant...');
      haWs.send(JSON.stringify({
        type: 'auth',
        access_token: HASS_TOKEN
      }));
      return;
    }

    if (msg.type === 'auth_ok') {
      console.log('[proxy] Authentication successful');
    }

    if (msg.type === 'auth_invalid') {
      console.error('[proxy] Authentication failed:', msg.message);
    }

    // Forward all other messages from HA to the frontend
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data.toString());
    }
  });

  ws.on('message', (data) => {
    // Forward messages from the frontend to Home Assistant
    if (haWs.readyState === WebSocket.OPEN) {
      haWs.send(data.toString());
    } else {
      console.warn('[proxy] Frontend message dropped: HA connection not ready');
    }
  });

  haWs.on('error', (err) => {
    console.error('[proxy] Home Assistant WebSocket error:', err.message);
  });

  ws.on('error', (err) => {
    console.error('[proxy] Frontend WebSocket error:', err.message);
  });

  haWs.on('close', () => {
    console.log('[proxy] Home Assistant connection closed');
    if (ws.readyState === WebSocket.OPEN) ws.close();
  });

  ws.on('close', () => {
    console.log('[proxy] Frontend client disconnected');
    if (haWs.readyState === WebSocket.OPEN) haWs.close();
  });
});

app.use(cors());
app.use(express.json());

// Serve static files from the 'public' directory at root
app.use(express.static(path.join(__dirname, 'public')));

// Serve static assets from 'assets' directory at /assets
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Fallback to index.html for single-page applications
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
