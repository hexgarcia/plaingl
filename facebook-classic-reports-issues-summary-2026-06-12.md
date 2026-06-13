# Facebook Thread Issue Summary - Classic Reports Removal

Source transcript: `facebook-thread-capture-2026-06-12.txt`
Captured: 2026-06-12 19:48:53 EDT

Ranking is based on visible comment frequency, visible reaction counts, and workflow severity. Reaction counts are only those visible in the captured popup, so treat them as directional rather than complete.

## Executive takeaway

The dominant message from the thread is: do not remove Classic Reports yet. Users report that Modern Reports still has blocking gaps in refresh behavior, drill-down, layout readability, custom report parity, report accuracy, and report-specific workflows. The strongest practical recommendation is to keep Classic Reports available until the highest-frequency Modern Reports issues below are fixed and validated.

## Priority 1 - Reports show stale or incorrect data after edits, date changes, or refresh

Why this ranks high:
- Approx. 9 related comments
- Approx. 42 visible reactions
- Multiple users describe this as core trust failure: reports show old data, refresh does not work, or custom dates do not reload correctly.

Representative comments:
- Juan Cruz Troncoso: changing an underlying transaction and then changing report parameters brings old data back. Visible reactions: 15.
- Juli Bessire Sullivan: auto refresh after changes was promised but not showing in client reports. Visible reactions: 11.
- Rose Koppy: cached/old data, no refresh, and period comparison limitations. Visible reactions: 7.
- Debbie Allamong: custom date reports do not reload even after browser/report refresh. Visible reactions: 3.
- Donna Blaes: report refresh button reverts to the original report instead of the modified report. Visible reactions: 2.
- Desiree Finkelstein and Lynn Mayer Foss also reported refresh still failing after drill-down/save flows or with one tab open.

Impact:
- Users cannot trust report output.
- Users must refresh repeatedly, switch periods, or export/recreate work manually.
- This should be treated as a release blocker before Classic Reports removal.

## Priority 2 - Report layout/readability problems: frozen columns, horizontal scrolling, wrapped amounts, cut-off columns

Why this ranks high:
- Approx. 9 related comments
- Approx. 34 visible reactions
- Users repeatedly describe reports as hard to read or requiring manual column removal/resizing.

Representative comments:
- Libby Fleck: account names on the left do not stay frozen when scrolling horizontally. Visible reactions: 12.
- Tina Nail: account names should remain visible without removing columns. Visible reactions: 9.
- Amity Lynn: account names and amounts wrap onto two lines, making reports hard to read. Visible reactions: 7.
- John McVay: too many columns/horizontal scrolling makes it impossible to see first and last columns together. Visible reactions: 4.
- Jennifer Pata: amount and balance columns are often cut off and must be expanded manually. Visible reactions: 1.

Impact:
- Heavy daily usability cost across many report types.
- Causes manual cleanup and makes reports less client-ready.
- Sticky/frozen first columns and stable column widths appear to be high-value fixes.

## Priority 3 - Drill-down workflows are broken, inconsistent, or changed in ways that block analysis

Why this ranks high:
- Approx. 10 related comments
- Approx. 9 visible reactions
- Even with lower visible reactions than layout, frequency and workflow severity are high.

Representative comments:
- Jennifer Causey Johnson: P&L by class would not allow drill-down into numbers; classic worked fine.
- Elisabeth Lovas: cannot drill down on balance sheet accounts.
- Wanda Akins Jenkins: drilled into income account and had no export option; had trouble getting transaction reports to populate. Visible reactions: 3.
- Penelope Anton Dunn: after drilling into a report and going back, the date range changes. Visible reactions: 3.
- Donna Blaes: drilling into net income changed detail totals, showing totals at top and bottom, confusing clients.
- Rebecca Oh: some modern reports were not allowing drill-down; drill-down cannot be lost.
- Stephani Batten Long: drilling down is one of the main issues.

Impact:
- Breaks investigation workflows.
- Forces users back to Classic Reports.
- Should be validated across P&L, balance sheet, income account detail, class reports, and drill-down/back navigation.

## Priority 4 - Custom reports and Classic report parity are missing or unreliable

