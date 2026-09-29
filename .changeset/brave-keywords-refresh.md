---
'druid-query-toolkit': minor
---

Refresh reserved keywords from the latest Druid (adds `ASOF`, `QUALIFY`, `SAFE_CAST`, `TRY_CAST`, `UUID`, `DATETIME`, weekday names, and others, which are now quoted when used as identifiers) and drop the unused `tslib` runtime dependency
