"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getAccounts,
  previewImport,
  commitImport,
  type ImportPreviewRowDTO,
} from "./actions";

function money(display: string): string {
  const neg = display.startsWith("-");
  const [intPart, dec] = display.replace("-", "").split(".");
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return (neg ? "-$" : "$") + withCommas + "." + dec;
}

const PLACEHOLDER =
  "Date\tPayee\tDescription\tAmount\tAccount\tOffset\n2026-01-05\tClient A\tInvoice payment\t1500\tAssets:Bank:Checking\tIncome:Sales";

export default function ImportView({
  entityId,
  onChange,
}: {
  entityId: string;
  onChange?: () => void;
}) {
  const [accounts, setAccounts] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [account, setAccount] = useState("");
  const [offset, setOffset] = useState("");
  const [rows, setRows] = useState<ImportPreviewRowDTO[]>([]);
  const [previewed, setPreviewed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const accs = await getAccounts(entityId);
      setAccounts(accs);
      setAccount((a) => a || accs.find((x) => x.startsWith("Assets")) || accs[0] || "");
      setOffset(
        (o) =>
          o ||
          accs.find((x) => x === "Expenses:Uncategorized") ||
          accs.find((x) => x.startsWith("Expenses")) ||
          accs[0] ||
          ""
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId]);

  function doPreview() {
    setError(null);
    setOkMsg(null);
    startTransition(async () => {
      const res = await previewImport(text, { account, offset });
      setRows(res.rows);
      setPreviewed(true);
      if (res.count === 0) setError("No valid rows found. Check the date and amount columns.");
    });
  }

  function doCommit() {
    setError(null);
    setOkMsg(null);
    startTransition(async () => {
      const res = await commitImport(entityId, text, { account, offset });
      if (!res.ok) {
        setError(res.error || "Import failed");
        return;
      }
      setOkMsg(`Imported ${res.added} transaction(s).`);
      setText("");
      setRows([]);
      setPreviewed(false);
      onChange?.();
    });
  }

  return (
    <div className="grid">
      <div className="panel span-12">
        <h2>Paste transactions from Excel</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Paste tab-separated (Excel copy) or CSV rows. Headers like Date, Payee,
          Description, Amount, Account, Offset are detected automatically; without
          headers, columns are read in that order. Rows missing a date or amount
          are skipped. Each row becomes a balanced transaction, validated by the
          engine before anything is saved.
        </p>
        {error ? <div className="notice">{error}</div> : null}
        {okMsg ? (
          <div className="notice" style={{ borderColor: "var(--accent)", background: "#e7f1ec", color: "#1c4d3e" }}>
            {okMsg}
          </div>
        ) : null}
        <textarea
          style={{
            width: "100%",
            minHeight: 150,
            border: "1px solid var(--line)",
            borderRadius: 6,
            padding: 10,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
            fontSize: 13,
            lineHeight: 1.5,
          }}
          placeholder={PLACEHOLDER}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setPreviewed(false);
          }}
        />
        <div className="form-grid" style={{ marginTop: 10 }}>
          <label className="wide">
            Default account
            <select value={account} onChange={(e) => setAccount(e.target.value)}>
              {accounts.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
          <label className="wide">
            Default offset
            <select value={offset} onChange={(e) => setOffset(e.target.value)}>
              {accounts.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
          <label className="wide">
            <button className="primary" onClick={doPreview} disabled={pending || !text.trim()}>
              {pending ? "Working…" : "Preview import"}
            </button>
          </label>
        </div>
      </div>

      <div className="panel span-12">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>Import preview</h2>
          {previewed ? <span className="pill">{rows.length} row(s)</span> : null}
        </div>
        <table style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Payee</th>
              <th>Description</th>
              <th>Account</th>
              <th className="amount">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="muted" colSpan={5}>
                  {previewed ? "No rows" : "Paste data and click Preview"}
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={i}>
                  <td>{r.date}</td>
                  <td>{r.payee}</td>
                  <td>{r.narration}</td>
                  <td>
                    {r.account}
                    <br />
                    <span className="muted">{r.offset}</span>
                  </td>
                  <td className="amount">{money(r.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <button
          className="primary"
          style={{ marginTop: 12 }}
          onClick={doCommit}
          disabled={pending || !previewed || rows.length === 0}
        >
          {pending ? "Importing…" : "Add previewed rows"}
        </button>
      </div>
    </div>
  );
}
