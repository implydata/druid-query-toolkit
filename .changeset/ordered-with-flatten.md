---
'druid-query-toolkit': patch
---

Make `SqlWithQuery.flattenWith` leave the query alone when the outer ORDER BY would change which rows an inner LIMIT or OFFSET keeps
