/**
 * SECURITY: Basic Auth Server for Frontend Protection
 * 
 * Serves React build with HTTP Basic Authentication protection
 * Used for staging/development to keep site hidden from public
 */

require('dotenv').config();
const express = require('express');
const path = require('path');
const basicAuth = require('basic-auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Basic Auth Configuration
const BASIC_AUTH_ENABLED = process.env.BASIC_AUTH_ENABLED === 'false';
const BASIC_AUTH_USERNAME = process.env.BASIC_AUTH_USERNAME || 'quankey';
const BASIC_AUTH_PASSWORD = process.env.BASIC_AUTH_PASSWORD || 'quantum2025';
const BASIC_AUTH_REALM = process.env.BASIC_AUTH_REALM || 'Quankey Staging';

// Basic Auth Middleware
const basicAuthMiddleware = (req, res, next) => {
  if (!BASIC_AUTH_ENABLED) {
    return next();
  }

  const user = basicAuth(req);

  if (!user || user.name !== BASIC_AUTH_USERNAME || user.pass !== BASIC_AUTH_PASSWORD) {
    res.set('WWW-Authenticate', `Basic realm="${BASIC_AUTH_REALM}"`);
    return res.status(401).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Required</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container {
              text-align: center;
              background: rgba(255,255,255,0.1);
              backdrop-filter: blur(10px);
              padding: 2rem;
              border-radius: 16px;
              border: 1px solid rgba(255,255,255,0.2);
            }
            h1 { margin: 0 0 1rem 0; font-size: 2rem; }
            p { margin: 0; opacity: 0.8; }
            .logo { font-size: 3rem; margin-bottom: 1rem; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🔐</div>
            <h1>Quankey Staging</h1>
            <p>Authentication required to access this site</p>
          </div>
        </body>
      </html>
    `);
  }

  next();
};

// Apply Basic Auth to all routes
app.use(basicAuthMiddleware);

// Serve React build files
app.use(express.static(path.join(__dirname, 'build')));

// Handle React Router (return index.html for all non-API routes)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Frontend server running on 0.0.0.0:${PORT}`);
  console.log(`🌐 Accessible from: http://54.72.3.39:${PORT}`);
  
  if (BASIC_AUTH_ENABLED) {
    console.log(`🔐 Basic Auth enabled - Realm: "${BASIC_AUTH_REALM}"`);
    console.log(`👤 Username: ${BASIC_AUTH_USERNAME}`);
    console.log(`🔑 Password: ${BASIC_AUTH_PASSWORD.replace(/./g, '*')}`);
  } else {
    console.log(`⚠️  Basic Auth disabled - Site is PUBLIC`);
  }
  
  console.log(`🚀 Local access: http://localhost:${PORT}`);
  console.log(`🌍 Public access: http://54.72.3.39:${PORT}`);
});
