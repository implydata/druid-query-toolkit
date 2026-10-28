# 🚰 Pipe syntax

Druid supports pipe syntax SQL, where a query is a starting query followed by a list of operators, each applied to the result of the one before:

```sql
FROM wikipedia
|> WHERE channel = '#en.wikipedia'
|> AGGREGATE COUNT(*) AS edits GROUP BY cityName
|> WHERE edits > 10
|> ORDER BY edits DESC
|> LIMIT 5
```

## Parsing

A pipe query parses into a `SqlPipesQuery`. Use `SqlExpression.parse` (not `SqlQuery.parse`, which only accepts `SELECT` queries):

```js
import { C, SqlExpression, SqlPipesQuery, SqlWherePipeOperator } from 'druid-query-toolkit';

const query = SqlExpression.parse(`FROM wikipedia
|> WHERE channel = '#en.wikipedia'
|> AGGREGATE COUNT(*) AS edits GROUP BY cityName`);

query instanceof SqlPipesQuery; //=> true
query.query; //=> FROM wikipedia  (the starting query, a SqlFromQuery here)
query.getPipeOperators(); //=> [|> WHERE ..., |> AGGREGATE ...]
query.getLastPipeOperator(); //=> |> AGGREGATE COUNT(*) AS edits GROUP BY cityName
```

The starting query is often a bare `FROM ...` (`SqlFromQuery`), but it can be any query, for example `SELECT ... |> WHERE ...`. A `SqlFromQuery` holds a whole FROM clause (`fromClause`), so it can have aliases, joins, several comma separated tables and sub-queries: `FROM t AS a JOIN u AS b ON a.x = b.x |> ...`.

Everything before the first `|>` is the starting query:

| SQL | Starting query |
| --- | --- |
| `FROM t \|> ...` | `SqlFromQuery` |
| `SELECT ... ORDER BY x LIMIT 5 \|> ...` | `SqlQuery`, with its ORDER BY and LIMIT |
| `A UNION ALL B \|> ...` | the whole union: `A`, with `B` as its `unionQuery` |
| `WITH s AS (...) FROM s \|> ...` | `SqlFromQuery`, with the WITH on the `SqlPipesQuery` |
| `(SELECT ...) \|> ...` | `SqlQuery` with parens |
| `(SELECT ...) LIMIT 5 \|> ...` | `SqlParensQuery` |

A `WITH` in front of the starting query takes in the operators too, so they can use its tables (`WITH s AS (...) FROM s |> WHERE x IN (FROM s |> ...)`). It is the `withClause` of the `SqlPipesQuery` (`changeWithClause(withClause)`, `getWithParts()`), and `SqlPipesQuery.create` takes it off a `SqlQuery` it is given. A `WITH` inside parentheses, as in `(WITH s AS (...) FROM s) |> ...`, stays with the starting query, so the operators can not see its tables.

Nothing can come after the operators but `PARTITIONED BY` and `CLUSTERED BY`: `FROM t |> WHERE x UNION ALL FROM u` does not parse, use `|> UNION ALL (FROM u)` or parentheses.

## The operators

Each operator is its own class, all extending `SqlPipeOperator`:

| Operator | Class | Create with |
| --- | --- | --- |
| `\|> SELECT a, b` | `SqlSelectPipeOperator` | `SqlSelectPipeOperator.create([C('a'), C('b')])` |
| `\|> SELECT DISTINCT a` | `SqlSelectPipeOperator` | `SqlSelectPipeOperator.create([C('a')], 'DISTINCT')` |
| `\|> WHERE x = 1` | `SqlWherePipeOperator` | `SqlWherePipeOperator.create(C('x').equal(1))` |
| `\|> AGGREGATE COUNT(*) AS n GROUP BY a` | `SqlAggregatePipeOperator` | `SqlAggregatePipeOperator.create([F.count().as('n')], [C('a')])` |
| `\|> ORDER BY a DESC` | `SqlOrderByPipeOperator` | `SqlOrderByPipeOperator.create([C('a').toOrderByExpression('DESC')])` |
| `\|> LIMIT 10 OFFSET 5` | `SqlLimitPipeOperator` | `SqlLimitPipeOperator.create(10, 5)` |
| `\|> UNION ALL (FROM u), (FROM v)` | `SqlUnionPipeOperator` | `SqlUnionPipeOperator.create([SqlFromQuery.create('u'), SqlFromQuery.create('v')])` |
| `\|> EXTEND a + 1 AS b` | `SqlExtendPipeOperator` | `SqlExtendPipeOperator.create([C('a').add(L(1)).as('b')])` |
| `\|> SET a = LOWER(a)` | `SqlSetPipeOperator` | `SqlSetPipeOperator.create([SqlColumnAssignment.create('a', F('LOWER', C('a')))])` |
| `\|> DROP a` | `SqlDropPipeOperator` | `SqlDropPipeOperator.create([C('a')])` |
| `\|> RENAME a AS b` | `SqlRenamePipeOperator` | `SqlRenamePipeOperator.create([C('a').as('b')])` |
| `\|> AS t` | `SqlAsPipeOperator` | `SqlAsPipeOperator.create('t')` |
| `\|> DISTINCT` | `SqlDistinctPipeOperator` | `SqlDistinctPipeOperator.create()` |
| `\|> LEFT JOIN u ON t.x = u.x` | `SqlJoinPipeOperator` | `SqlJoinPipeOperator.create(SqlJoinPart.create('LEFT', T('u'), SqlExpression.parse('t.x = u.x')))` |

