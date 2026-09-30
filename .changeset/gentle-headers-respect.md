---
'druid-query-toolkit': patch
---

Fix `QueryRunner` sending `typesHeader: true` / `sqlTypesHeader: true` when they were set to `false` and `header` was unset
