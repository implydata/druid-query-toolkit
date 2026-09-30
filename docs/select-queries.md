# 🔎 SELECT queries

`SqlQuery` models a `SELECT` statement. On top of what every [query](queries.md) has, it has methods for each of its own clauses: `WITH`, the select list, `FROM` and joins, `WHERE`, `GROUP BY` and `HAVING`, plus helpers that relate `GROUP BY` and `ORDER BY` to the select list.

The examples on this page use this query:

```js
import { C, F, SqlColumn, SqlJoinPart, SqlLiteral, SqlQuery, SqlWithPart, T } from 'druid-query-toolkit';

const query = SqlQuery.parse(`SELECT
  channel,
  TIME_FLOOR(__time, 'PT1H') AS "hour",
  COUNT(*) AS "Count",
  SUM(added) / 1000
FROM wikipedia
WHERE isRobot = FALSE
GROUP BY 1, 2
HAVING COUNT(*) > 10
ORDER BY 3 DESC`);
```

## Select indexes and output columns

Many methods refer to a select expression either by its **select index** (0-based position in the select list) or by its **output column** name (the name the column has in the result, which is what a results table shows as a header).

```js
query.getOutputColumns(); //=> ['channel', 'hour', 'Count', 'EXPR$3']
query.getSelectExpressionsArray(); //=> the four select expressions
query.getSelectExpressionForIndex(1); //=> TIME_FLOOR(__time, 'PT1H') AS "hour"
query.getSelectIndexForOutputColumn('hour'); //=> 1  (-1 if not found)
query.isValidSelectIndex(4); //=> false
query.isRealOutputColumnAtSelectIndex(3); //=> false, it has the made up name EXPR$3
query.getSelectIndexesForColumn('__time'); //=> [1], the select expressions that use the column
query.hasStarInSelect(); //=> false
```

An unnamed expression gets the output name `EXPR$<index>`, like Druid gives it. `SqlQuery.isPhonyOutputName(name)` tells you whether a name is one of those.

Note that `GROUP BY 1, 2` and `ORDER BY 3` refer to select expressions by their 1-based position. `SqlLiteral.index(i)` makes such a reference from a 0-based index, and the methods below keep those references pointing at the right expressions when the select list changes.

## Changing the select list

### addSelect(expression, options?)

Inserts a select expression. `options`:

- `insertIndex`: where to insert. A number, `'last'` (the default) or `'last-grouping'` (right after the last grouped column, which is where a new dimension belongs).
- `addToGroupBy`: `'start'` or `'end'` to also group by the new column (by its index), or pass `groupByExpression` to group by something else.
- `addToOrderBy`: `'start'` or `'end'` to also order by the new column, with `direction` (`'ASC'` or `'DESC'`), or pass `orderByExpression`.

Numeric `GROUP BY` and `ORDER BY` references after the insertion point are shifted, so they keep pointing at the same columns:

```js
query.addSelect(C('cityName'), { insertIndex: 0, addToGroupBy: 'start' });
```

```sql
SELECT
  "cityName",
  channel,
  TIME_FLOOR(__time, 'PT1H') AS "hour",
  COUNT(*) AS "Count",
  SUM(added) / 1000
FROM wikipedia
WHERE isRobot = FALSE
GROUP BY 1, 2, 3
HAVING COUNT(*) > 10
ORDER BY 4 DESC
```

```js
query.addSelect(F.countDistinct(C('user')).as('unique_users'), { addToOrderBy: 'start', direction: 'DESC' });
```

```sql
SELECT
  channel,
  TIME_FLOOR(__time, 'PT1H') AS "hour",
  COUNT(*) AS "Count",
  SUM(added) / 1000,
  COUNT(DISTINCT "user") AS "unique_users"
FROM wikipedia
WHERE isRobot = FALSE
GROUP BY 1, 2
HAVING COUNT(*) > 10
ORDER BY 5 DESC, 3 DESC
```

### Removing select expressions

`removeSelectIndex(index)`, `removeSelectIndexes(indexes)` and `removeOutputColumn(name)` remove select expressions, together with any `GROUP BY` and `ORDER BY` entries that refer to them, and shift the remaining numeric references:

```js
query.removeOutputColumn('channel');
```

```sql
SELECT
  TIME_FLOOR(__time, 'PT1H') AS "hour",
  COUNT(*) AS "Count",
  SUM(added) / 1000
FROM wikipedia
WHERE isRobot = FALSE
GROUP BY 1
HAVING COUNT(*) > 10
ORDER BY 2 DESC
```

