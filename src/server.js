const express = require("express");
const { pool, initDb } = require("./db");

const app = express();
app.use(express.json({ limit: "1mb" }));

// DB qatorini API javob formatiga o'giradi
function toLetter(row) {
  return {
    id: row.id,
    timestamp: Number(row.timestamp),
    name: row.name,
    content: row.content,
    issuedDate:
      row.issued_date instanceof Date
        ? row.issued_date.toISOString().slice(0, 10)
        : row.issued_date,
    company: {
      name: row.company_name,
      director: row.company_director,
      bank: row.company_bank,
      phone: row.company_phone,
      account: row.company_account,
      mfo: row.company_mfo,
      stir: row.company_stir,
      address: row.company_address,
      branch: row.company_branch,
    },
    courtAddresses: row.court_addresses,
    createdAt: row.created_at,
  };
}

function validate(body) {
  const errors = [];
  if (!body || typeof body !== "object") return ["Body JSON bo'lishi kerak"];
  if (!Number.isInteger(body.timestamp) || body.timestamp <= 0)
    errors.push("timestamp musbat butun son bo'lishi kerak");
  if (!body.name || typeof body.name !== "string") errors.push("name majburiy");
  if (!body.content || typeof body.content !== "string")
    errors.push("content (xat matni) majburiy");
  if (!body.issuedDate || Number.isNaN(Date.parse(body.issuedDate)))
    errors.push("issuedDate majburiy (YYYY-MM-DD)");
  if (!body.company || typeof body.company !== "object" || !body.company.name)
    errors.push("company.name majburiy");
  if (
    body.courtAddresses !== undefined &&
    (!Array.isArray(body.courtAddresses) ||
      body.courtAddresses.some((a) => typeof a !== "string"))
  )
    errors.push("courtAddresses satrlar massivi bo'lishi kerak");
  return errors;
}

// POST /api/letters — xatni saqlash
app.post("/api/letters", async (req, res) => {
  const errors = validate(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const { timestamp, name, content, issuedDate, company, courtAddresses = [] } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO letters (
         timestamp, name, content, issued_date,
         company_name, company_director, company_bank, company_phone,
         company_account, company_mfo, company_stir, company_address, company_branch,
         court_addresses
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        timestamp,
        name,
        content,
        issuedDate,
        company.name,
        company.director ?? null,
        company.bank ?? null,
        company.phone ?? null,
        company.account ?? null,
        company.mfo ?? null,
        company.stir ?? null,
        company.address ?? null,
        company.branch ?? null,
        JSON.stringify(courtAddresses),
      ]
    );
    res.status(201).json(toLetter(rows[0]));
  } catch (err) {
    if (err.code === "23505")
      return res.status(409).json({ error: "Bu timestamp bilan xat allaqachon mavjud" });
    console.error(err);
    res.status(500).json({ error: "Server xatosi" });
  }
});

// GET /api/letters/:timestamp — timestamp bo'yicha xatni olish
app.get("/api/letters/:timestamp", async (req, res) => {
  const ts = req.params.timestamp;
  if (!/^\d+$/.test(ts))
    return res.status(400).json({ error: "timestamp butun son bo'lishi kerak" });

  try {
    const { rows } = await pool.query("SELECT * FROM letters WHERE timestamp = $1", [ts]);
    if (!rows.length) return res.status(404).json({ error: "Xat topilmadi" });
    res.json(toLetter(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server xatosi" });
  }
});

const PORT = Number(process.env.PORT || 3000);

initDb()
  .then(() => {
    app.listen(PORT, () => console.log(`[api] http://localhost:${PORT} da ishlayapti`));
  })
  .catch((err) => {
    console.error("[db] Bazani sozlab bo'lmadi:", err.message || err.code || err);
    process.exit(1);
  });