Operators have accessors for their parts, such as `SqlWherePipeOperator#getExpression()` and `#changeExpression(ex)`, `SqlAggregatePipeOperator#getGroupByExpressions()`, `SqlLimitPipeOperator#getLimitValue()` and `SqlRenamePipeOperator#getNewNames()`.

`|> UNION` takes `ALL`, `DISTINCT` or neither (`decorator` is `'ALL'`, `'DISTINCT'` or `undefined`); without the `ALL` it removes duplicate rows. Each of its queries is kept with its parentheses. `|> JOIN` holds a `SqlJoinPart`, the same as a JOIN in a FROM clause, so it can be any kind of join, with `ON`, `USING (...)` or no condition. Use a `|> AS` before it to name the input for the join condition.

### AGGREGATE

Unlike in standard SQL, the `GROUP BY` items of an `|> AGGREGATE` can have aliases (`|> AGGREGATE COUNT(*) AS n GROUP BY UPPER(item) AS i`), which become the names of the grouping columns in the output. They are `SqlAlias` expressions in the `groupByClause`; create them with `.as(...)`, for example `SqlAggregatePipeOperator.create([F.count().as('n')], [F('UPPER', C('item')).as('i')])`. `unpipe()` puts the aliased keys in the select list and groups by the bare expressions.

Any item, an aggregate or a grouping key, can also have an order suffix, which sorts the output by it: `|> AGGREGATE COUNT(*) AS n DESC GROUP BY item ASC NULLS LAST`. The output is sorted by the grouping keys with a suffix first and then by the aggregates with one. Such an item is a `SqlOrderByExpression` around the (possibly aliased) expression; create it with `.toOrderByExpression(...)`, for example `F.count().as('n').toOrderByExpression('DESC')`. Without an `AS`, `ASC` and `DESC` are always read as an order suffix, never as an alias. `unpipe()` turns the suffixes into an `ORDER BY`.

## Building

`SqlPipesQuery.create(query, operators)` builds a pipe query. Given a pipe query as the starting point, it appends the operators to it instead of nesting:

```js
import { F, SqlAggregatePipeOperator, SqlExtendPipeOperator, SqlFromQuery, SqlOrderByPipeOperator, T } from 'druid-query-toolkit';

SqlPipesQuery.create(SqlFromQuery.create(T('wikipedia')), [
  SqlWherePipeOperator.create(C('isRobot').equal(false)),
  SqlExtendPipeOperator.create([F.timeFloor(C('__time'), 'PT1H').as('hour')]),
  SqlAggregatePipeOperator.create([F.count().as('edits')], [C('hour')]),
  SqlOrderByPipeOperator.create([C('hour').toOrderByExpression('ASC')]),
]);
```

```sql
FROM "wikipedia"
|> WHERE "isRobot" = FALSE
|> EXTEND TIME_FLOOR("__time", 'PT1H') AS "hour"
|> AGGREGATE COUNT(*) AS "edits" GROUP BY "hour"
|> ORDER BY "hour" ASC
```

## Editing the pipeline

```js
query.appendPipeOperator(SqlWherePipeOperator.create(C('edits').greaterThan(10)));
query.insertPipeOperator(1, SqlWherePipeOperator.create(C('isRobot').equal(false)));
query.removePipeOperator(1);
query.changePipeOperators(operators);
```