If the last grouping column is removed, the query keeps an empty `GROUP BY ()`, so it still aggregates everything into one row, rather than turning into an invalid query.

### Replacing select expressions

- `changeSelect(index, expression)` replaces one select expression.
- `changeSelectExpressions(expressions)` replaces the whole list. It does not adjust `GROUP BY` or `ORDER BY`.
- `changeDecorator('DISTINCT' | 'ALL' | undefined)` sets `SELECT DISTINCT`.

Combining these, "convert this dimension into an aggregate" from the web console's column header menu is:

```js
query
  .removeOutputColumn('channel')
  .addSelect(F.countDistinct(C('channel')).as('unique_channel'), { insertIndex: 'last' });
```

```sql
SELECT
  TIME_FLOOR(__time, 'PT1H') AS "hour",
  COUNT(*) AS "Count",
  SUM(added) / 1000,
  COUNT(DISTINCT "channel") AS "unique_channel"
FROM wikipedia
WHERE isRobot = FALSE
GROUP BY 1
HAVING COUNT(*) > 10
ORDER BY 2 DESC
```

## FROM and JOIN

```js
query.hasFrom(); //=> true
query.getFromExpressions(); //=> [wikipedia]
query.getFirstFromExpression(); //=> wikipedia
query.getFirstTableName(); //=> 'wikipedia'  (from SqlBase, looks at the whole tree)
query.changeFromExpressions([T('wikipedia_v2')]); // "Replace FROM with..."
```

Joins are `SqlJoinPart`s attached to the `FROM` clause:

```js
query.hasJoin(); //=> false
query.getJoins(); //=> []

query.addLeftJoin(T('countries').as('c'), C('countryIsoCode').equal(SqlColumn.create('iso', 'c')));
query.addInnerJoin(T('countries').as('c'), [
  C('countryIsoCode').equal(SqlColumn.create('iso', 'c')),
  SqlColumn.create('active', 'c').equal(true),
]); // an array of conditions is joined with AND
query.addRightJoin(table, on);
query.addFullJoin(table, on);
query.addCrossJoin(T('b'));
query.addJoin(SqlJoinPart.create('LEFT', table, on));
query.removeAllJoins();
```

```sql
FROM wikipedia
INNER JOIN "countries" AS "c" ON "countryIsoCode" = "c"."iso" AND "c"."active" = TRUE
WHERE isRobot = FALSE
```

## WHERE

```js
query.hasWhere(); //=> true
query.getWhereExpression(); //=> isRobot = FALSE  (undefined if there is no WHERE)
query.getEffectiveWhereExpression(); //=> isRobot = FALSE  (TRUE if there is no WHERE)

query.addWhere(C('channel').equal('#en.wikipedia')); // AND it on, or create the WHERE
query.removeColumnFromWhere('isRobot'); // drop every AND-ed condition on the column
query.changeWhereExpression(C('channel').equal('#en.wikipedia')); // replace it
query.changeWhereExpression(undefined); // remove WHERE (TRUE does the same)
```

`removeColumnFromWhere` and `addWhere` together implement the most common results table action, "filter on this value", which replaces any earlier filter on the same column:

```js
function filterOnValue(query: SqlQuery, column: string, value: unknown): SqlQuery {
  const clause = C(column).equal(SqlLiteral.create(value as any));
  return query.removeColumnFromWhere(column).addWhere(clause);
}
```

`getEffectiveWhereExpression()` is convenient for checks that should not care whether there is a `WHERE` at all, like `query.getEffectiveWhereExpression().containsColumnName(column)` to decide whether to show a "remove filter" menu item.

## GROUP BY

