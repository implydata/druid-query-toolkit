# 📜 Queries

`SqlQueryBase` is the base class of every query statement. It extends [`SqlExpression`](expressions.md), so a query can be used anywhere an expression can (as a sub-query, in `IN (...)`, in `FROM (...)`), and it has everything that is common to all the query forms.

## The query classes

| Class | Parses | Page |
| --- | --- | --- |
| `SqlQuery` | `SELECT ... FROM ... WHERE ... GROUP BY ... HAVING ...`, with an optional `WITH` | [SELECT queries](select-queries.md) |
| `SqlPipesQuery` | `FROM t \|> WHERE ... \|> AGGREGATE ...` | [Pipe syntax](pipe-syntax.md) |
| `SqlFromQuery` | `FROM t` on its own (the usual start of a pipe query) | [Pipe syntax](pipe-syntax.md) |
| `SqlTableQuery` | `TABLE t` | |
| `SqlValues` | `VALUES (1, 'a'), (2, 'b')` | |
| `SqlWithQuery` | `WITH ...` around a body that is not a plain `SELECT` | |

Around its own body, each of them can carry the same wrapper parts, and `SqlQueryBase` has the methods to read and change them:

```sql
SET key = value;             -- context statements
EXPLAIN PLAN FOR             -- explain
INSERT INTO t / REPLACE INTO t OVERWRITE ...
  <the body>
ORDER BY ...
LIMIT ...
OFFSET ...
PARTITIONED BY ...
CLUSTERED BY ...
UNION ALL <another query>
```

So code that only deals with these parts works on any query the user typed:

```js
import {
  C,
  SqlExpression,
  SqlLimitClause,
  SqlLiteral,
  SqlPartitionedByClause,
  SqlQuery,
  SqlQueryBase,
} from 'druid-query-toolkit';

function showLatestFirst(sql: string): string {
  const query = SqlExpression.parse(sql);
  if (!(query instanceof SqlQueryBase)) throw new Error('not a query');
  return String(query.changeOrderByExpression(C('__time').toOrderByExpression('DESC')).changeLimitValue(10));
}

showLatestFirst('TABLE wikipedia');
//=> TABLE wikipedia
//   ORDER BY "__time" DESC
//   LIMIT 10

showLatestFirst('FROM wikipedia |> WHERE isRobot = FALSE');
//=> FROM wikipedia |> WHERE isRobot = FALSE
//   |> ORDER BY "__time" DESC
//   |> LIMIT 10
```

For pipe queries, `ORDER BY`, `LIMIT` and `OFFSET` are expressed as trailing pipe operators instead of clauses, and the methods below take care of that.

## Context (SET statements)

Druid SQL can set query context parameters with `SET` statements at the top of the query. The query models them as a plain object:

```js
const query = SqlQuery.parse(`SELECT page, COUNT(*) AS cnt FROM wikipedia GROUP BY 1`);

const withContext = query.changeContext({ sqlTimeZone: 'Asia/Tokyo', useCache: false, maxNumTasks: 4 });
console.log(String(withContext));
```

```sql
SET sqlTimeZone = 'Asia/Tokyo';
SET useCache = FALSE;
SET maxNumTasks = 4;
SELECT page, COUNT(*) AS cnt FROM wikipedia GROUP BY 1
```

```js
withContext.hasContext(); //=> true
withContext.getContext(); //=> { sqlTimeZone: 'Asia/Tokyo', useCache: false, maxNumTasks: 4 }
withContext.changeContext({ ...withContext.getContext(), useCache: true }); // update one value
withContext.changeContext(undefined); // remove all SET statements ({} does the same)
```

