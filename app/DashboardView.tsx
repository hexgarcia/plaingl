"use client";

import { useEffect, useState, useTransition } from "react";
import { getDashboard, type DashboardDTO } from "./actions";

function money(display: string): string {
  // display is a plain 2-decimal string like "-1250.00"; add $ and thousands.
  const neg = display.startsWith("-");
  const [intPart, dec] = display.replace("-", "").split(".");
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return (neg ? "-$" : "$") + withCommas + "." + dec;
}

/** Width (%) of a bar relative to the larger of two values. */
function barPct(value: string, peer: string): number {
  const v = Math.abs(parseFloat(value) || 0);
  const p = Math.abs(parseFloat(peer) || 0);
  const max = Math.max(v, p);
  return max === 0 ? 0 : Math.round((v / max) * 100);
}

export default function DashboardView({ entityId }: { entityId: string }) {
  const [data, setData] = useState<DashboardDTO | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      setData(await getDashboard(entityId));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId]);

  const year = data ? data.ytdFrom.slice(0, 4) : "";

  return (
    <div className="grid">
      <div className="panel span-12">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ margin: 0 }}>Dashboard</h2>
            <div className="muted">
              {data
                ? `As of ${data.asOf} · P&L is year-to-date (${year})`
                : pending
                ? "Loading…"
                : "—"}
            </div>
          </div>
          {data ? (
            <span className={"pill " + (data.balances ? "good" : "bad")}>
              {data.balances ? "books balanced ✓" : "out of balance"}
            </span>
          ) : null}
        </div>

        {data?.errors?.length ? (
          <div className="notice" style={{ marginTop: 12 }}>
            {data.errors.length} ledger issue(s): {data.errors[0].message}
            {data.errors.length > 1 ? " (+ more)" : ""}
          </div>
        ) : null}

        <div className="metric-row" style={{ marginTop: 14 }}>
          <div className="metric">
            <span>Cash on hand</span>
            <strong>{data ? money(data.cash) : "—"}</strong>
          </div>
          <div className="metric">
            <span>A/R outstanding</span>
            <strong>{data ? money(data.arTotal) : "—"}</strong>
          </div>
          <div className="metric">
            <span>A/P outstanding</span>
            <strong>{data ? money(data.apTotal) : "—"}</strong>
          </div>
          <div className="metric">
            <span>Net income (YTD)</span>
            <strong>{data ? money(data.netIncomeYtd) : "—"}</strong>
          </div>
        </div>
      </div>

      {/* Income vs expenses (YTD) */}
      <div className="panel span-6">
        <h2>Income vs. expenses · {year}</h2>
        {data ? (
          <div className="dash-bars">
            <div className="dash-bar-row">
              <span className="dash-bar-label">Income</span>
              <div className="dash-bar-track">
                <div
                  className="dash-bar dash-bar-income"
                  style={{ width: barPct(data.revenueYtd, data.expensesYtd) + "%" }}
                />
              </div>
              <span className="amount dash-bar-value">{money(data.revenueYtd)}</span>
            </div>
            <div className="dash-bar-row">
              <span className="dash-bar-label">Expenses</span>
              <div className="dash-bar-track">
                <div
                  className="dash-bar dash-bar-expense"
                  style={{ width: barPct(data.expensesYtd, data.revenueYtd) + "%" }}
                />
              </div>
              <span className="amount dash-bar-value">{money(data.expensesYtd)}</span>
            </div>
            <div className="dash-bar-row dash-bar-net">
              <span className="dash-bar-label">Net</span>
              <div className="dash-bar-track" />
              <span className="amount dash-bar-value">
                <strong>{money(data.netIncomeYtd)}</strong>
              </span>
            </div>
          </div>
        ) : (
          <p className="muted">{pending ? "Loading…" : "No data"}</p>
        )}
      </div>

      {/* What needs attention */}
      <div className="panel span-6">
        <h2>Needs attention</h2>
        <table>
          <tbody>
            <tr>
              <td>Overdue receivables</td>
              <td className="amount">{data ? money(data.arOverdue) : "—"}</td>
            </tr>
            <tr>
              <td>Overdue payables</td>
              <td className="amount">{data ? money(data.apOverdue) : "—"}</td>
            </tr>
            <tr>
              <td>Accounts</td>
              <td className="amount">{data ? data.accountCount : "—"}</td>
            </tr>
            <tr>
              <td>Transactions</td>
              <td className="amount">{data ? data.txnCount.toLocaleString() : "—"}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Top customers (YTD) */}
      <div className="panel span-6">
        <h2>Top customers · {year}</h2>
        <table>
          <thead>
            <tr>
              <th>Customer / payee</th>
              <th className="amount">Income</th>
            </tr>
          </thead>
          <tbody>
            {!data || data.topCustomers.length === 0 ? (
              <tr>
                <td className="muted" colSpan={2}>
                  {pending ? "Loading…" : "No income yet this year"}
                </td>
              </tr>
            ) : (
              data.topCustomers.map((r) => (
                <tr key={r.payee}>
                  <td>{r.payee}</td>
                  <td className="amount">{money(r.display)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Recent activity */}
      <div className="panel span-6">
        <h2>Recent activity</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Payee / memo</th>
              <th className="amount">Amount</th>
            </tr>
          </thead>
          <tbody>
            {!data || data.recent.length === 0 ? (
              <tr>
                <td className="muted" colSpan={3}>
                  {pending ? "Loading…" : "No transactions yet"}
                </td>
              </tr>
            ) : (
              data.recent.map((t, i) => {
                // Show the largest-magnitude posting amount as the headline figure.
                const top = t.postings
                  .slice()
                  .sort(
                    (a, b) =>
                      Math.abs(parseFloat(b.display)) - Math.abs(parseFloat(a.display))
                  )[0];
                return (
                  <tr key={i}>
                    <td className="muted" style={{ whiteSpace: "nowrap" }}>
                      {t.date}
                    </td>
                    <td>{t.payee || t.narration || "—"}</td>
                    <td className="amount">{top ? money(top.display) : ""}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
