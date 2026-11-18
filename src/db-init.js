// Faqat bazani sozlash uchun: npm run db:init
const { pool, initDb } = require("./db");

initDb()
  .then(() => console.log("[db] tayyor"))
  .catch((err) => {
    console.error("[db] xato:", err.message || err.code || err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
