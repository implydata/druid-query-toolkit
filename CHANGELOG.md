# druid-query-toolkit

## 1.8.1

### Patch Changes

- 7001c93: Fix `SqlPipesQuery` operator inserts throwing when the query was created from a plain array of operators

## 1.8.0

### Minor Changes

- 464269c: Parse the infix cast (`x::BIGINT`, `v:a::BIGINT`) as the new `SqlInfixCast`, build it with `ex.infixCast(type)`, and turn it into the `CAST` or `JSON_VALUE ... RETURNING` call it is sugar for with `toFunction()`. Output names follow Druid: `x::BIGINT` is named "x" and `v:a.b` is named "b", unless the select list has a `*` or another column of that name. The contains and regexp filter patterns also recognize `x::VARCHAR`. Types in `CAST` and `::` can be interval types (`INTERVAL DAY`, `INTERVAL DAY TO SECOND`), have a precision (`DECIMAL(5, 1)`) or be `DOUBLE PRECISION`
- 276752f: Support the rest of Druid's pipe syntax: the `|> UNION [ALL | DISTINCT] (...)`, `|> JOIN`, `|> AS`, `|> DISTINCT` and `|> RENAME` operators (`SqlUnionPipeOperator`, `SqlJoinPipeOperator`, `SqlAsPipeOperator`, `SqlDistinctPipeOperator`, `SqlRenamePipeOperator`), `|> SELECT DISTINCT` / `ALL`, order suffixes on the items of `|> AGGREGATE` (`COUNT(*) AS c DESC GROUP BY a ASC NULLS LAST`, where `ASC` / `DESC` used to be read as an alias), `WITH ... FROM` (and `WITH ... TABLE` / `VALUES`), and queries in parentheses followed by more of the statement (`(FROM t) UNION ALL (FROM u) |> ...`, the new `SqlParensQuery`). `unpipe()` converts all of them. `SqlFromQuery` now holds a whole FROM clause, so it takes aliases, joins, comma separated tables and sub-queries: its `table` and table methods (`getTableName`, `changeTable`, ...) are replaced by `fromClause` and FROM clause methods (`getFromExpressions`, `changeFromExpressions`, `getJoins`, `addJoin`, ...). `SqlOrderByExpression` is now an `SqlExpression`. Pipe operators after a `UNION ALL` now apply to the whole union rather than its last query, and a `WITH` in front of the starting query takes in the operators too (the new `SqlPipesQuery.withClause`), so they can use its tables; `unpipe()` keeps that scoping. A `UNION ALL` after pipe operators (`FROM t |> WHERE x UNION ALL FROM u`) no longer parses.

## 1.7.0

### Minor Changes

- e3e1ed0: `QueryResult.sqlQuery` and `attachQuery` take any query (`SqlQueryBase`), and `QueryRunner` attaches pipe, `TABLE`, `VALUES` and other queries, not only `SELECT`. The questions about a query's output columns, filters and grouping (`getSelectExpressionForIndex`, `getOutputColumns`, `isAggregateOutputColumn`, `getEffectiveWhereExpression`, `hasGroupBy`, `getOrderByForOutputColumn`, ...) move from `SqlQuery` to `SqlQueryBase`, as do `getSelectExpressionOutput` and `isPhonyOutputName`, and there is a new `SqlQueryBase.parse` / `maybeParse` for any query. Code that changes `result.sqlQuery` (`addWhere`, `changeSelect`, ...) needs to narrow it with `instanceof SqlQuery` first

## 1.6.1

### Patch Changes

- e64f705: `addSelect` (and any insert into a list) no longer repeats a comment for every added item: a comment on the same line as the last select expression stays with it, and a comment on its own line stays at the end of the list, as in 1.2
- e64f705: `changeSelectExpressions` given a plain array keeps the query's separators, so the list keeps its indentation inside a nested query
- e64f705: Classes keep their names in the bundle, so `Column.name` is `'Column'` rather than `'_Column'` (also `SqlQuery`, `QueryResult` and the rest)
- e64f705: A query followed by `;` and more text fails after the `;` again (`Expected end of input or possible semicolon`), as in 1.2, instead of at the `;` with a long list of expected tokens

## 1.6.0

### Minor Changes

- 9e5c418: Parse colon access (`v:a.b`, `v:['field name']`, `v:[0]`) as the new `SqlColonAccess`, build it with `ex.access(...path)`, and turn it into the `JSON_VALUE` call it is sugar for with `toJsonValue()`. A short `JSON_OBJECT` key can no longer be an unparenthesized arithmetic or comparison expression

## 1.5.0

### Minor Changes

- 6e17528: Support `NULLS FIRST` / `NULLS LAST` in `ORDER BY` (`SqlOrderByExpression#nulls`, `changeNulls`)
- 6e17528: Allow aliases on the `GROUP BY` items of a `|> AGGREGATE` pipe operator (`GROUP BY UPPER(item) AS i`)
- 6e17528: Parse `*` (and `t.*`) as an argument to any function, not just `COUNT`

## 1.4.1

### Patch Changes

- 4c04eff: Make the browser bundle UMD and point `unpkg`/`jsdelivr` at it, so `require('druid-query-toolkit')` works on ObservableHQ

## 1.4.0

### Minor Changes

- 79810da: Support pipe SQL syntax: `FROM <table>` queries (`SqlFromQuery`) and pipe queries (`SqlPipesQuery`) with the `SELECT`, `WHERE`, `AGGREGATE`, `ORDER BY`, `LIMIT`, `EXTEND`, `SET` and `DROP` pipe operators, and `SqlPipesQuery#unpipe` to convert a pipe query into a query without pipes

## 1.3.2

### Patch Changes

