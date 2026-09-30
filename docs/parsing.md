# 📖 Parsing

## Choosing a parse method

```js
import { SqlBase, SqlExpression, SqlQuery } from 'druid-query-toolkit';

SqlExpression.parse(`channel = '#en.wikipedia'`); // any expression or query
SqlQuery.parse(`SELECT * FROM wikipedia`); // only a SELECT query
SqlBase.parseSql(`SELECT * FROM wikipedia`); // whatever the grammar accepts, typed as SqlBase
```

- [`SqlExpression.parse(sql)`](api.md#sqlexpressionparseinput) parses an expression. Since every query is also an expression, it parses queries of every form too. It is the one to use when you do not know in advance what kind of query the user typed (a `SELECT`, a pipe syntax query, `VALUES`, ...).
- [`SqlQuery.parse(sql)`](api.md#sqlqueryparseinput) parses a query and throws `Provided SQL was not a query` unless the result is a [`SqlQuery`](select-queries.md) (a `SELECT`, including one with `WITH`, `UNION ALL`, `SET`, `EXPLAIN PLAN FOR`, `INSERT INTO` or `REPLACE INTO` around it).
- `SqlBase.parseSql(sql)` returns whatever the grammar produced.

All of them also accept an already parsed node and return it as is, which is handy for functions that take either:

```js
function addChannelFilter(query: string | SqlQuery, channel: string): SqlQuery {
  return SqlQuery.parse(query).addWhere(C('channel').equal(channel));
}
```

## What you get back

The class of the result tells you what was parsed. Some examples:

| Input                                             | Class                  |
| ------------------------------------------------- | ---------------------- |
| `channel`, `"channel"`, `t.channel`               | `SqlColumn`            |
| `'hello'`, `42`, `TRUE`, `NULL`, `TIMESTAMP '…'`  | `SqlLiteral`           |
| `COUNT(*)`, `CAST(x AS BIGINT)`, `SUM(x) OVER (…)` | `SqlFunction`          |
| `x = 1`, `x IN (1, 2)`, `x BETWEEN 1 AND 2`, `x LIKE 'a%'` | `SqlComparison` |
| `a AND b`, `a OR b`, `a + b`, `a \|\| b`          | `SqlMulti`             |
| `NOT x`, `-x`                                     | `SqlUnary`             |
| `x AS y`                                          | `SqlAlias`             |
| `CASE WHEN … END`                                 | `SqlCase`              |
| `INTERVAL '1' DAY`                                | `SqlInterval`          |
| `?`                                               | `SqlPlaceholder`       |
| `SELECT …` (with any `WITH`, `SET`, `UNION ALL`, `INSERT`, …) | `SqlQuery` |
| `FROM wikipedia \|> WHERE …`                      | `SqlPipesQuery`        |
| `FROM wikipedia`                                  | `SqlFromQuery`         |
| `TABLE wikipedia`                                 | `SqlTableQuery`        |
| `VALUES (1, 2), (3, 4)`                           | `SqlValues`            |
| `WITH a AS (…) (WITH b AS (…) SELECT …)`          | `SqlWithQuery`         |

Every node also has a `type` string (`'column'`, `'query'`, `'pipesQuery'`, ...) if you prefer to switch on that. Use `instanceof` for type narrowing in TypeScript:

```js
const ex = SqlExpression.parse(input);
if (ex instanceof SqlColumn) {
  console.log(`A column named ${ex.getName()}`);
} else if (ex instanceof SqlQueryBase) {
  console.log('Some kind of query');
}
```

## Handling errors

A syntax error throws a `SyntaxError` from the generated parser. Its `message` lists what was expected and what was found, and its `location` points at the problem:

```js
try {
  SqlQuery.parse('SELECT * FROM t WHERE');
} catch (e) {
  e.message; //=> 'Expected "\'", "?", "ARRAY", "CASE", ... but end of input found.'
  e.location; //=> { start: { offset: 21, line: 1, column: 22 }, end: { offset: 21, line: 1, column: 22 } }
}
```

When you only need to know whether something parses, use `maybeParse`, which returns `undefined` instead of throwing:

```js
SqlExpression.maybeParse('x + 1'); //=> SqlMulti
SqlExpression.maybeParse('x +'); //=> undefined
SqlQuery.maybeParse('FROM t |> LIMIT 1'); //=> undefined (it parses, but is not a SqlQuery)
```

A common pattern is to enable query-editing features only when the user's text parses:

```js
const parsedQuery = SqlQuery.maybeParse(queryString);
const canFilterFromResults = Boolean(parsedQuery && parsedQuery.hasFrom());
```

## Leading `SET` statements

Druid lets a query start with `SET key = value;` statements that set the query context. They parse as part of the query (see [`getContext` and `changeContext`](queries.md#context-set-statements)). When the rest of the text may not parse, `SqlSetStatement` has helpers that work on the raw text:

```js
import { SqlSetStatement } from 'druid-query-toolkit';

const text = `SET sqlTimeZone = 'Asia/Tokyo';\nSELECT some unparsable stuff`;

SqlSetStatement.getContextFromText(text); //=> { sqlTimeZone: 'Asia/Tokyo' }
SqlSetStatement.setContextInText(text, { useCache: false });
//=> "SET useCache = FALSE;\nSELECT some unparsable stuff"
SqlSetStatement.partitionSetStatements(text); //=> ["SET sqlTimeZone = 'Asia/Tokyo';", "\nSELECT some unparsable stuff"]
```

## Not supported

The parser covers Druid SQL broadly, but a few constructs do not parse yet:

- `(a, b) IN (subquery)`
- `TABLE t` anywhere but as a whole query or a sub-query: `EXPLAIN PLAN FOR TABLE t`, `INSERT INTO dst TABLE t PARTITIONED BY ALL`, `TABLE a UNION ALL TABLE b` and `WITH x AS (...) TABLE x`

<hr>

[**Next**: 🧱 Building SQL](building.md)\
[**Top**: Table of contents](README.md)