`removePipeOperator` returns a `SqlQueryBase`: removing the only operator leaves just the starting query (`FROM wikipedia |> WHERE x = 1` becomes `FROM wikipedia`), with the `WITH` of the pipe query back in front of it.

Because each operator works on the result of the previous one, adding a filter at the end is always valid, whatever the pipeline does. That makes pipe queries easy to edit from a UI: "filter on this value" on a result is just an appended `|> WHERE`:

```js
query
  .appendPipeOperator(SqlWherePipeOperator.create(C('edits').greaterThan(10)))
  .changeLimitValue(100);
```

```sql
FROM wikipedia
|> WHERE channel = '#en.wikipedia'
|> AGGREGATE COUNT(*) AS edits GROUP BY cityName
|> WHERE "edits" > 10
|> LIMIT 100
```

## ORDER BY and LIMIT

The [ORDER BY, LIMIT and OFFSET methods](queries.md#order-by) that every query has also work on a pipe query. They read and write the trailing `|> ORDER BY` and `|> LIMIT` operators, so generic code does not need to know it is dealing with a pipe query:

```js
const sorted = query.changeOrderByExpression(C('edits').toOrderByExpression('DESC')).changeLimitValue(5);
```

```sql
FROM wikipedia
|> WHERE channel = '#en.wikipedia'
|> AGGREGATE COUNT(*) AS edits GROUP BY cityName
|> ORDER BY "edits" DESC
|> LIMIT 5
```

Calling them again changes those operators in place rather than adding more, and `changeLimitValue(undefined)` removes the trailing `|> LIMIT`. `OFFSET` is written as part of the `|> LIMIT` operator (`|> LIMIT 10 OFFSET 5`).

## unpipe()

`unpipe()` converts a pipe query into an equivalent `SqlQuery` without pipes. It folds operators into a single `SELECT` where it can, and nests sub-queries where it has to:

```js
query.unpipe();
```

```sql
SELECT cityName, COUNT(*) AS edits FROM wikipedia
WHERE channel = '#en.wikipedia'
GROUP BY cityName
```

A longer pipeline:

```js
SqlExpression.parse(`FROM wikipedia
|> WHERE isRobot = FALSE
|> EXTEND TIME_FLOOR(__time, 'PT1H') AS "hour"
|> AGGREGATE COUNT(*) AS edits GROUP BY "hour", channel
|> WHERE edits > 10
|> ORDER BY edits DESC
|> LIMIT 5`).unpipe();
```

```sql
SELECT *
FROM (
  SELECT "hour", channel, COUNT(*) AS edits
  FROM (
    SELECT *, TIME_FLOOR(__time, 'PT1H') AS "hour" FROM wikipedia
    WHERE isRobot = FALSE
  )
  GROUP BY "hour", channel
)
WHERE edits > 10
ORDER BY edits DESC
LIMIT 5
```

This is useful when you want to use the `SqlQuery` helpers (for example `getOutputColumns()` or `addSelect`), or to run a pipe query somewhere that does not support pipe syntax. Bare `FROM` queries inside the query (in a `WITH`, a sub-query or a `|> UNION ALL`) become `SELECT * FROM ...` too. The `WITH` of the pipe query goes on the outermost `SELECT`, so the tables it defines stay in reach of every part that came from an operator.

How the other operators come out:

| Operator | Becomes |
| --- | --- |
| `\|> DISTINCT`, `\|> SELECT DISTINCT` | a `SELECT DISTINCT` |
| `\|> AS t` | an alias on the table, or `SELECT * FROM (...) AS t` |
| `\|> JOIN ...` | a join in the FROM clause. After a `WHERE` the input becomes a sub-query that keeps the name of its table, so `FROM t \|> WHERE x \|> JOIN u ON t.k = u.k` still works |
| `\|> UNION ALL (q1), (q2)` | `... UNION ALL q1 UNION ALL q2` |
| `\|> UNION (q)`, `\|> UNION DISTINCT (q)` | `SELECT DISTINCT * FROM (... UNION ALL q)` |
| order suffixes in `\|> AGGREGATE` | an `ORDER BY` |

`|> SET`, `|> DROP` and `|> RENAME` need to know the columns of their input to be written as a `SELECT`. When the input is a table (`FROM t |> DROP x`), they are not known and `unpipe()` throws `can not unpipe |> SET because the columns of its input are not known`. After an operator that names its columns (such as `|> SELECT` or `|> AGGREGATE`), they unpipe fine.

<hr>

[**Next**: 💅 Formatting and comparing](formatting.md)\
[**Top**: Table of contents](README.md)
