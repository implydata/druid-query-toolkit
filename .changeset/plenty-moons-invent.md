---
'druid-query-toolkit': minor
---

Add `SqlQueryBase`, a common base for every query form

`SqlQuery`, `SqlWithQuery`, `SqlValues` and `SqlTableQuery` now share an
abstract `SqlQueryBase` that holds everything a query statement can wrap around
its body: `SET` context statements, `EXPLAIN PLAN FOR`, `INSERT INTO` /
`REPLACE INTO`, `ORDER BY`, `LIMIT`, `OFFSET`, `PARTITIONED BY`, `CLUSTERED BY`
and `UNION ALL`. Previously 32 of `SqlWithQuery`'s 38 members were verbatim
copies of `SqlQuery`'s.

The grammar was extended to match, so these now parse:

- `INSERT INTO t (a, b) VALUES (1, 2), (3, 4) PARTITIONED BY ALL`
- `EXPLAIN PLAN FOR TABLE foo`
- `TABLE foo LIMIT 10`
- `VALUES (1) UNION ALL VALUES (2)`
- `SET x = 1; INSERT INTO t VALUES (1) PARTITIONED BY ALL`
- `WITH t AS (VALUES (1), (2)) SELECT * FROM t` (previously threw)

Fixes:

- `INSERT INTO t (a, b) ...` parsed the column list as function arguments,
  producing a `SqlFunction` target instead of a `SqlTable` plus columns.
- `INSERT INTO ... AS CSV` overwrote the whole keywords object, destroying the
  `INSERT`/`INTO` casing.
- `SqlInsertClause.valueOf()` dropped `format`, so changing the clause lost the
  `AS CSV`.
- `SqlWithQuery.changeInsertIntoTable(undefined)` left stale spacing behind.
- `SqlWithQuery.changeOrderByExpressions([])` rendered a dangling `ORDER BY`.
- `SqlAlias.create` only parenthesized `SqlQuery`, not the other query forms.

Breaking: `SqlQuery#unionQuery`, `SqlWithQuery#query` and `SqlWithPart#query`
are now typed `SqlQueryBase`. Narrow with `instanceof SqlQuery` where a
`SqlQuery`-only member is needed.
