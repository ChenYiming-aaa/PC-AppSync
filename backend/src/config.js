require('dotenv').config();

const mandatory = (key) => {
  const val = process.env[key];
  if (!val) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
  return val;
};

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  databaseUrl: mandatory('DATABASE_URL'),
  jwtSecret: mandatory('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
};
