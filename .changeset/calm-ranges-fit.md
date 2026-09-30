---
'druid-query-toolkit': patch
---

Fix several filter pattern bugs: number range and time interval patterns now keep `negated` in every form, number range no longer fits an OR as a range and reads strict bounds correctly when the literal comes first, and time interval no longer fits an upper bound as the start
