# 📦 Running queries and results

Besides SQL, the toolkit has a few pieces for running queries and making sense of what comes back. They are independent of each other, so use the ones you need.

## QueryRunner

`QueryRunner` wraps the boilerplate of sending a query to Druid. It does not do any networking itself: you give it an *executor*, a function that posts a payload and returns the response data and headers. That keeps the library free of dependencies and lets you use whatever HTTP client (and authentication) you already have:

```ts
import { QueryRunner } from 'druid-query-toolkit';

const queryRunner = new QueryRunner({
  executor: async ({ payload, isSql, signal }) => {
    const response = await fetch(`http://localhost:8888/druid/v2${isSql ? '/sql' : ''}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });
    return {
      data: await response.json(),
      headers: Object.fromEntries(response.headers.entries()),
    };
  },
});
```

You can also set `QueryRunner.defaultQueryExecutor` once, to be used by every runner that does not have its own executor.

`runQuery` takes a SQL string, a `SqlQuery` or a full query payload (SQL or native):

```ts
const result = await queryRunner.runQuery({
  query: SqlQuery.parse('SELECT channel, COUNT(*) AS cnt FROM wikipedia GROUP BY 1'),
  defaultQueryContext: { sqlStringifyArrays: false }, // overridden by the payload's own context
  extraQueryContext: { sqlTimeZone: 'Asia/Tokyo' }, // overrides the payload's own context
  signal: abortController.signal,
});
```

For SQL it asks for the `array` result format with all three header rows (names, native types and SQL types), which lets it decode column types and turn `TIMESTAMP` columns into `Date`s. Options:

- `queryParameters`: values for `?` placeholders, sent as Druid SQL parameters.
- `resultFormat`, `header`, `typesHeader`, `sqlTypesHeader`: override the defaults for a SQL string or `SqlQuery`.
- `new QueryRunner({ inflateDateStrategy })`: `'fromSqlTypes'` (the default) converts `TIMESTAMP` columns, `'guess'` converts anything that looks like an ISO date, `'none'` leaves strings alone.

If the query string parses as a `SqlQuery`, it is attached to the result as `result.sqlQuery`. The web console relies on that: result table menus look at `result.sqlQuery` to decide which [query actions](use-case-ui-edits.md) to offer.

## QueryResult

A `QueryResult` is a table: a `header` of `Column`s and `rows` of values.

```ts
result.getHeaderNames(); //=> ['channel', 'cnt', '__time']
result.header[1]; //=> Column { name: 'cnt', sqlType: 'BIGINT', nativeType: 'LONG' }
result.header[1].isNumeric(); //=> true
result.header[2].isTimeColumn(); //=> true
result.rows; //=> [['#en', 10, Date], ['#fr', 5, Date]]
result.getNumResults(); //=> 2
result.isEmpty(); //=> false
result.toObjectArray(); //=> [{ channel: '#en', cnt: 10, __time: Date }, ...]
result.getColumnByName('cnt'); //=> [10, 5]
result.getColumnByIndex(0); //=> ['#en', '#fr']
result.sqlQuery; //=> the SqlQuery that ran, if it parsed
result.queryDuration; //=> ms
result.sqlQueryId; // from the response headers
```

It decodes the result shapes Druid returns: SQL results in the `array` and `object` formats (and their `...Lines` variants), with or without header rows, and the results of native queries (timeseries, topN, groupBy, scan, segmentMetadata, ...). A truncated line based response throws an error that says so. To decode data you got some other way, use:

```ts
QueryResult.fromQueryAndRawResult(payload, data, responseHeaders); // like runQuery does
QueryResult.fromRawResult(data, includeTimestampIfExists, hasHeader, hasTypeHeader, hasSqlTypeHeader);
QueryResult.fromObjectArray([{ a: 1, b: 'x' }, { a: 2 }]); // rows: [[1, 'x'], [2, null]]
```

To parse JSON with big integers intact, set `QueryResult.jsonParse` to a parser that supports them (the web console uses `json-bigint`).

## Introspection

`Introspect` builds introspection queries and decodes their results:

```ts
import { Introspect } from 'druid-query-toolkit';

