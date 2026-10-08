# 🧱 Building SQL

There are three ways to make new nodes: parse a string, use the shortcuts (`C`, `T`, `N`, `L`, `F`), or use the `sql` template tag. They all produce the same kind of objects and can be mixed freely.

## Why not concatenate strings?

String concatenation breaks as soon as a name or a value contains something special:

```js
const table = 'wikipedia edits';
const author = "O'Reilly";

`SELECT * FROM ${table} WHERE author = '${author}'`;
//=> SELECT * FROM wikipedia edits WHERE author = 'O'Reilly'   (broken SQL, and an injection risk)
```

The shortcuts quote identifiers and escape literals for you:

```js
import { C, SqlQuery, T } from 'druid-query-toolkit';

String(SqlQuery.selectStarFrom(T(table)).addWhere(C('author').equal(author)));
```

```sql
SELECT *
FROM "wikipedia edits"
WHERE "author" = 'O''Reilly'
```

## Shortcuts

### C(name)

A column reference, `SqlColumn`. `C(name)` always quotes. `C.optionalQuotes(name)` quotes only when needed.

```js
C('channel'); //=> "channel"
C('my "col"'); //=> "my ""col"""
C.optionalQuotes('channel'); //=> channel
C.optionalQuotes('value'); //=> "value"  (a reserved keyword)
```

For a table qualified column, use `SqlColumn.create(name, table)` or `T(table).column(name)`:

```js
SqlColumn.create('page', 'wikipedia'); //=> "wikipedia"."page"
SqlColumn.optionalQuotes('page', 'w'); //=> w.page
T('wikipedia').column('page'); //=> "wikipedia"."page"
```

### T(name)

A table reference, `SqlTable`. Use `SqlTable.create(name, namespace)` or `N(namespace).table(name)` for a table in a schema other than the default `druid` one:

```js
T('wikipedia'); //=> "wikipedia"
T.optionalQuotes('wikipedia'); //=> wikipedia
SqlTable.create('segments', 'sys'); //=> "sys"."segments"
N('sys').table('segments'); //=> "sys"."segments"
T('wikipedia').star(); //=> "wikipedia".*
```

### N(name)

A namespace (schema) reference, `SqlNamespace`, as in `N('sys')` or `N('lookup')`.

### L(value)

A literal, `SqlLiteral`. It takes a string, number, bigint, boolean, `null` or `Date`:

```js
L("it's"); //=> 'it''s'
L(3.14); //=> 3.14
L(10n); //=> 10
L(false); //=> FALSE
L(null); //=> NULL
L(new Date('2024-05-01T12:30:00Z')); //=> TIMESTAMP '2024-05-01 12:30:00'
L.TRUE; L.FALSE; L.NULL; // constants
```

Other literal factories live on `SqlLiteral`:

```js
SqlLiteral.index(0); //=> 1  (a 1-based column reference in GROUP BY / ORDER BY, from a 0-based index)
SqlLiteral.direct('DAY'); //=> DAY  (printed exactly as given)
SqlLiteral.double(1); //=> 1.0
SqlLiteral.maybe(value); // a literal, or undefined when the value can not be one
```

Most methods that take a value also take a plain JavaScript value and wrap it with `L` for you, so `C('x').equal(5)` works as well as `C('x').equal(L(5))`.

### F(name, ...args)

A function call, `SqlFunction`. Arguments can be expressions or plain values. Trailing `undefined` arguments are dropped, which makes optional arguments easy:

```js
F('LOWER', C('page')); //=> LOWER("page")
F('TIME_FLOOR', C('__time'), 'PT1H'); //=> TIME_FLOOR("__time", 'PT1H')
F('TIME_FLOOR', C('__time'), 'PT1H', undefined, undefined); //=> TIME_FLOOR("__time", 'PT1H')
F('TIME_FLOOR', C('__time'), 'PT1H', undefined, 'America/New_York');
//=> TIME_FLOOR("__time", 'PT1H', NULL, 'America/New_York')
```

`F` also has helpers for the common functions:

| Helper | Example | Result |
| --- | --- | --- |
| `F.count(ex?)` | `F.count()` | `COUNT(*)` |
| `F.countDistinct(ex)` | `F.countDistinct(C('user'))` | `COUNT(DISTINCT "user")` |
| `F.sum(ex)`, `F.min(ex)`, `F.max(ex)`, `F.avg(ex)` | `F.sum(C('added'))` | `SUM("added")` |
| `F.cast(ex, type)` | `F.cast(C('x'), 'VARCHAR')` | `CAST("x" AS VARCHAR)` |
| `F.floor(ex, unit)` | `F.floor(C('__time'), 'HOUR')` | `FLOOR("__time" TO HOUR)` |
| `F.timeFloor(ex, period, origin?, tz?)` | `F.timeFloor(C('__time'), 'PT1H')` | `TIME_FLOOR("__time", 'PT1H')` |
| `F.timeCeil(ex, period, origin?, tz?)` | `F.timeCeil(C('__time'), 'P1D')` | `TIME_CEIL("__time", 'P1D')` |
| `F.timeShift(ex, period, step, tz?)` | `F.timeShift(C('__time'), 'P1D', -1)` | `TIME_SHIFT("__time", 'P1D', -1)` |
| `F.stringFormat(format, ...args)` | `F.stringFormat('%s-%s', C('a'), C('b'))` | `STRING_FORMAT('%s-%s', "a", "b")` |
| `F.array(...values)` | `F.array('a', 'b')` | `ARRAY['a', 'b']` |
| `F.regexpLike(ex, pattern)` | `F.regexpLike(C('page'), '^Druid')` | `REGEXP_LIKE("page", '^Druid')` |
| `F.jsonValue(ex, path, type?)` | `F.jsonValue(C('attrs'), '$.color')` | `JSON_VALUE("attrs", '$.color')` |
| `F.jsonObject(object)` | `F.jsonObject({ channel: C('channel'), n: 1 })` | `JSON_OBJECT('channel':"channel", 'n':1)` |

