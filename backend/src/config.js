require('dotenv').config();

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret === 'dev-secret-change-me') {
  console.error('FATAL: JWT_SECRET must be set in .env');
  process.exit(1);
}

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
};
