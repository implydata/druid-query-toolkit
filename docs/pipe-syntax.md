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

The starting query is often a bare `FROM t` (`SqlFromQuery`), but it can be any query, for example `SELECT ... |> WHERE ...`.

## The operators

Each operator is its own class, all extending `SqlPipeOperator`:

| Operator | Class | Create with |
| --- | --- | --- |
| `\|> SELECT a, b` | `SqlSelectPipeOperator` | `SqlSelectPipeOperator.create([C('a'), C('b')])` |
| `\|> WHERE x = 1` | `SqlWherePipeOperator` | `SqlWherePipeOperator.create(C('x').equal(1))` |
| `\|> AGGREGATE COUNT(*) AS n GROUP BY a` | `SqlAggregatePipeOperator` | `SqlAggregatePipeOperator.create([F.count().as('n')], [C('a')])` |
| `\|> ORDER BY a DESC` | `SqlOrderByPipeOperator` | `SqlOrderByPipeOperator.create([C('a').toOrderByExpression('DESC')])` |
| `\|> LIMIT 10 OFFSET 5` | `SqlLimitPipeOperator` | `SqlLimitPipeOperator.create(10, 5)` |
| `\|> EXTEND a + 1 AS b` | `SqlExtendPipeOperator` | `SqlExtendPipeOperator.create([C('a').add(L(1)).as('b')])` |
| `\|> SET a = LOWER(a)` | `SqlSetPipeOperator` | `SqlSetPipeOperator.create([SqlColumnAssignment.create('a', F('LOWER', C('a')))])` |
| `\|> DROP a` | `SqlDropPipeOperator` | `SqlDropPipeOperator.create([C('a')])` |

Operators have accessors for their parts, such as `SqlWherePipeOperator#getExpression()` and `#changeExpression(ex)`, `SqlAggregatePipeOperator#getGroupByExpressions()` and `SqlLimitPipeOperator#getLimitValue()`.

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

`removePipeOperator` returns a `SqlQueryBase`: removing the only operator leaves just the starting query (`FROM wikipedia |> WHERE x = 1` becomes `FROM wikipedia`).

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

This is useful when you want to use the `SqlQuery` helpers (for example `getOutputColumns()` or `addSelect`), or to run a pipe query somewhere that does not support pipe syntax.

`|> SET` and `|> DROP` need to know the columns of their input to be written as a `SELECT`. When the input is a table (`FROM t |> DROP x`), they are not known and `unpipe()` throws `can not unpipe |> SET because the columns of its input are not known`. After an operator that names its columns (such as `|> SELECT` or `|> AGGREGATE`), they unpipe fine.

<hr>

[**Next**: 💅 Formatting and comparing](formatting.md)\
[**Top**: Table of contents](README.md)
