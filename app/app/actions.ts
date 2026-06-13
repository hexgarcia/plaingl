"use server";

// Server actions for the React app. These are the seam between the React UI
// and the server-side ledger store + Beancount engine. The client never
// parses Beancount or touches the filesystem; it calls these.

import {
  listEntities as storeList,
  loadEntity,
  saveEntity,
  createEntity,
} from "@/lib/store/fs";
import {
  parse,
  incomeStatement,
  balanceSheet,
  aging,
  totals,
  fromCents,
  type ReportLine,
  type AgingRow,
} from "@/lib/beancount";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface EntitySummary {
  id: string;
  name: string;
}

export async function listEntities(): Promise<EntitySummary[]> {
  return storeList();
}

export async function getLedgerText(id: string): Promise<string | null> {
  const e = await loadEntity(id);
  return e ? e.beancount : null;
}

export async function saveLedgerText(id: string, beancount: string): Promise<void> {
  await saveEntity(id, beancount);
}

export async function addEntity(name: string): Promise<EntitySummary> {
  const id =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "entity-" + Date.now();
  const e = await createEntity(id, name);
  return { id: e.id, name: e.name };
}

// ---- report DTOs ----------------------------------------------------------

export interface ReportLineDTO {
  account: string;
  display: string;
  cents: number;
}
export interface AgingRowDTO {
  party: string;
  current: string;
  d1_30: string;
  d31_60: string;
  d61_90: string;
  d90_plus: string;
  total: string;
}
export interface ReportsDTO {
  found: boolean;
  asOf: string;
  errors: { line: number; message: string }[];
  metrics: {
    assets: string;
    liabilities: string;
    revenue: string;
    netIncome: string;
  };
  income: ReportLineDTO[];
  expenses: ReportLineDTO[];
  netIncome: string;
  balanceSheet: {
    assets: ReportLineDTO[];
    liabilities: ReportLineDTO[];
    equity: ReportLineDTO[];
    currentEarnings: string;
    totalAssets: string;
    totalLiabEquity: string;
    balances: boolean;
  };
  arAging: { rows: AgingRowDTO[]; total: AgingRowDTO };
  apAging: { rows: AgingRowDTO[]; total: AgingRowDTO };
}

function lineDTO(l: ReportLine): ReportLineDTO {
  return { account: l.account, display: fromCents(l.cents), cents: l.cents };
}
function agingDTO(r: AgingRow): AgingRowDTO {
  return {
    party: r.party,
    current: fromCents(r.current),
    d1_30: fromCents(r.d1_30),
    d31_60: fromCents(r.d31_60),
    d61_90: fromCents(r.d61_90),
    d90_plus: fromCents(r.d90_plus),
    total: fromCents(r.total),
  };
}

export async function getReports(
  id: string,
  range: { from?: string; to?: string } = {}
): Promise<ReportsDTO | null> {
  const text = await getLedgerText(id);
  if (text == null) return null;

  const { ledger, errors } = parse(text);
  const asOf = range.to || today();
  const is = incomeStatement(ledger, range);
  const bs = balanceSheet(ledger, asOf);
  const t = totals(ledger, range);
  const ar = aging(ledger, "Assets:AccountsReceivable", asOf);
  const ap = aging(ledger, "Liabilities:AccountsPayable", asOf, { flip: true });

  return {
    found: true,
    asOf,
    errors,
    metrics: {
      assets: fromCents(totals(ledger, { to: asOf }).assets),
      liabilities: fromCents(totals(ledger, { to: asOf }).liabilities),
      revenue: fromCents(t.revenue),
      netIncome: fromCents(t.netIncome),
    },
    income: is.income.map(lineDTO),
    expenses: is.expenses.map(lineDTO),
    netIncome: fromCents(is.netIncome),
    balanceSheet: {
      assets: bs.assets.map(lineDTO),
      liabilities: bs.liabilities.map(lineDTO),
      equity: bs.equity.map(lineDTO),
      currentEarnings: fromCents(bs.currentEarnings),
      totalAssets: fromCents(bs.totalAssets),
      totalLiabEquity: fromCents(bs.totalLiabEquity),
      balances: bs.balances,
    },
    arAging: { rows: ar.rows.map(agingDTO), total: agingDTO(ar.total) },
    apAging: { rows: ap.rows.map(agingDTO), total: agingDTO(ap.total) },
  };
}
