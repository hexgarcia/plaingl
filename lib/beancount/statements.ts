// QuickBooks-style financial statements: Profit & Loss and Balance Sheet,
// rendered as a flat list of display rows with indentation derived from the
// account colon-hierarchy and "Total for <group>" subtotals.
//
// Sections are inferred from account-name conventions:
//   Expenses:COGS:*  (or :CostOfGoodsSold:)  -> Cost of Goods Sold
//   Income:Other:*                            -> Other Income
//   Expenses:Other:*                          -> Other Expense / Other Expenses
// Everything else falls under ordinary Income / Expenses.

import { Ledger, accountType } from "./types";
import { balances, DateRange } from "./report";

export type RowKind =
  | "section" // shaded band header (Income, Expenses, …)
  | "account" // a leaf or parent account line
  | "groupHeader" // a parent account that has children (its own label row)
  | "subtotal" // "Total for <group>"
  | "total" // section total (Total for Income, Total Expenses)
  | "grandtotal" // Gross Profit, Net Operating Income, Net Income, Total Assets …
  | "spacer";

export interface StatementRow {
  kind: RowKind;
  label: string;
  depth: number; // indentation level (0-based)
  cents?: number; // omitted for pure header/spacer rows
  bold?: boolean;
}

// ---- account tree ---------------------------------------------------------

interface Node {
  name: string; // segment label
  full: string; // full account path
  own: number; // own posting amount (display sign)
  children: Map<string, Node>;
}

function newNode(name: string, full: string): Node {
  return { name, full, own: 0, children: new Map() };
}

/** Build a tree from accounts under a given set of roots, after a prefix. */
function buildTree(
  entries: { account: string; cents: number }[],
  stripSegments: number
): Node {
  const root = newNode("", "");
  for (const { account, cents } of entries) {
    const segs = account.split(":").slice(stripSegments);
    if (segs.length === 0) continue;
    let node = root;
    let path = account
      .split(":")
      .slice(0, stripSegments)
      .join(":");
    for (const seg of segs) {
      path = path ? path + ":" + seg : seg;
      let child = node.children.get(seg);
      if (!child) {
        child = newNode(seg, path);
        node.children.set(seg, child);
      }
      node = child;
    }
    node.own += cents;
  }
  return root;
}

/** Total of a node = own + sum of descendants. */
function nodeTotal(node: Node): number {
  let sum = node.own;
  for (const c of node.children.values()) sum += nodeTotal(c);
  return sum;
}

