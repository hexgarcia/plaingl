# BeanBooks — Change Log

All notable changes to BeanBooks, by version. Entries authored from the build
chat are credited to **Hector Garcia, CPA**.

The format groups changes under each version. Versions follow `0.0.0x` for now.

---

## v0.0.02 — 2026-06-14
**Author:** Hector Garcia, CPA

Entity security, read-only sample, duplication, and UI/navigation polish.

### Added
- **New-entity modal** replacing the inline name box. Collects Entity Name,
  File Owner (name), and a Password.
- **Password protection for new entities.** The owner name + a SHA-256 hash of
  the password are stored in the ledger's options (`bb_owner`, `bb_pwhash`).
  Opening a protected entity requires the owner name and password. *Note: this
  is a convenience lock — the underlying file is not encrypted.*
- **Owner name remembered** in local storage and pre-filled on future logins
  and new-entity creation.
- **"Start from" option in the new-entity modal:** create from scratch (empty
  ledger) or **duplicate** any existing entity — including the sample.
  Duplicating a password-protected entity requires that entity's password.
- **Read-only Sample Company.** The sample is renamed **"Sample Company
  (Read Only)"** and flagged `bb_readonly`; all edit paths (transactions,
  accounts, imports) refuse to modify it. It can be freely duplicated into a
  new editable entity.
- **Collapsible left navigation** — a « / » toggle collapses the sidebar to a
  slim rail; state is remembered.
- **Theme dropdown** at the bottom of the nav: **Default**, **Pretty**, and a
  new **Dark** theme. Replaces the old Pretty Mode button. Visual only.
- **Date range + beginning balance in the Data entry ledger** — From/To with
  presets; when filtered by an account, a "Beginning balance (before [date])"
  row seeds the running balance.
- **Income by Payee** and **Expenses by Payee** reports, with date-range
  presets on the Reports tab.
- This **CHANGELOG**.

### Notes
- All theming and the read-only/duplicate behavior are layered on top of the
  existing Beancount engine; no change to the accounting math.
- Engine test suite: 13/13 passing.

---

## v0.0.01 — 2026-06-13 (initial public build)
**Author:** Hector Garcia, CPA

The foundational rebuild of BeanBooks into a server-backed, plain-text
accounting app.

### Added
- **Beancount engine** (`lib/beancount`): tolerant parser, report engine
  (balances, P&L, balance sheet with equity close, A/R & A/P aging),
  serializer, integer-cents money model, and stable transaction IDs. Unit
  tested.
- **React application** (replacing the original single-file app) served at `/`,
  with five tabs: Reports, Data entry, Chart of accounts, Paste import, Export.
- **Editable register** with account filter, separate debit/credit columns,
  a single-line (Excel-style) view mode, and "— Split —" handling.
- **Validated write path** — every change is re-parsed and must balance before
  it is saved; the read-only sample aside, nothing invalid is written.
- **Server-side storage** via a store abstraction: filesystem locally,
  **Vercel Blob** in production (durable across deploys).
- **3-year sample dataset** (~9,000 balanced transactions) for a services firm,
  with a generator script.
- **Phase 0 correctness fixes:** balance sheet now balances (net income closed
  into equity) and all money math uses integer cents to avoid float drift.
- Deployed on Vercel via GitHub integration.
