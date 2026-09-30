---
'druid-query-toolkit': patch
---

Fix `SqlComparison.negate` on a parsed `= ANY (...)` / `= ALL (...)` comparison, which kept the original ALL/ANY keyword instead of flipping it