`changeContextStatements(statements)` takes a list of `SqlSetStatement` nodes if you need exact control. For text that may not parse, see the [text based helpers](parsing.md#leading-set-statements).

## EXPLAIN PLAN FOR

```js
query.makeExplain(); // same as changeExplain(true)
query.makeExplain().explain; //=> true
query.makeExplain().changeExplain(false); // back to the plain query
```

The web console's "Explain SQL query" action is:

```js
const parsed = SqlQuery.parse(queryString);
const explainQuery = parsed.explain ? queryString : parsed.makeExplain().toString();
```

## INSERT and REPLACE

Ingestion queries write the result of a query into a table:

```js
const ingestion = query
  .changeReplaceIntoTable('wiki_rollup')
  .changePartitionedByClause(SqlPartitionedByClause.create(SqlLiteral.direct('DAY')))
  .changeClusteredByExpressions([C('page')]);
console.log(String(ingestion));
```

```sql
REPLACE INTO "wiki_rollup" OVERWRITE ALL
SELECT page, COUNT(*) AS cnt FROM wikipedia GROUP BY 1
PARTITIONED BY DAY
CLUSTERED BY "page"
```

- `changeInsertIntoTable(table)` / `getInsertIntoTable()` for `INSERT INTO`.
- `changeReplaceIntoTable(table)` / `getReplaceIntoTable()` for `REPLACE INTO ... OVERWRITE ALL`. Use `changeReplaceClause(SqlReplaceClause.create(table, where))` for `OVERWRITE WHERE ...`.
- `getIngestTable()` returns whichever of the two is set, so `Boolean(query.getIngestTable())` tells you whether a query is an ingestion.
- `changePartitionedByClause(clause)` sets `PARTITIONED BY`. `SqlPartitionedByClause.create(undefined)` gives `PARTITIONED BY ALL`.
- `changeClusteredByExpressions(expressions)` sets `CLUSTERED BY`, and `changeClusteredByClause(clause)` sets or removes the whole clause.

Passing `undefined` to any of the `change*` methods removes that part. That is how the web console previews an ingestion query as a plain `SELECT`:

```js
const preview = ingestion
  .changeInsertClause(undefined)
  .changeReplaceClause(undefined)
  .changePartitionedByClause(undefined)
  .changeClusteredByClause(undefined)
  .changeLimitValue(100);
//=> SELECT page, COUNT(*) AS cnt FROM wikipedia GROUP BY 1
//   LIMIT 100
```

## ORDER BY

```js
const query = SqlQuery.parse(`SELECT page, COUNT(*) AS cnt FROM wikipedia GROUP BY 1 ORDER BY cnt DESC`);

query.hasOrderBy(); //=> true
query.getOrderByExpressions(); //=> [cnt DESC]
query.getOrderByForExpression(C.optionalQuotes('cnt')); //=> cnt DESC

query.changeOrderByExpression(C('page').toOrderByExpression('ASC')); // replace with one
query.changeOrderByExpressions([C('page').toOrderByExpression(), C('cnt').toOrderByExpression('DESC')]);
query.addOrderBy(C('page').toOrderByExpression()); // add as the first (most significant) sort
query.changeOrderByExpression(undefined); // remove ORDER BY
```

Each item is a `SqlOrderByExpression` with an `expression` and an optional `direction`. `getEffectiveDirection()` returns the direction with the default (`'ASC'`) filled in, and `reverseDirection()` flips it. Sorting by a result column header, as in the web console, looks like this:

```js
const current = query.getOrderByForOutputColumn(header); // SqlQuery only, see the SELECT page
const next = current
  ? current.reverseDirection()
  : SqlLiteral.index(headerIndex).toOrderByExpression('DESC'); // ORDER BY <n> DESC
query.changeOrderByExpressions([next]);
```

`SqlQuery` has more column oriented ORDER BY helpers, see [SELECT queries](select-queries.md#order-by).

## LIMIT and OFFSET

```js
query.hasLimit();
query.getLimitValue(); //=> number or undefined
query.changeLimitValue(100); // add or change LIMIT
query.changeLimitValue(undefined); // remove LIMIT (Infinity does the same)
query.changeLimitValue(-1); // throws: -1 is not a valid limit value

query.hasOffset();
query.getOffsetValue();
query.changeOffsetValue(50);
```

A pagination helper:

```js
function getPage(query: SqlQueryBase, pageIndex: number, pageSize: number) {
  return query.changeLimitValue(pageSize).changeOffsetValue(pageIndex ? pageIndex * pageSize : undefined);
}

String(getPage(SqlQuery.parse('SELECT * FROM wikipedia ORDER BY __time DESC'), 2, 25));
//=> SELECT * FROM wikipedia ORDER BY __time DESC
//   LIMIT 25
//   OFFSET 50
```

When you need to apply an outer limit without ever raising the user's own limit, use `combineWithLimitClause`, which keeps the smaller of the two (and `combineWithOffsetClause`, which adds offsets):

```js
SqlQuery.parse('SELECT * FROM t LIMIT 100').combineWithLimitClause(SqlLimitClause.create(10)).getLimitValue(); //=> 10
SqlQuery.parse('SELECT * FROM t LIMIT 100').combineWithLimitClause(SqlLimitClause.create(1000)).getLimitValue(); //=> 100
```

The clause level methods (`getLimitClause`, `changeLimitClause`, `getOffsetClause`, `changeOffsetClause`, `getOrderByClause`, `changeOrderByClause`) are there when you need to move whole clauses between queries.

## UNION ALL

`unionQuery` holds the query after `UNION ALL`, and `changeUnionQuery(query)` sets or removes it:

```js
SqlQuery.parse('SELECT page FROM a').changeUnionQuery(SqlQuery.parse('SELECT page FROM b'));
//=> SELECT page FROM a
//   UNION ALL SELECT page FROM b
```

In a parsed `a UNION ALL b ORDER BY ... LIMIT ...`, the trailing `ORDER BY` and `LIMIT` belong to the last query in the chain (`query.unionQuery`), not to the first. Adding a `LIMIT` to the first query of a union prints it before `UNION ALL`, which Druid does not accept, so to limit a union as a whole, wrap it: `SqlQuery.selectStarFrom(unionQuery).changeLimitValue(10)`.

## WITH

`flattenWith()` merges nested `WITH` clauses into a single one where that does not change the meaning:

```js
SqlExpression.parse(`WITH a AS (SELECT 1 AS x)
(WITH b AS (SELECT 2 AS y)
SELECT * FROM a, b)`).flattenWith();
//=> WITH a AS (SELECT 1 AS x),
//   b AS (SELECT 2 AS y)
//   SELECT * FROM a, b
```

Queries that have no `WITH` to flatten are returned unchanged. Adding and reading `WITH` parts on a `SELECT` is covered in [SELECT queries](select-queries.md#with).

<hr>

[**Next**: 🔎 SELECT queries](select-queries.md)\
[**Top**: Table of contents](README.md)
