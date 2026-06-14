"use client";

import { useEffect, useState, useTransition } from "react";
import { getStatements, type StatementsDTO, type StatementRowDTO } from "./actions";

function money(display: string, negative: boolean, withDollar: boolean): string {
  if (display === "") return "";
  const [intPart, dec] = display.replace("-", "").split(".");
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const body = (withDollar ? "$" : "") + withCommas + "." + dec;
  return negative ? "-" + body : body;
}

function StatementTable({ rows, title }: { rows: StatementRowDTO[]; title: string }) {
  return (
    <table className="stmt">
      <thead>
        <tr>
          <th className="stmt-acct"></th>
          <th className="stmt-amt">Total</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => {
          if (r.kind === "spacer") {
            return (
              <tr key={i} className="stmt-spacer">
                <td colSpan={2}>&nbsp;</td>
              </tr>
            );
          }
          const cls = ["stmt-row", "k-" + r.kind].join(" ");
          // Totals & section headers get a $; plain account lines don't.
          const withDollar = r.kind === "subtotal" || r.kind === "total" || r.kind === "grandtotal";
          return (
            <tr key={i} className={cls}>
              <td
                className="stmt-acct"
                style={{ paddingLeft: 8 + r.depth * 16 }}
              >
                {r.label}
              </td>
              <td className={"stmt-amt amount" + (r.negative ? " neg" : "")}>
                {money(r.display, r.negative, withDollar)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default function StatementView({ entityId }: { entityId: string }) {
  const [which, setWhich] = useState<"pl" | "bs">("pl");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<StatementsDTO | null>(null);
  const [pending, startTransition] = useTransition();

  function load(f: string, t: string) {
    startTransition(async () => {
      setData(await getStatements(entityId, { from: f || undefined, to: t || undefined }));
    });
  }

  useEffect(() => {
    load(from, to);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId]);

  function applyPreset(f: string, t: string) {
    setFrom(f);
    setTo(t);
    load(f, t);
  }

  const title = which === "pl" ? "Profit and Loss" : "Balance Sheet";
  const periodText =
    which === "pl"
      ? data?.periodLabel
      : data
      ? "As of " + longDateClient(data.asOf)
      : "";

  return (
    <div className="stmt-wrap">
      {/* On-screen controls (hidden when printing) */}
      <div className="panel span-12 stmt-controls no-print">
        <div className="stmt-control-row">
          <div className="tabs">
            <button
              className={"tab" + (which === "pl" ? " active" : "")}
              onClick={() => setWhich("pl")}
            >
              Profit &amp; Loss
            </button>
            <button
              className={"tab" + (which === "bs" ? " active" : "")}
              onClick={() => setWhich("bs")}
            >
              Balance Sheet
            </button>
          </div>
          <button className="primary" onClick={() => window.print()} disabled={!data}>
            Print / Save PDF
          </button>
        </div>
        <div className="presets" style={{ marginTop: 12 }}>
          {presets().map((p) => (
            <button key={p.label} onClick={() => applyPreset(p.from, p.to)} disabled={pending}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="stmt-dates">
          <label>
            From
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label>
            To
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          <button className="primary" onClick={() => load(from, to)} disabled={pending}>
            {pending ? "…" : "Apply"}
          </button>
          <button onClick={() => applyPreset("", "")} disabled={pending}>
            Reset (YTD)
          </button>
        </div>
        {which === "bs" && data && !data.bsBalances ? (
          <div className="notice" style={{ marginTop: 10 }}>
            Balance sheet does not balance — check the ledger.
          </div>
        ) : null}
      </div>

      {/* The printable document */}
      <div className="stmt-doc">
        <div className="stmt-header">
          <div className="stmt-title">{title}</div>
          <div className="stmt-company">{data?.company ?? ""}</div>
          <div className="stmt-period">{periodText}</div>
        </div>

        {data ? (
          <StatementTable rows={which === "pl" ? data.pl : data.bs} title={title} />
        ) : (
          <p className="muted" style={{ padding: 16 }}>
            {pending ? "Loading…" : "No data"}
          </p>
        )}

        <div className="stmt-footer">
          {data ? data.generatedAt : ""}
        </div>
      </div>
    </div>
  );
}

function longDateClient(iso: string): string {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const [y, m, d] = iso.split("-").map(Number);
  return months[m - 1] + " " + d + ", " + y;
}

function presets(): { label: string; from: string; to: string }[] {
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const q = Math.floor(m / 3);
  const ym = (yy: number, mm: number, dd: number) => iso(new Date(Date.UTC(yy, mm, dd)));
  const monthEnd = (yy: number, mm: number) => ym(yy, mm + 1, 0);
  return [
    { label: "This month", from: ym(y, m, 1), to: monthEnd(y, m) },
    { label: "This quarter", from: ym(y, q * 3, 1), to: monthEnd(y, q * 3 + 2) },
    { label: "YTD", from: ym(y, 0, 1), to: iso(now) },
    { label: "This year", from: ym(y, 0, 1), to: ym(y, 11, 31) },
    { label: "Last year", from: ym(y - 1, 0, 1), to: ym(y - 1, 11, 31) },
  ];
}
