// Storage abstraction for ledger files. Implementations: filesystem (local
// dev) and Vercel Blob (production). The server actions depend only on this
// interface, so swapping backends is a one-line change in index.ts.

export interface StoredEntity {
  id: string;
  name: string;
  beancount: string;
}

export interface LedgerStore {
  listEntities(): Promise<{ id: string; name: string }[]>;
  loadEntity(id: string): Promise<StoredEntity | null>;
  saveEntity(id: string, beancount: string): Promise<void>;
  createEntity(id: string, name: string): Promise<StoredEntity>;
}

/** Extract the title from a ledger's `option "title"`. */
export function titleOf(text: string, fallback: string): string {
  const m = text.match(/option\s+"title"\s+"([^"]*)"/);
  return m ? m[1] : fallback;
}

/** Sanitize an id to a safe slug (also guards against path traversal). */
export function safeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, "");
}

/** The seed ledger written on first run when the store is empty. */
export const SAMPLE_ID = "sample-company";

export const SAMPLE_LEDGER = `option "title" "Sample Company"
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
