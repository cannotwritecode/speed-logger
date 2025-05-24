const fs = require("fs");
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function setupDatabase() {
  try {
    // Read the SQL file
    const sql = fs.readFileSync("./db/migrations.sql", "utf8");

    // Connect to the database
    const client = await pool.connect();

    try {
      // Execute the SQL commands
      await client.query(sql);
      console.log("Database setup completed successfully");
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (err) {
    console.error("Error setting up database:", err);
  } finally {
    // Close the pool
    await pool.end();
  }
}

setupDatabase();
