require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool } = require('./config/mysqli');
// const basicAuth = require('express-basic-auth');

const app = express();
const port = process.env.PORT || 3000;

// Cek koneksi pool sebelum run server
(async () => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    console.log('✅ MySQL pool connection successful');
    connection.release();

    // ===== Middleware & Routing =====

    app.use(express.static(__dirname + '/public'));

    app.use(cors({
      origin: process.env.ALLOWED_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: false
    }));

    app.use((req, res, next) => {
      res.setTimeout(60000, () => {
        return res.status(503).json({ error: 'Request timeout. Please try again.' });
      });
      next();
    });

    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Basic Auth (optional)
    /*
    app.use(basicAuth({
      users: { [process.env.API_USERNAME]: process.env.API_PASSWORD },
      challenge: true,
      unauthorizedResponse: () => ({ error: 'Unauthorized' })
    }));
    */

    const router = require('./routes/router');
    app.use('/', router);

    app.get('/', (req, res) => {
      res.sendFile(__dirname + '/public/views/index.html');
    });

    app.listen(port, () => {
      console.log(`🚀 Server ready at http://localhost:${port}`);
    });

  } catch (err) {
     console.error('❌ MySQL pool connection failed:', err.message);
     console.error(err);
     process.exit(1);
  }
})();