```js
query.hasGroupBy(); //=> true
query.getGroupByExpressions(); //=> [1, 2]  (as written)
query.getGroupingExpressions(); //=> [channel, TIME_FLOOR(__time, 'PT1H')]  (references resolved)
query.getGroupingExpressionInfos();
//=> [
//   { expression: channel, selectIndex: 0, outputColumn: 'channel', orderByExpression: undefined },
//   { expression: TIME_FLOOR(__time, 'PT1H'), selectIndex: 1, outputColumn: 'hour', orderByExpression: undefined },
// ]

query.isGroupedSelectIndex(0); //=> true
query.isGroupedOutputColumn('hour'); //=> true
query.getGroupedSelectExpressions(); //=> [channel, TIME_FLOOR(__time, 'PT1H') AS "hour"]
query.getGroupedOutputColumns(); //=> ['channel', 'hour']
query.getGroupedSelectIndexesForColumn('channel'); //=> [0]

query.isAggregateSelectIndex(2); //=> true
query.isAggregateOutputColumn('Count'); //=> true
query.getAggregateSelectExpressions(); //=> [COUNT(*) AS "Count", SUM(added) / 1000]
query.getAggregateOutputColumns(); //=> ['Count', 'EXPR$3']

query.addGroupBy(C('cityName'));
query.changeGroupByExpressions([SqlLiteral.index(0)]);
query.changeGroupByExpressions([]); // GROUP BY (), one row for everything
query.changeGroupByExpressions(undefined); // no GROUP BY at all
```

A results table uses these to decide what a column is: a dimension (`isGroupedOutputColumn`), a measure (`isAggregateOutputColumn`) or a plain column in a query without `GROUP BY` (neither).

## HAVING

`HAVING` has the same set of methods as `WHERE`:

```js
query.hasHaving(); //=> true
query.getHavingExpression(); //=> COUNT(*) > 10
query.getEffectiveHavingExpression(); //=> COUNT(*) > 10  (TRUE if there is no HAVING)
query.addHaving(C('Count').greaterThan(100));
query.removeFromHaving('Count'); // drops AND-ed conditions that reference "Count" by name
query.changeHavingExpression(undefined);
```

To filter on a value of an aggregate column (a measure), filter in `HAVING` by its output name instead of in `WHERE`:

```js
const isMeasure = query.isAggregateOutputColumn(header);
const clause = C(header).greaterThanOrEqual(value);
const newQuery = isMeasure
  ? query.removeFromHaving(header).addHaving(clause)
  : query.removeColumnFromWhere(header).addWhere(clause);
```

## ORDER BY

On top of the [generic ORDER BY methods](queries.md#order-by), `SqlQuery` can relate `ORDER BY` entries to select expressions, whether they refer to them by position (`ORDER BY 3`), by output name (`ORDER BY "Count"`) or by repeating the expression (`ORDER BY COUNT(*)`):

```js
query.getOrderByForOutputColumn('Count'); //=> 3 DESC
query.getOrderByForSelectIndex(2); //=> 3 DESC
query.getOrderedOutputColumns(); //=> ['Count']
query.getOrderedSelectExpressions(); //=> [COUNT(*) AS "Count"]
query.removeOrderByForOutputColumn('Count'); // removes ORDER BY 3 DESC
query.removeOrderByForSelectIndex(2);
```

The web console uses `getOrderByForOutputColumn(header)?.getEffectiveDirection()` to draw the sort arrow on each result column header.

## WITH

```js
const topChannels = SqlQuery.parse(
  'SELECT channel FROM wikipedia GROUP BY 1 ORDER BY COUNT(*) DESC LIMIT 5',
);

const withQuery = SqlQuery.parse('SELECT * FROM top_channels').changeWithParts([
  SqlWithPart.simple('top_channels', topChannels),
]);
```

```sql
WITH "top_channels" AS (SELECT channel FROM wikipedia GROUP BY 1 ORDER BY COUNT(*) DESC LIMIT 5)
SELECT * FROM top_channels
```

- `getWithParts()` lists the `SqlWithPart`s (each has a `table`, optional `columns` and a `query`).
- `changeWithParts(parts)` replaces them (`undefined` or `[]` removes the `WITH`).
- `prependWith(name, query)` adds one at the front.

## MAX_DATA_TIME()

`inlineMaxDataTime(maxTime)` replaces every `MAX_DATA_TIME()` call with a `TIMESTAMP` literal for the given time (in ms), so a query written relative to the latest data can be run:

```js
SqlQuery.parse(`SELECT * FROM t WHERE __time > MAX_DATA_TIME() - INTERVAL '1' HOUR`).inlineMaxDataTime(
  Date.parse('2024-05-01T12:00:00Z'),
);
//=> SELECT * FROM t WHERE __time > TIMESTAMP '2024-05-01 12:00:00' - INTERVAL '1' HOUR
```

<hr>

[**Next**: 🚰 Pipe syntax](pipe-syntax.md)\
[**Top**: Table of contents](README.md)
