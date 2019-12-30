module.exports = {
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB_TEST_URL: process.env.DB_TEST_URL
  || 'postgresql://dunder-mifflin:password@localhost/spaced_repetition_test',
  DB_URL: process.env.DB_URL
  || 'postgresql://dunder-mifflin:password@localhost/spaced_repetition',
  JWT_SECRET: process.env.JWT_SECRET || 'change-this-secret',
  JWT_EXPIRY: process.env.JWT_EXPIRY || '3h',
}
