# druid-query-toolkit

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
