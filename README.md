# Gold Dashboard

A private ledger for a jewellery shop's 11-month gold savings schemes. The owner keeps customer records, records each installment, and sees what has been collected.

## What it does

- **Customers** — add, search, and update customer records
- **Schemes** — open one 11-installment scheme per customer, with a fixed monthly amount and a preserved due-date schedule
- **Payments** — record a full installment on its due date, and clear a mistaken payment
- **Dashboard** — today's, this month's, and this year's collections, plus overdue installments
- **Archive** — keep finished and inactive records without deleting them
- **Passcode** — one owner signs in with a four-digit code

Amounts are stored in paise. Due dates follow the original start day, in Asia/Kolkata.

## Stack

- **Next.js 16** (App Router) and **React 19**
- **PostgreSQL** and **Prisma**
- **Auth.js** — credentials session in an HTTP-only cookie
- **Tailwind CSS**

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/rizaan0/golddashboard.git
cd golddashboard
npm install
```

### 2. Environment variables

Create a `.env` file:

```env
DATABASE_URL=your_database_url
AUTH_SECRET=replace-with-a-long-random-string
OWNER_PASSWORD=change-this-password
```

`OWNER_PASSWORD` is the four-digit passcode. Change it before anyone else can open the app.

### 3. Database

Start Postgres, apply the migrations, and create the owner:

```bash
npm run db:up
npm run db:migrate
npm run db:seed
```

### 4. Run

```bash
npm run dev
```

## Project structure

```
src/
  app/
    (auth)/login/     # Passcode sign-in
    (app)/            # Dashboard, customers, schemes, archive, settings
  components/         # Shell, forms, charts, glass controls
  lib/                # Money, dates, passcode, auth guard
  server/             # Queries, ledger rules, server actions
prisma/
  schema.prisma
  migrations/
```
