"use client";

import { useEffect, useState, useTransition } from "react";
import { getLedgerText } from "./actions";

export default function ExportView({ entityId }: { entityId: string }) {
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      setText((await getLedgerText(entityId)) || "");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId]);

  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  // Download via a base64 data URL (no blob URLs / object URLs).
  const dataUrl =
    "data:text/plain;charset=utf-8;base64," +
    (typeof window !== "undefined" ? btoa(unescape(encodeURIComponent(text))) : "");

  return (
    <div className="grid">
      <div className="panel span-12">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Beancount export</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="primary" onClick={copy} disabled={pending || !text}>
              {copied ? "Copied ✓" : "Copy"}
            </button>
            <a href={dataUrl} download={entityId + ".beancount"}>
              <button disabled={pending || !text}>Download</button>
            </a>
          </div>
        </div>
        <p className="muted" style={{ marginTop: 0 }}>
          This is your ledger&apos;s source of truth — plain-text Beancount you
          fully own. It opens in Fava, bean-query, or any text editor.
        </p>
        <pre
          style={{
            maxHeight: 520,
            overflow: "auto",
            border: "1px solid var(--line)",
            borderRadius: 8,
            background: "#10130f",
            color: "#f4f1df",
            padding: 14,
            fontSize: 12,
            lineHeight: 1.55,
            whiteSpace: "pre",
          }}
        >
          {pending ? "Loading…" : text}
        </pre>
      </div>
    </div>
  );
}