Why this ranks high:
- Approx. 9 related comments
- Approx. 16 visible reactions, plus repeated high-severity comments with no visible reaction count
- Users describe saved/custom reports as broken, missing, or not preserving customizations.

Representative comments:
- Penny Lane Wheeler Crull: custom summary report is no longer available and was the only reasonable way to track balances by customer in balance sheet accounts with thousands of transactions.
- Penny Lane Wheeler Crull: needs balances by customer, dropping off when balance is zero, for CIP, customer deposits, and retainage.
- Tina Nail: saved custom reports should retain the custom part. Visible reactions: 9.
- Mary Schumacher: do not change reports that are already memorized. Visible reactions: 6.
- Julie Schmedding: has 5-30 classic custom reports saved, almost all not running properly in modern.
- Stephani Batten Long: can no longer total by customer/group in some reports.
- Tonya Schulte: cannot reproduce a classic register report showing multiple distribution accounts.
- Rania Bishara: General Ledger customize area lacks an “all expenses and income” option and scrolling jumps. Visible reactions: 1.
- Amanda Jurmu: class/non-zero filtering in new reporting breaks balance sheet cleanup for real estate investor clients.

Impact:
- Users lose established workflows and saved reporting assets.
- This is a migration/parity issue, not just a UI bug.
- Custom summary reports and memorized report preservation deserve special attention.

## Priority 5 - Report headers/titles/company/project names missing or wrong

Why this ranks high:
- Approx. 5 related comments
- Approx. 7 visible reactions
- Multiple report types produce missing project/report/company labels, making reports unusable for clients.

Representative comments:
- Lisa Chrest: Project Profitability report no longer shows the project name. Visible reactions: 3, plus follow-up with workflow and screenshot context. Additional visible reactions: 2.
- Joana Bartlett Burke: company name/report title did not populate on P&L by month and balance sheets. Visible reactions: 2.
- Elizabeth Cates: P&L for individual properties/classes has no title on the report.

Impact:
- Client-facing reports lose context.
- Users must manually edit/export or switch to classic.

## Priority 6 - Data accuracy, totals, grouping, and report math concerns

Why this ranks high:
- Approx. 5 related comments
- Approx. 11 visible reactions
- These comments challenge whether report outputs are mathematically correct.

Representative comments:
- Diane Letulier: inventory valuation summary vs detail should match; users should not get negative quantity close-period errors when quantities are not negative; modern P&L revenue is usually wrong compared with classic. Visible reactions: 5.
- RK L'Heureaux: modern report randomly shows no data while classic shows expected data. Visible reactions: 6.
- Rebeccah Johnson: grouped sums need to add up correctly.
- Jean Clappe-Mixell: budget vs actual parent accounts show zeros that were not entered.

Impact:
- Highest severity category when reproducible because it undermines accounting correctness.
- Needs targeted QA with customer examples.

## Priority 7 - Sorting, YTD loading, date fields, and smaller but concrete workflow bugs

Why this ranks lower:
- Fewer comments, but each is concrete and likely testable.

Issues:
- Christin Piccirilli: sorting by transaction date, grouped by transaction date, does not order dates correctly. Visible reactions: 1.
- Katelynn Martin: reports would not load YTD; only annual or one month.
- Tonya Schulte: second date field triggers password manager behavior in Modern Reports but not Classic. Visible reactions: 2.
- RK L'Heureaux and Susan Landrum: inserted word “for” in line descriptions creates unprofessional report text. Combined visible reactions: 7.
- Christine Boat Knowlton: wants ability to rename custom reports from the report list. Visible reactions: 2.

## Meta-priority - Keep Classic Reports available until Modern Reports is ready

Why this matters:
- Preston Anderson’s “Keep classic” comment had the highest single visible reaction count: 20.
- Rose Koppy explicitly said this feedback shows there is no way to fix everything in one weekend and Classic Reports need to stay for now; Hector Garcia replied, “I agree.”
- Many users said they had to switch back to Classic Reports to finish normal work.

Recommended message to Intuit:
Modern Reports should not replace Classic Reports until the top four categories are resolved: refresh/data trust, layout readability, drill-down reliability, and custom report parity. These are not edge cases; they represent core accountant/bookkeeper workflows.