- e2be7a7: Keep the `resultContext` for a topN result with no rows
- a77034e: Fix several filter pattern bugs: number range and time interval patterns now keep `negated` in every form, number range no longer fits an OR as a range and reads strict bounds correctly when the literal comes first, and time interval no longer fits an upper bound as the start
- e2be7a7: Preserve the casing of `AND` / `OR` in `prettify({ keywordCasing: 'preserve' })`
- e2be7a7: Make `SqlComparison.getSpecialLikeType` respect `ESCAPE` and not report patterns with a wildcard in the middle
- a77034e: Fix `QueryRunner` sending `typesHeader: true` / `sqlTypesHeader: true` when they were set to `false` and `header` was unset
- e2be7a7: Make `SqlWithQuery.flattenWith` leave the query alone when the outer ORDER BY would change which rows an inner LIMIT or OFFSET keeps
- a77034e: Fix `SqlComparison.negate` on a parsed `= ANY (...)` / `= ALL (...)` comparison, which kept the original ALL/ANY keyword instead of flipping it
- e2be7a7: Fix `SqlWindowSpec` spacing when adding or removing clauses, and print `()` for a window spec built without parsing
- e2be7a7: Make `SqlQueryBase.changeExplain(false)` return the same instance for a query that is not an EXPLAIN
- a77034e: Fix `SqlWithQuery.flattenWith` ignoring that an outer OFFSET reduces an inner LIMIT

## 1.3.1

### Patch Changes

- 26b0510: Fix `SqlQuery.removeOrderByForSelectIndex` and `removeOrderByForOutputColumn`, which kept only the matching ORDER BY expressions instead of removing them

## 1.3.0

### Minor Changes

- 9501635: Refresh reserved keywords from the latest Druid (adds `ASOF`, `QUALIFY`, `SAFE_CAST`, `TRY_CAST`, `UUID`, `DATETIME`, weekday names, and others, which are now quoted when used as identifiers) and drop the unused `tslib` runtime dependency
- be67386: Add `SqlQueryBase`, a common base for every query form

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

- c291023: Add SqlTableQuery to support the `TABLE <table_reference>` query form

### Patch Changes

- c291023: Fix the `SqlTable` parser rule silently dropping the namespace, so `INSERT INTO ns.tbl` and `REPLACE INTO ns.tbl` now round trip

## 1.2.2

### Patch Changes

- e780b81: inflateDatesForIndexes can deal with bigint

## 1.2.1

### Patch Changes

- 9a4ff78: Bump node to 20.19.5
- 13d4a6d: Add npm trusted publishing support for automated releases via OIDC

## 1.2.0

### Minor Changes

- b94b2c1: - Switch to AbortSignal in query executor
  - Use a single object parameter in query executor

## 1.1.5

### Patch Changes

- d6e628c: Fixed spacing when removing SET statements

## 1.1.4

### Patch Changes

- d3f9a75: Fix rouge new line being added when there is no context

## 1.1.3

### Patch Changes

- a7e1b22: Add flatten method and extend filterAnd for nested expressions

## 1.1.2

### Patch Changes

- 77ba601: Fixing arguments of SqlFunction.timeShift

## 1.1.1

### Patch Changes

- 76d8d4d: Propogate context in case of an alias also

## 1.1.0

### Minor Changes

- 30dec4b: Allow parsing SET statements in an otherwise unparsable string and more integrations"

## 1.0.4

### Patch Changes

- 6e40a00: Added support for SET syntax"

## 1.0.3

### Patch Changes

- 6d71e89: Add `changeDecorator` method to SqlQuery

## 1.0.2

### Patch Changes

- e68c6a9: Do not unwrap AND in parens when not flattening

## 1.0.1

### Patch Changes

- 740a5f6: More filter patterns supported

## 1.0.0

### Major Changes

- 6704028: Promote to version 1.0.0

  Changes since 0.19.1:

  - Time relative pattern filter now accepts an origin and correctly handles timezones
  - Added docs and cleaned up names
  - Fixed handling of null values in values filter patterns
  - Added licenses
  - Added author to pachage.json
  - Added aggregator to segment metadata decoding
  - Fix package.json main/module/types fields
  - Make @druid-toolkit/query CJS only again
  - Improve indentation in formatting
  - Fix default spaces around EXTEND
  - Added support for IS NOT DISTINCT FROM
  - Mark spacing and keywords as readonly
  - Allow join clause to accept join conditions with either USING or ON syntax
  - Add support for array types
  - Added isArray and parsing
  - Fix type-o in the word double
  - Expanded addSelect
  - Better group by column detection
  - Switch to peggy+ts-pegjs to generate parser
  - fix location of UNION ALL in query stringification
  - Added `alwaysUseCurrentTimestamp` to WhereTimeClauseEditor and `inlineMaxDataTime` to SqlQuery
  - Don't try to convert nulls into dates
  - Rolled back prettier
  - better parsing of groupby clause
  - Allow anchor timestamp as part of a relative pattern
  - allow anchorTimestamp in filter pattern
  - Added startBound and endBound to time-relative filter patterns
  - Make it so that ROW does not show up in IN
  - support for flipped time ranges
  - Allow parsing of INSERT INTO EXTERN
  - Allow addWhere and addHaving to be called empty
  - Fixed issue with get by lobel
  - Parsing for JSON_VALUE(... RETURNING ...)
  - Parse PARTITION BY in window functions
  - Added setAlias route method
  - Better error message for truncated results
  - Make addWhere not change WHERE to TRUE
  - Add support for NATURAL keyword
  - Parse RANGE/ROWS in window functions
  - COUNT(\*) could have a window also
  - Added defaultQueryContext
  - Fix first table finder
  - Handle Infinity in changeLimitValue
