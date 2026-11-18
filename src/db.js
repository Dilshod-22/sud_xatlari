const { Pool, types } = require("pg");

// DATE ustunini "YYYY-MM-DD" satr sifatida qaytarish (vaqt zonasi siljishisiz)
types.setTypeParser(1082, (v) => v);

// Railway PostgreSQL — ulanish ma'lumotlari to'g'ridan-to'g'ri kodda (test loyiha)
// Eslatma: postgres.railway.internal faqat Railway ichida ishlaydi
const DB_CONFIG = {
  host: "postgres.railway.internal",
  port: 5432,
  user: "postgres",
  password: "IjUHpBRqYfNCQUIjwHjtrsSpmMhJEOPP",
  database: "railway",
};

const pool = new Pool(DB_CONFIG);

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
  console.log(`[db] ulanish: ${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`);
  await ensureSchema();
}

module.exports = { pool, initDb };