Introspect.getTableIntrospectionQuery();
//=> SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'druid' AND TABLE_TYPE = 'TABLE'
const tables = Introspect.decodeTableIntrospectionResult(tablesResult); //=> [{ name: 'wikipedia' }, ...]
```

To find the output columns (and their types) of any query without running it for real, wrap it in `SELECT * FROM (...) LIMIT 0`:

```ts
const payload = Introspect.getQueryColumnIntrospectionPayload(SqlQuery.parse('SELECT channel, COUNT(*) AS cnt FROM wikipedia GROUP BY 1'));
//=> { query: 'SELECT *\nFROM (SELECT channel, ...)\nLIMIT 0', resultFormat: 'array', header: true, typesHeader: true, sqlTypesHeader: true }

const columns = Introspect.decodeQueryColumnIntrospectionResult(await queryRunner.runQuery({ query: payload }));
//=> [Column { name: 'channel', sqlType: 'VARCHAR', ... }, Column { name: 'cnt', sqlType: 'BIGINT', ... }]
```

`Introspect.getQueryColumnIntrospectionQuery(query)` returns just the wrapped `SqlQuery`.

## Filter patterns

A filter UI (chips like `channel is one of #en, #fr` or `__time in 2024-01`) needs to go back and forth between a `WHERE` expression and structured, editable filters. Filter patterns do that. `fitFilterPatterns` splits a filter into its `AND`ed parts and recognizes each one:

```ts
import { filterPatternsToExpression, fitFilterPatterns, SqlExpression } from 'druid-query-toolkit';

const patterns = fitFilterPatterns(
  SqlExpression.parse(
    `channel IN ('#en', '#fr') AND TIME_IN_INTERVAL(__time, '2024-01-01/2024-02-01') AND added >= 10 AND x = y`,
  ),
);
//=> [
//   { type: 'values', negated: false, column: 'channel', values: ['#en', '#fr'] },
//   { type: 'timeInterval', negated: false, column: '__time', start: Date, end: Date, startBound: '[', endBound: ')' },
//   { type: 'numberRange', negated: false, column: 'added', start: 10, startBound: '[', endBound: ')' },
//   { type: 'custom', negated: false, expression: x = y },
// ]
```

Anything that does not match a known shape becomes a `custom` pattern holding the original expression, so nothing is lost. Edit the patterns as plain objects and turn them back into SQL:

```ts
filterPatternsToExpression(
  patterns.map(p => (p.type === 'values' ? { ...p, values: [...p.values, '#de'] } : p)),
);
//=> "channel" IN ('#en', '#fr', '#de')
//     AND TIME_IN_INTERVAL("__time", '2024-01-01T00:00:00.000Z/2024-02-01T00:00:00.000Z')
//     AND "added" >= 10
//     AND x = y
```

The pattern types are `values` (`=`, `IN`), `contains` (`ICONTAINS_STRING`), `regexp` (`REGEXP_LIKE`), `timeInterval` (`TIME_IN_INTERVAL` or a pair of bounds on a time column), `timeRelative` (relative to the current time or `MAX_DATA_TIME()`), `numberRange`, `mvContains` (multi-value columns) and `custom`. Every one can be `negated`. Also available:

- `fitFilterPattern(ex)` recognizes a single expression.
- `filterPatternToExpression(pattern)` converts a single pattern.
- `changeFilterPatternType(pattern, type)` converts a pattern to another type, keeping its column and value where it can (for a type picker in a filter editor).

The web console's explore view merges a chart click into the current filter like this, replacing any earlier pattern on the same column:

```ts
import { C, fitFilterPattern } from 'druid-query-toolkit';

function updateFilterClause(where: SqlExpression, clause: SqlExpression): SqlExpression {
  const newPattern = fitFilterPattern(clause);
  const column = newPattern.type === 'custom' ? undefined : newPattern.column;
  const patterns = fitFilterPatterns(where).filter(p => !column || p.type === 'custom' || p.column !== column);
  return filterPatternsToExpression([...patterns, newPattern]);
}

updateFilterClause(SqlExpression.parse(`channel IN ('#en', '#fr') AND added >= 10`), C('channel').equal('#de'));
//=> "added" >= 10 AND "channel" = '#de'
```

<hr>

[**Next**: 📚 API reference](api.md)\
[**Top**: Table of contents](README.md)
