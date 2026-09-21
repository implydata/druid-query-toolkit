---
'druid-query-toolkit': patch
---

Fix the `SqlTable` parser rule silently dropping the namespace, so `INSERT INTO ns.tbl` and `REPLACE INTO ns.tbl` now round trip
