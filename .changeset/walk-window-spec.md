---
'druid-query-toolkit': patch
---

Walk into a function's window spec (`OVER (...)`), and add `SqlFunction#changeWindowSpec`. `getUsedColumnNames`, `fillPlaceholders` and other walks now see the expressions inside `OVER (...)`
