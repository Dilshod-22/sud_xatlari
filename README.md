# Letters API

Xatlar ma'lumotlarini (matni, sana, timestamp, nomi, xatni chiqargan MChJ rekvizitlari, sud manzillari) PostgreSQL bazasida saqlaydi.

## Ishga tushirish

1. `.env` faylida PostgreSQL ulanish ma'lumotlarini kiriting (`PGUSER`, `PGPASSWORD` va h.k.).
2. `npm install`
3. `npm start`

Server ishga tushganda o'zi:
- `letters_db` bazasi bo'lmasa, uni yaratadi;
- `letters` jadvali va indeksni yaratadi (`IF NOT EXISTS`, ya'ni bor ma'lumotga tegmaydi).

Faqat bazani sozlash kerak bo'lsa: `npm run db:init`.

## API

### `POST /api/letters` — xatni saqlash

```json
{
  "timestamp": 1760428800000,
  "name": "Qarzdorlik bo'yicha ogohlantirish xati",
  "content": "Hurmatli mijoz! ... (xatning to'liq matni)",
  "issuedDate": "2026-10-14",
  "company": {
    "name": "LONG SHOT",
    "director": "И.И.Қодиров",
    "bank": "АТБ \"Trastbank\"",
    "phone": "+998 (97) 373-17-71",
    "account": "20208000407161435001",
    "mfo": "00491",
    "stir": "311688181",
    "address": "CHirchiq sh. Chirchiq 50-Yillig shox ko`chasi 29-uy",
    "branch": "Чирчик"
  },
  "courtAddresses": ["Toshkent viloyati, Chirchiq shahar fuqarolik ishlari bo'yicha sudi"]
}
```

Majburiy maydonlar: `timestamp`, `name`, `content` (xat matni), `issuedDate`, `company.name`. `timestamp` takrorlanmasligi kerak.

Javoblar: `201` saqlandi, `400` maydonlarda xato bor, `409` bu timestamp bilan xat allaqachon bor.

### `GET /api/letters/:timestamp` — xatni olish

Yuqoridagi formatda xatni qaytaradi (qo'shimcha ravishda `id` va `createdAt` ham keladi). Xat topilmasa `404`.

## Postman testlari

`letters-api.postman_collection.json` — 11 ta so'rov va 30 ta avtomatik tekshiruv:

- **1. Muvaffaqiyatli holatlar** — xatni saqlash (201), timestamp bo'yicha olish (200), faqat majburiy maydonlar bilan saqlash (201)
- **2. Xatolik holatlari** — takroriy timestamp (409), majburiy maydonlar yo'q / xat matni yo'q / noto'g'ri timestamp / noto'g'ri sana / `courtAddresses` massiv emas (400), topilmagan xat (404), son bo'lmagan timestamp (400)

Har ishga tushirishda timestamp avtomatik `Date.now()` bilan yangilanadi, shuning uchun testlarni qayta-qayta ishlatsa bo'ladi. So'rovlar bir-biriga bog'liq, ularni tartib bilan ishga tushiring.

Postman ilovasida: **Import** → faylni tanlang → **Run collection**.

CLI orqali:

```
postman collection run letters-api.postman_collection.json
```

Server boshqa manzilda bo'lsa: `--env-var baseUrl=http://HOST:PORT`
