# 🖱️ Editing queries from UI actions

This page shows how the [Druid web console](https://github.com/apache/druid/tree/master/web-console) turns clicks into edits of the query the user typed. The same patterns work for any tool that lets people write SQL and then explore the results by pointing and clicking. The code is simplified from the console's result table, cell menu and column tree.

All recipes use this query, as if the user had typed it and run it:

```js
import {
  C,
  F,
  L,
  N,
  SqlColumn,
  SqlExpression,
  SqlFunction,
  SqlLiteral,
  SqlQuery,
  T,
} from 'druid-query-toolkit';

const query = SqlQuery.parse(`SELECT
  countryName,
  LOWER(channel) AS channel,
  COUNT(*) AS "Count"
FROM wikipedia
WHERE __time >= CURRENT_TIMESTAMP - INTERVAL '1' DAY
GROUP BY 1, 2
ORDER BY 3 DESC`);
```

## The pattern: query actions

Model every UI action as a function from query to query:

```ts
type QueryAction = (query: SqlQuery) => SqlQuery;
```

The editor keeps the user's text. When an action fires, it parses the current text, applies the action and puts the printed result back into the editor (and usually runs it):

```ts
function handleQueryAction(queryString: string, action: QueryAction): string | undefined {
  const parsedQuery = SqlQuery.maybeParse(queryString);
  if (!parsedQuery) return; // the text does not parse, so the action is not offered
  return parsedQuery.apply(action).toString();
}
```

Because [only the touched parts change](text-preservation.md), the user sees their own query with one small, obvious edit. If the editor holds several statements, find the range of the one that produced the results, apply the action to just that slice and splice the result back in with the rest of the text around it.

The console attaches the parsed query to the result (`QueryResult#sqlQuery`, see [Running queries](results.md)), so menus can look at the query that produced the table to decide what to offer.

## Filter on a cell value

Clicking a value in the results offers "Filter on: `column = value`". Which expression to filter on, and whether to filter in `WHERE` or `HAVING`, depend on the column:

```ts
function filterOnCell(query: SqlQuery, headerIndex: number, value: unknown): SqlQuery {
  const selectExpression = query.getSelectExpressionForIndex(headerIndex)!;
  const having = query.isAggregateSelectIndex(headerIndex);

  // WHERE can not refer to a select alias, so filter on the underlying expression.
  // HAVING can refer to an aggregate by its output name.
  const ex = having ? C(selectExpression.getOutputName()!) : selectExpression.getUnderlyingExpression();

  const literal = value instanceof Date ? L(value) : SqlLiteral.maybe(value) ?? L.NULL;
  const clause = ex.equal(literal);

  // Replace an earlier filter on the same column rather than stacking them.
  const columnName = clause.getUsedColumnNames()[0]!;
  return having
    ? query.removeFromHaving(columnName).addHaving(clause)
    : query.removeColumnFromWhere(columnName).addWhere(clause);
}

filterOnCell(query, 1, '#en.wikipedia');
```

```sql
SELECT
  countryName,
  LOWER(channel) AS channel,
  COUNT(*) AS "Count"
FROM wikipedia
WHERE __time >= CURRENT_TIMESTAMP - INTERVAL '1' DAY AND LOWER(channel) = '#en.wikipedia'
GROUP BY 1, 2
ORDER BY 3 DESC
```

Clicking a count with "Filter on: `Count >= 100`" (`greaterThanOrEqual` instead of `equal`) goes to `HAVING` instead:

```sql
GROUP BY 1, 2
HAVING "Count" >= 100
ORDER BY 3 DESC
```

If the query has `SELECT *`, there are no select expressions to look at, so filter on `C(header)`.

## Remove a column's filter

The header menu shows "Remove from WHERE clause" only if there is something to remove:

```ts
if (query.getEffectiveWhereExpression().containsColumnName(header)) {
  offer('Remove from WHERE clause', q => q.removeColumnFromWhere(header));
}
if (query.getEffectiveHavingExpression().containsColumnName(header)) {
  offer('Remove from HAVING clause', q => q.removeFromHaving(header));
}
```

## Sort by a column

Clicking a header sorts by it, and clicking again reverses the direction:

```ts
function sortByHeader(query: SqlQuery, headerIndex: number): SqlQuery {
  const current = query.getOrderByForSelectIndex(headerIndex);
  return query.changeOrderByExpressions([
    current ? current.reverseDirection() : SqlLiteral.index(headerIndex).toOrderByExpression('DESC'),
  ]);
}

sortByHeader(query, 2); // ORDER BY 3 DESC  ->  ORDER BY 3 ASC
sortByHeader(query, 0); // ORDER BY 3 DESC  ->  ORDER BY 1 DESC
```

Sorting by the select index (`ORDER BY 1`) works whether or not the column has a name. When drawing the table, `query.getOrderByForOutputColumn(header)?.getEffectiveDirection()` tells you which arrow to show on each header.

## Change a column's expression

Header actions like "Cast to...", "Parse as JSON" or "Remove outer function" change a select expression but should keep its output name, so that the result column (and anything that refers to it by name) stays put:

```ts
const selectExpression = query.getSelectExpressionForIndex(headerIndex)!;
const outputName = selectExpression.getOutputName();
const underlying = selectExpression.getUnderlyingExpression();

// Cast to...
query.changeSelect(headerIndex, underlying.cast('VARCHAR').setAlias(outputName));

// Parse as JSON
query.changeSelect(headerIndex, F('TRY_PARSE_JSON', underlying).setAlias(outputName));

// Remove outer function: LOWER(channel) AS channel  ->  channel AS "channel"
if (underlying instanceof SqlFunction && underlying.getArg(0)) {
  query.changeSelect(headerIndex, underlying.getArg(0)!.setAlias(outputName));
}
```

## Add a column next to another

"Get JSON value for `$.color`" on a JSON column adds a new column right after the one clicked. `addSelect` shifts the `ORDER BY 3` to `ORDER BY 4` so the sort does not change:

```js
query.addSelect(F.jsonValue(C('attrs'), '$.color').as('color'), { insertIndex: headerIndex + 1 });
```

```sql
SELECT
  countryName,
  LOWER(channel) AS channel,
  JSON_VALUE("attrs", '$.color') AS "color",
  COUNT(*) AS "Count"
FROM wikipedia
WHERE __time >= CURRENT_TIMESTAMP - INTERVAL '1' DAY
GROUP BY 1, 2
ORDER BY 4 DESC
```

## Group by, aggregate, remove

In a `GROUP BY` query, a dimension column can be turned into an aggregate:

```ts
if (query.isGroupedOutputColumn(header)) {
  const underlying = query.getSelectExpressionForIndex(headerIndex)!.getUnderlyingExpression();
  offer('Convert to COUNT DISTINCT', q =>
    q.removeOutputColumn(header).addSelect(F.countDistinct(underlying).as(`unique_${header}`)),
  );
}

offer('Remove column', q => q.removeOutputColumn(header));
```

For `countryName`, the first action gives:

```sql
SELECT
  LOWER(channel) AS channel,
  COUNT(*) AS "Count",
  COUNT(DISTINCT countryName) AS "unique_countryName"
FROM wikipedia
WHERE __time >= CURRENT_TIMESTAMP - INTERVAL '1' DAY
GROUP BY 1
ORDER BY 2 DESC
```

`removeOutputColumn` takes the column out of `GROUP BY` and `ORDER BY` too, and shifts the other references. Going the other way, "Group by this column" from the column tree adds a dimension with `q.addSelect(C(column), { insertIndex: 'last-grouping', addToGroupBy: 'end' })`: `'last-grouping'` puts it after the existing dimensions, where people expect it.

## Filters from a menu, with templates

The column tree's "Filter > Latest hour" menu item on a time column uses a parsed template with a placeholder for the column:

```js
const LATEST_HOUR = SqlExpression.parse(`? >= CURRENT_TIMESTAMP - INTERVAL '1' HOUR`);

query.removeColumnFromWhere('__time').addWhere(LATEST_HOUR.fillPlaceholders([C('__time')]));
```

```sql
WHERE "__time" >= CURRENT_TIMESTAMP - INTERVAL '1' HOUR
```

A "between" template works the same way with several placeholders: `SqlExpression.parse('(? <= ? AND ? < ?)').fillPlaceholders([start, C(col), C(col), end])`.

## A new query from a column click

Clicking a column in the schema tree writes a new "values of this column" query. When the current query already reads from the same table, the new query keeps its `FROM`, `WHERE` and aggregates, so the user stays in the slice of data they were looking at:

```ts
const STRING_QUERY = SqlQuery.parse(`SELECT
  ?
FROM ?
GROUP BY 1
ORDER BY 2 DESC`);

function queryForColumn(table: string, column: string, currentQuery?: SqlQuery): SqlQuery {
  let from: SqlExpression = T(table);
  let where: SqlExpression | undefined;
  let aggregates: SqlExpression[] = [F.count().as('Count')];

  if (currentQuery && currentQuery.getFirstTableName() === table) {
    from = currentQuery.getFirstFromExpression()!;
    where = currentQuery.getWhereExpression();
    aggregates = currentQuery.getAggregateSelectExpressions();
  }

  const newQuery = STRING_QUERY.fillPlaceholders([C(column), from]) as SqlQuery;
  return newQuery
    .changeSelectExpressions(newQuery.getSelectExpressionsArray().concat(aggregates))
    .changeWhereExpression(where);
}

queryForColumn('wikipedia', 'cityName', query);
```

```sql
SELECT
  "cityName",
  COUNT(*) AS "Count"
FROM wikipedia
WHERE __time >= CURRENT_TIMESTAMP - INTERVAL '1' DAY
GROUP BY 1
ORDER BY 2 DESC
```

## Joins from a menu

"Join lookup" on a table adds a `LEFT JOIN` to the current query:

```js
query.addLeftJoin(
  N('lookup').table('country_names'),
  N('lookup').table('country_names').column('k').equal(SqlColumn.create('countryIsoCode', 'wikipedia')),
);
```

## Everything else

Many other actions are one method call on the query the user wrote:

| Action | Edit |
| --- | --- |
| Explain | `q.makeExplain()` |
| Change the time zone | `q.changeContext({ ...q.getContext(), sqlTimeZone: 'Asia/Tokyo' })` |
| Show more rows | `q.changeLimitValue((q.getLimitValue() ?? 100) * 2)` |
| Replace the table | `q.changeFromExpressions([T('wikipedia_v2')])` |
| Count the rows | `q.changeSelectExpressions([F.count().as('Count')]).changeGroupByExpressions(undefined).changeOrderByClause(undefined)` |
| Preview an ingestion as a SELECT | `q.changeInsertClause(undefined).changeReplaceClause(undefined).changePartitionedByClause(undefined).changeClusteredByClause(undefined)` |
| Prettify | `q.prettify()` |

The [explore view](https://github.com/apache/druid/tree/master/web-console/src/views/explore-view) of the console works at the level of filters rather than whole queries: chart clicks and time range brushing update a `WHERE` expression through [filter patterns](results.md#filter-patterns).

<hr>

[**Next**: 🛡️ Validating user input](use-case-validation.md)\
[**Top**: Table of contents](README.md)
