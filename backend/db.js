const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "ledger_explorer",
  password: "Ramya sri012*",
  port: 5435,
});

module.exports = pool;