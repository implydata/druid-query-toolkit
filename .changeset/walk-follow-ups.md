---
'druid-query-toolkit': patch
---

Walks also visit the frame bounds of a window spec and column lists (`AS x (a, b)`, `INSERT INTO t (a, b)`, `WITH w (a, b)`, `USING (a, b)`), so `prettify()` now formats all of them, along with the separators of `PARTITION BY` and `EXTEND (...)`. A function with `FILTER (...)` or `OVER (...)` followed by `EXTEND (...)` prints its clauses in the order they were written, and no longer drops the `EXTEND`
