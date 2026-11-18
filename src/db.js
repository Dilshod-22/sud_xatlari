require("dotenv").config();
const { Pool, Client, types } = require("pg");

// DATE ustunini "YYYY-MM-DD" satr sifatida qaytarish (vaqt zonasi siljishisiz)
types.setTypeParser(1082, (v) => v);

const config = {
  host: process.env.PGHOST || "localhost",
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD || "postgres",
};
const DB_NAME = process.env.PGDATABASE || "letters_db";

const pool = new Pool({ ...config, database: DB_NAME });

// Baza bo'lmasa yaratadi (postgres tizim bazasiga ulanib)
async function ensureDatabase() {
  const client = new Client({ ...config, database: "postgres" });
  await client.connect();
  try {
    const { rowCount } = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [DB_NAME]
    );
    if (rowCount === 0) {
      // Identifikatorni parametr qilib bo'lmaydi, shuning uchun qo'shtirnoq bilan himoyalaymiz
      await client.query(`CREATE DATABASE "${DB_NAME.replace(/"/g, '""')}"`);
      console.log(`[db] "${DB_NAME}" bazasi yaratildi`);
    }
  } finally {
    await client.end();
  }
}

// Jadval va indekslarni yaratadi (bor bo'lsa tegmaydi)
async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS letters (
      id                  SERIAL PRIMARY KEY,
      timestamp           BIGINT       NOT NULL UNIQUE,
      name                TEXT         NOT NULL,
      content             TEXT,
      issued_date         DATE         NOT NULL,

      -- Xatni chiqargan MChJ (rekvizitlar)
      company_name        TEXT         NOT NULL,
      company_director    TEXT,
      company_bank        TEXT,
      company_phone       TEXT,
      company_account     TEXT,
      company_mfo         TEXT,
      company_stir        TEXT,
      company_address     TEXT,
      company_branch      TEXT,

      -- Sud manzillari: ["...", "..."]
      court_addresses     JSONB        NOT NULL DEFAULT '[]'::jsonb,

      created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    );
    -- Eski jadvalga keyin qo'shilgan ustunlar
    ALTER TABLE letters ADD COLUMN IF NOT EXISTS content TEXT;

    CREATE INDEX IF NOT EXISTS idx_letters_issued_date ON letters (issued_date);
  `);
  console.log("[db] letters jadvali tayyor");
}

async function initDb() {
  await ensureDatabase();
  await ensureSchema();
}

module.exports = { pool, initDb };
