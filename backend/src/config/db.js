const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'sgp_db',
  user: process.env.DB_USER || 'sgp_user',
  password: process.env.DB_PASSWORD || 'sgp_pass_2026',
});

module.exports = pool;
