---
'druid-query-toolkit': patch
---

Fix `SqlQuery.removeOrderByForSelectIndex` and `removeOrderByForOutputColumn`, which kept only the matching ORDER BY expressions instead of removing them
