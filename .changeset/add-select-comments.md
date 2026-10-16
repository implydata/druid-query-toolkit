---
'druid-query-toolkit': patch
---

`addSelect` (and any insert into a list) no longer repeats a comment for every added item: a comment on the same line as the last select expression stays with it, and a comment on its own line stays at the end of the list, as in 1.2