/** Humanize a segment: "Revenue-Product" -> "Revenue - Product", camelCase -> spaced. */
function humanize(seg: string): string {
  return seg
    .replace(/-/g, " - ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Emit display rows for a node's children (QB layout):
 *  - leaf:            account line (its total)
 *  - parent w/ kids:  group header, [own amount as a child if non-zero],
 *                     children…, then "Total for <group>"
 */
function emitChildren(node: Node, depth: number, out: StatementRow[]): void {
  const kids = [...node.children.values()].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  for (const child of kids) {
    const total = nodeTotal(child);
    if (Math.abs(total) < 0.5 && child.children.size === 0) continue; // skip empty leaves
    if (child.children.size === 0) {
      out.push({ kind: "account", label: humanize(child.name), depth, cents: total });
    } else {
      out.push({ kind: "groupHeader", label: humanize(child.name), depth });
      // a parent with its own direct postings shows that as an indented line
      if (Math.abs(child.own) >= 0.5) {
        out.push({ kind: "account", label: humanize(child.name), depth: depth + 1, cents: child.own });
      }
      emitChildren(child, depth + 1, out);
      out.push({
        kind: "subtotal",
        label: "Total for " + humanize(child.name),
        depth,
        cents: total,
        bold: true,
      });
    }
  }
}

// ---- section selection ----------------------------------------------------

function isCOGS(account: string): boolean {
  return /:(COGS|CostOfGoodsSold|CostOfSales)(:|$)/i.test(account);
}
function isOther(account: string): boolean {
  return /:Other(:|$)/i.test(account);
}

interface Sectioned {
  cents: number;
  rows: StatementRow[];
}

/** Build one section's rows + total from a filtered set of accounts. */
function section(
  entries: { account: string; cents: number }[],
  stripSegments: number
): Sectioned {
  if (entries.length === 0) return { cents: 0, rows: [] };
  const tree = buildTree(entries, stripSegments);
  const rows: StatementRow[] = [];
  emitChildren(tree, 1, rows);
  const cents = entries.reduce((s, e) => s + e.cents, 0);
  return { cents, rows };
}

// ---- Profit & Loss --------------------------------------------------------

export interface ProfitLoss {
  rows: StatementRow[];
  netIncome: number;
}

export function profitAndLoss(ledger: Ledger, range: DateRange = {}): ProfitLoss {
  const b = balances(ledger, range);
  // display-sign entries
  const income: { account: string; cents: number }[] = [];
  const cogs: { account: string; cents: number }[] = [];
  const expenses: { account: string; cents: number }[] = [];
  const otherIncome: { account: string; cents: number }[] = [];
  const otherExpense: { account: string; cents: number }[] = [];

  for (const [account, raw] of b) {
    const t = accountType(account);
    if (t === "Income") {
      const cents = -raw; // income shown positive
      (isOther(account) ? otherIncome : income).push({ account, cents });
    } else if (t === "Expenses") {
      const cents = raw; // expenses shown positive
      if (isCOGS(account)) cogs.push({ account, cents });
      else if (isOther(account)) otherExpense.push({ account, cents });
      else expenses.push({ account, cents });
    }
  }

  const rows: StatementRow[] = [];
  const inc = section(income, 1);
  const cog = section(cogs, 1); // strip "Expenses" only; COGS group still shows
  const exp = section(expenses, 1);
  const oInc = section(otherIncome, 1);
  const oExp = section(otherExpense, 1);

  // Income
  rows.push({ kind: "section", label: "Income", depth: 0 });
  rows.push(...inc.rows);
  rows.push({ kind: "total", label: "Total for Income", depth: 0, cents: inc.cents, bold: true });

  // COGS + Gross Profit
  if (cog.rows.length) {
    rows.push({ kind: "section", label: "Cost of Goods Sold", depth: 0 });
    rows.push(...cog.rows);
    rows.push({ kind: "total", label: "Total for Cost of Goods Sold", depth: 0, cents: cog.cents, bold: true });
  }
  const grossProfit = inc.cents - cog.cents;
  rows.push({ kind: "grandtotal", label: "Gross Profit", depth: 0, cents: grossProfit, bold: true });

  // Expenses
  rows.push({ kind: "section", label: "Expenses", depth: 0 });
  rows.push(...exp.rows);
  rows.push({ kind: "total", label: "Total for Expenses", depth: 0, cents: exp.cents, bold: true });

  const netOperating = grossProfit - exp.cents;
  rows.push({ kind: "grandtotal", label: "Net Operating Income", depth: 0, cents: netOperating, bold: true });

  // Other income / expense
  const hasOther = oInc.rows.length || oExp.rows.length;
  if (oInc.rows.length) {
    rows.push({ kind: "section", label: "Other Income", depth: 0 });
    rows.push(...oInc.rows);
    rows.push({ kind: "total", label: "Total for Other Income", depth: 0, cents: oInc.cents, bold: true });
  }
  if (oExp.rows.length) {
    rows.push({ kind: "section", label: "Other Expenses", depth: 0 });
    rows.push(...oExp.rows);
    rows.push({ kind: "total", label: "Total for Other Expenses", depth: 0, cents: oExp.cents, bold: true });
  }
  const netOther = oInc.cents - oExp.cents;
  if (hasOther) {
    rows.push({ kind: "grandtotal", label: "Net Other Income", depth: 0, cents: netOther, bold: true });
  }

  const netIncome = netOperating + netOther;
  rows.push({ kind: "grandtotal", label: "Net Income", depth: 0, cents: netIncome, bold: true });

  return { rows, netIncome };
}

// ---- Balance Sheet --------------------------------------------------------

export interface BalanceSheetStmt {
  rows: StatementRow[];
  totalAssets: number;
  totalLiabEquity: number;
  balances: boolean;
}

export function balanceSheetStatement(
  ledger: Ledger,
  asOf?: string
): BalanceSheetStmt {
  const b = balances(ledger, { to: asOf });
  const assets: { account: string; cents: number }[] = [];
  const liabilities: { account: string; cents: number }[] = [];
  const equity: { account: string; cents: number }[] = [];
  let income = 0; // for current-year earnings closed into equity

  for (const [account, raw] of b) {
    const t = accountType(account);
    if (t === "Assets") assets.push({ account, cents: raw });
    else if (t === "Liabilities") liabilities.push({ account, cents: -raw });
    else if (t === "Equity") equity.push({ account, cents: -raw });
    else if (t === "Income") income += -raw;
    else if (t === "Expenses") income -= raw;
  }
  const currentEarnings = income; // net income through asOf

  const a = section(assets, 1);
  const l = section(liabilities, 1);
  const e = section(equity, 1);

  const rows: StatementRow[] = [];
  rows.push({ kind: "section", label: "ASSETS", depth: 0 });
  rows.push(...a.rows);
  const totalAssets = a.cents;
  rows.push({ kind: "grandtotal", label: "Total Assets", depth: 0, cents: totalAssets, bold: true });

  rows.push({ kind: "spacer", label: "", depth: 0 });
  rows.push({ kind: "section", label: "LIABILITIES AND EQUITY", depth: 0 });

  rows.push({ kind: "section", label: "Liabilities", depth: 0 });
  rows.push(...l.rows);
  rows.push({ kind: "total", label: "Total Liabilities", depth: 0, cents: l.cents, bold: true });

  rows.push({ kind: "section", label: "Equity", depth: 0 });
  rows.push(...e.rows);
  rows.push({ kind: "account", label: "Net Income", depth: 1, cents: currentEarnings });
  const totalEquity = e.cents + currentEarnings;
  rows.push({ kind: "total", label: "Total Equity", depth: 0, cents: totalEquity, bold: true });

  const totalLiabEquity = l.cents + totalEquity;
  rows.push({
    kind: "grandtotal",
    label: "Total Liabilities and Equity",
    depth: 0,
    cents: totalLiabEquity,
    bold: true,
  });

  return {
    rows,
    totalAssets,
    totalLiabEquity,
    balances: Math.round(totalAssets) === Math.round(totalLiabEquity),
  };
}
