// Filesystem-backed ledger store.
//
// Stores each entity as a `.beancount` file under `data/`. This is the first
// real server-side persistence step. On Vercel the filesystem is ephemeral
// (resets per deploy/instance), which is fine to prove the server-action +
// file architecture; swap this module for a Vercel Blob / Git implementation
// later without touching callers.

import { promises as fs } from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");

/** A stored entity is just an id (the filename) + its Beancount text. */
export interface StoredEntity {
  id: string; // slug, also the filename stem
  name: string; // from the ledger's `option "title"` if present, else id
  beancount: string;
}

function fileFor(id: string): string {
  // Guard against path traversal; ids are simple slugs.
  const safe = id.replace(/[^a-zA-Z0-9_-]/g, "");
  return path.join(DATA_DIR, safe + ".beancount");
}

function titleOf(text: string, fallback: string): string {
  const m = text.match(/option\s+"title"\s+"([^"]*)"/);
  return m ? m[1] : fallback;
}

async function ensureDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function listEntities(): Promise<{ id: string; name: string }[]> {
  await ensureDir();
  await seedIfEmpty();
  const files = await fs.readdir(DATA_DIR);
  const out: { id: string; name: string }[] = [];
  for (const f of files) {
    if (!f.endsWith(".beancount")) continue;
    const id = f.slice(0, -".beancount".length);
    const text = await fs.readFile(path.join(DATA_DIR, f), "utf8");
    out.push({ id, name: titleOf(text, id) });
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

export async function loadEntity(id: string): Promise<StoredEntity | null> {
  await ensureDir();
  try {
    const text = await fs.readFile(fileFor(id), "utf8");
    return { id, name: titleOf(text, id), beancount: text };
  } catch {
    return null;
  }
}

export async function saveEntity(id: string, beancount: string): Promise<void> {
  await ensureDir();
  // Write to a temp file then rename, so a crash can't leave a half-written
  // ledger. (The write-queue / validation layer will build on this later.)
  const target = fileFor(id);
  const tmp = target + ".tmp-" + Date.now();
  await fs.writeFile(tmp, beancount, "utf8");
  await fs.rename(tmp, target);
}

export async function createEntity(id: string, name: string): Promise<StoredEntity> {
  const text =
    'option "title" "' +
    name.replace(/"/g, "'") +
    '"\noption "operating_currency" "USD"\n\n';
  await saveEntity(id, text);
  return { id, name, beancount: text };
}

// ---- seed -----------------------------------------------------------------

/** Seed a demo entity on first run so the app isn't empty. */
async function seedIfEmpty(): Promise<void> {
  const files = await fs.readdir(DATA_DIR);
  if (files.some((f) => f.endsWith(".beancount"))) return;
  await saveEntity("sample-company", SAMPLE_LEDGER);
}

const SAMPLE_LEDGER = `option "title" "Sample Company"
option "operating_currency" "USD"

2026-01-01 open Assets:Bank:Checking USD
2026-01-01 open Assets:AccountsReceivable USD
2026-01-01 open Liabilities:AccountsPayable USD
2026-01-01 open Liabilities:CreditCard USD
2026-01-01 open Equity:Owner USD
2026-01-01 open Income:Sales USD
2026-01-01 open Income:Consulting USD
2026-01-01 open Expenses:Rent USD
2026-01-01 open Expenses:Software USD
2026-01-01 open Expenses:Payroll USD

2026-01-01 * "Owner" "Opening contribution"
  Assets:Bank:Checking            35000.00 USD
  Equity:Owner                   -35000.00 USD

2026-02-04 * "Bright Dental" "Invoice 1014"
  customer: "Bright Dental"
  due: "2026-03-06"
  Assets:AccountsReceivable        1250.00 USD
  Income:Sales                    -1250.00 USD

2026-02-10 * "Northside Workspace" "February rent"
  Expenses:Rent                    2400.00 USD
  Assets:Bank:Checking            -2400.00 USD

2026-02-15 * "Acme Foods" "Consulting February"
  customer: "Acme Foods"
  due: "2026-03-17"
  Assets:AccountsReceivable        1800.00 USD
  Income:Consulting               -1800.00 USD

2026-02-18 * "Adobe" "Software subscription"
  vendor: "Adobe"
  Expenses:Software                  89.00 USD
  Liabilities:CreditCard            -89.00 USD

2026-02-20 * "Bright Dental" "Payment for INV 1014"
  applies_to: "inv_1014"
  Assets:Bank:Checking             1250.00 USD
  Assets:AccountsReceivable       -1250.00 USD

2026-02-25 * "Office Supply Co" "Supplies bill"
  vendor: "Office Supply Co"
  due: "2026-03-27"
  Expenses:Software                 320.00 USD
  Liabilities:AccountsPayable      -320.00 USD

2026-02-28 * "Payroll" "February payroll"
  Expenses:Payroll                 6200.00 USD
  Assets:Bank:Checking            -6200.00 USD
`;
