# 🏁 Getting started

## Install

```sh
npm install druid-query-toolkit
```

The package has no runtime dependencies and comes with TypeScript types. Besides the CommonJS build, it includes a browser bundle (`dist/index.global.js`) that exposes everything on a `druid` global.

## Parse, change, print

Everything starts with parsing a string of Druid SQL into a tree of immutable objects:

```js
import { C, SqlQuery } from 'druid-query-toolkit';

const query = SqlQuery.parse(`
SELECT
  channel,
  COUNT(*) AS "Count"
FROM wikipedia
GROUP BY 1
ORDER BY 2 DESC
`);
```

Printing the tree gives back exactly the text that was parsed, including whitespace, comments and keyword casing:

```js
String(query) === `
SELECT
  channel,
  COUNT(*) AS "Count"
FROM wikipedia
GROUP BY 1
ORDER BY 2 DESC
`; //=> true
```

Every change returns a new object and leaves the original alone. Only the part of the text that the change touches is rewritten:

```js
const filtered = query.addWhere(C('channel').equal('#en.wikipedia')).changeLimitValue(100);

console.log(String(filtered));
```

```sql
SELECT
  channel,
  COUNT(*) AS "Count"
FROM wikipedia
WHERE "channel" = '#en.wikipedia'
GROUP BY 1
ORDER BY 2 DESC
LIMIT 100
```

`query` itself is unchanged, so it is safe to keep it around (for example as an undo step).

## The two main types

- [`SqlExpression`](expressions.md) is the base class of every node that can stand where an expression can: a column, a literal, a function call, a comparison, `a AND b`, `x AS y`, and also a whole query (a sub-query is an expression).
- [`SqlQueryBase`](queries.md) extends `SqlExpression` and is the base class of every query statement: `SELECT` queries ([`SqlQuery`](select-queries.md)), [pipe syntax queries](pipe-syntax.md) (`SqlPipesQuery`), `WITH` queries, `VALUES` and `TABLE t`.

Both, and every other node, extend `SqlBase`, which provides the [tree walking](traversal.md) and [formatting](formatting.md) methods.

## Building SQL from code

You rarely need to write SQL strings by hand for the parts you add. The [shortcuts](building.md) `C` (column), `T` (table), `L` (literal), `F` (function) and the `sql` template tag build correctly quoted and escaped nodes:

```js
import { C, F, SqlLiteral, SqlQuery, T } from 'druid-query-toolkit';

const query = SqlQuery.from(T('wikipedia'))
  .changeSelectExpressions([C('channel'), F.count().as('Count')])
  .changeGroupByExpressions([SqlLiteral.index(0)]);

console.log(String(query));
```

```sql
SELECT
  "channel",
  COUNT(*) AS "Count"
FROM "wikipedia"
GROUP BY 1
```

Generated nodes get a default layout. Once you have a query, you edit it the same way whether it was parsed or built.

## A mental model

- Parse the text the user wrote (or generate a query), keep it as a tree.
- React to user actions (clicking a cell, sorting a column, picking a time range) by calling `change*`, `add*` and `remove*` methods.
- Print the new tree with `toString()`, and show it to the user or send it to Druid.

Because the output of each step is text the user recognizes, the query stays theirs. See [Text preservation](text-preservation.md) for why that matters so much.

<hr>

[**Next**: ✍️ Text preservation](text-preservation.md)\
[**Top**: Table of contents](README.md)
