# Elegance Boutique - Shop Money & Stock Control System

> **Version:** 1.0.0 (Boutique Edition)  
> **Repository:** [https://github.com/Dave1118m/shops.git](https://github.com/Dave1118m/shops.git)  
> **Tech Stack:** Node.js, TypeScript, Next.js App Router, Tailwind CSS, Prisma ORM, Microsoft SQL Server

---

## 📌 Core Purpose

A shop management system built first for a high-end boutique (ready to scale into a supermarket). It gives the Owner exact, real-time answers to two critical questions at any moment:
1. **How many goods remain in the shop?**
2. **How much money has the shop made or lost?**

---

## 🔒 Foundational Architecture & Business Rules

* **Ledger-Based Accounting:** Stock levels and money totals are **never typed in directly**. Every single purchase, sale, expense, return, and write-off is an immutable record (`StockMovement` & `MoneyEntry`). Remaining stock, cash balances, and profit are calculated dynamically from this ledger.
* **No Silent Overrides / Hard Deletes:** Mistakes or discrepancies cannot be deleted; they must be reversed or adjusted with logged reasons and audit trails.
* **Weighted Average Costing:** When new inventory arrives at a different buying price, the item's unit cost updates automatically based on weighted average formula including transport/shipping costs.
* **ACID Transactions:** Checkout atomically decrements inventory via `StockMovement`, records the sale with cost of goods snapshots, and credits cash in drawer in a single database transaction.

---

## 👔 Role Separation

* **Owner (Admin):**
  * Full backoffice access.
  * Adds items, sets buying and selling prices, configures size/color variants.
  * Records stock purchases and restock shipments.
  * Records operating expenses (rent, salaries, utilities) and personal drawings/injections.
  * Approves stock counts, write-offs, and sale cancellations.
  * Views real-time P&L (Gross Profit, Net Profit, Margin %) for any custom period.
* **Seller:**
  * Fast, responsive POS interface (desktop, tablet, mobile).
  * Rapid item selection by name, category, or barcode.
  * Real-time stock checks (cannot sell more than available).
  * Generates printed or PDF receipts with shop header and footer.
  * **Zero access** to buying prices, profit margins, or shop cash totals.
  * Daily sales summary for end-of-shift handover.

---

## 📁 Clean Folder Structure

```text
shops/
├── prisma/
│   ├── schema.prisma          # SQL Server models (Users, Items, Variants, Purchases, Sales, StockMovement, MoneyEntry, etc.)
│   └── seed.ts                # Initial seed data for Owner, Seller, Boutique Categories, Settings
├── src/
│   ├── app/
│   │   ├── (auth)/            # Authentication and login
│   │   ├── (owner)/           # Owner Backoffice (Dashboard, Inventory, P&L, Money)
│   │   │   └── dashboard/
│   │   ├── (pos)/             # Seller POS terminal (Cart, checkout, receipts)
│   │   │   └── page.tsx
│   │   ├── globals.css        # Tailwind styles & print CSS
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Role-based landing portal
│   ├── components/            # Reusable UI components
│   ├── lib/
│   │   ├── db.ts              # SQL Server client (Prisma)
│   │   ├── auth.ts            # Password hashing & JWT session management
│   │   ├── calculations.ts    # Weighted average cost, COGS, P&L, expected cash formulas
│   │   └── utils.ts           # Formatters (currency, receipt numbers)
│   ├── services/
│   │   ├── inventory.service.ts  # Ledger-based stock movements & audit corrections
│   │   ├── sales.service.ts      # Transaction-safe checkout & returns
│   │   └── finance.service.ts    # Purchases, expenses, P&L, daily drawer closing
│   └── types/                 # Shared TypeScript interfaces & DTOs
├── .env.example               # SQL Server connection template
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🚀 Getting Started

### 1. Configure Microsoft SQL Server
Update your `.env` file with your SQL Server connection details:
```env
DATABASE_URL="sqlserver://localhost:1433;database=BoutiqueShopDB;user=sa;password=YourPassword;encrypt=true;trustServerCertificate=true;"
JWT_SECRET="your-super-secret-jwt-key"
```

### 2. Install Dependencies & Generate Prisma Client
```bash
npm install
npx prisma generate
npx prisma db push
npm run seed
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
