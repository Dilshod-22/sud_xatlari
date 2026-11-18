require("dotenv").config();
const { Pool, Client, types } = require("pg");

// DATE ustunini "YYYY-MM-DD" satr sifatida qaytarish (vaqt zonasi siljishisiz)
types.setTypeParser(1082, (v) => v);

// DATABASE_URL berilsa (masalan Railway), shu ishlatiladi; aks holda PG* o'zgaruvchilar
const DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.DATABASE_PRIVATE_URL ||
  process.env.DATABASE_PUBLIC_URL;
// PGSSL=true — tashqi (public) ulanishda SSL kerak bo'lsa
const ssl = process.env.PGSSL ===  "true" ? { rejectUnauthorized: false } : undefined;

const config = {
  host: process.env.PGHOST || "localhost",
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || "postgres",
  password: process.env.PGPASSWORD || "postgres",
};
const DB_NAME = process.env.PGDATABASE || "letters_db";

const pool = DATABASE_URL
  ? new Pool({ connectionString: DATABASE_URL, ssl })
  : new Pool({ ...config, database: DB_NAME, ssl });

// Baza bo'lmasa yaratadi (postgres tizim bazasiga ulanib).
// DATABASE_URL bilan baza allaqachon tayyor (Railway yaratib bergan), shuning uchun o'tkazib yuboriladi.
async function ensureDatabase() {
  if (DATABASE_URL) return;
  const client = new Client({ ...config, database: "postgres", ssl });
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

// Qaysi bazaga ulanayotganini parolsiz ko'rsatadi (deploy xatolarini topish uchun)
function describeTarget() {
  const present = Object.keys(process.env)
    .filter((k) => /^(DATABASE_|PG)/.test(k) && process.env[k])
    .join(", ") || "yo'q";
  let target;
  if (DATABASE_URL) {
    try {
      const u = new URL(DATABASE_URL);
      target = `DATABASE_URL -> ${u.hostname}:${u.port || 5432}${u.pathname}`;
    } catch {
      target = "DATABASE_URL (noto'g'ri formatda!)";
    }
  } else {
    target = `PG* -> ${config.host}:${config.port}/${DB_NAME}`;
  }
  console.log(`[db] ulanish: ${target} | mavjud o'zgaruvchilar: ${present}`);
  // Railway o'zi beradigan ma'lumotlar: qaysi servis/environment'da ishlayapmiz
  const e = process.env;
  if (e.RAILWAY_SERVICE_NAME || e.RAILWAY_ENVIRONMENT_NAME) {
    const userVars = Object.keys(e).filter(
      (k) => !k.startsWith("RAILWAY_") && !k.startsWith("npm_") && !k.startsWith("NIXPACKS_")
    );
    console.log(
      `[railway] servis: ${e.RAILWAY_SERVICE_NAME} | environment: ${e.RAILWAY_ENVIRONMENT_NAME}` +
        ` | loyiha: ${e.RAILWAY_PROJECT_NAME} | commit: ${(e.RAILWAY_GIT_COMMIT_SHA || "").slice(0, 7)}`
    );
    console.log(`[railway] boshqa o'zgaruvchilar (nomlari): ${userVars.sort().join(", ")}`);
  }
}

async function initDb() {
  describeTarget();
  await ensureDatabase();
  await ensureSchema();
}

module.exports = { pool, initDb };