For a decorated call use `SqlFunction.decorated('COUNT', 'DISTINCT', [C('user')])`, and `SqlFunction.COUNT_STAR` is a ready made `COUNT(*)`.

## Other factories

```js
SqlQuery.selectStarFrom(T('wikipedia')); //=> SELECT * FROM "wikipedia"
SqlQuery.from(T('wikipedia')); // no select expressions yet (prints as SELECT ...), add them next
SqlCase.ifThenElse(C('added').greaterThan(0), L('added'), L('removed'));
//=> CASE WHEN "added" > 0 THEN 'added' ELSE 'removed' END
SqlInterval.create('DAY', 7); //=> INTERVAL '7' DAY
SqlType.create('BIGINT'); // also SqlType.VARCHAR, SqlType.BIGINT, SqlType.TIMESTAMP, ...
SqlStar.PLAIN; //=> *
SqlOrderByExpression.create(C('x'), 'DESC'); //=> "x" DESC
SqlJoinPart.create('LEFT', T('countries'), C('iso').equal(C('code')));
SqlPlaceholder.PLACEHOLDER; //=> ?
```

`SqlQuery.from` and `SqlQuery.selectStarFrom` take a table name, any expression (usually a `SqlTable`, or a sub-query with an alias) or a `SqlFromClause`. A sub-query given to them is used as is. If it starts with `SET` statements, they are moved to the new outer query, where Druid expects them:

```js
const inner = SqlQuery.parse(`SET sqlTimeZone = 'Asia/Tokyo';\nSELECT channel, COUNT(*) AS cnt FROM wikipedia GROUP BY 1`);

String(SqlQuery.from(inner.as('t')).changeSelectExpressions([C('channel')]).addWhere(C('cnt').greaterThan(10)));
```

```sql
SET sqlTimeZone = 'Asia/Tokyo';
SELECT "channel"
FROM (SELECT channel, COUNT(*) AS cnt FROM wikipedia GROUP BY 1) AS "t"
WHERE "cnt" > 10
```

## The `sql` template tag

The `sql` tag parses a template string into a `SqlExpression`. Interpolated values are made safe based on where they appear:

- `${x}` on its own: an expression is inserted as is, anything else becomes a literal (with `L`).
- `"${x}"` inside double quotes: the value becomes a quoted identifier, with any `"` escaped.
- `'${x}'` inside single quotes: the value becomes a string literal, with any `'` escaped.

```js
import { C, sql, T } from 'druid-query-toolkit';

const table = 'wikipedia edits';
const author = "O'Reilly";

sql`SELECT * FROM ${T(table)} WHERE ${C('author')} = ${author}`;
//=> SELECT * FROM "wikipedia edits" WHERE "author" = 'O''Reilly'

sql`SELECT * FROM "${table}" WHERE author = '${author}'`;
//=> SELECT * FROM "wikipedia edits" WHERE author = 'O''Reilly'

sql`MAX_DATA_TIME() - INTERVAL '14' DAY <= __time`; // an expression, ready for addWhere
```

A quote on only one side of an interpolation throws (`Expression "x" is not evenly wrapped in double quotes`), as does a value that can not be a literal (such as an array). The result is typed as `SqlExpression`; wrap it with `SqlQuery.parse(...)` when you need a `SqlQuery`:

```js
const query = SqlQuery.parse(sql`SELECT MAX(__time) AS "maxTime" FROM ${T(table)}`);
```

## Templates with placeholders

Another way to build from a pattern is to parse SQL with `?` placeholders once and fill them in later with [`fillPlaceholders`](expressions.md#fillplaceholders). The web console builds its column tree queries this way:

```js
const STRING_QUERY = SqlQuery.parse(`SELECT
  ?
FROM ?
GROUP BY 1
ORDER BY 2 DESC`);

String(STRING_QUERY.fillPlaceholders([C('channel'), T('wikipedia')]));
```

```sql
SELECT
  "channel"
FROM "wikipedia"
GROUP BY 1
ORDER BY 2 DESC
```

<hr>

[**Next**: 🧮 Expressions](expressions.md)\
[**Top**: Table of contents](README.md)
