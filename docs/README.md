# Druid Query Toolkit documentation

Druid Query Toolkit parses [Druid SQL](https://druid.apache.org/docs/latest/querying/sql) into an immutable tree that keeps every space, comment and keyword spelling, so a program can edit a query the way a person would: change one clause and leave the rest as written.

```js
import { C, SqlQuery } from 'druid-query-toolkit';

SqlQuery.parse(`SELECT channel, COUNT(*) AS "Count" FROM wikipedia GROUP BY 1`)
  .addWhere(C('channel').equal('#en.wikipedia'))
  .changeLimitValue(10)
  .toString();
//=> SELECT channel, COUNT(*) AS "Count" FROM wikipedia
//   WHERE "channel" = '#en.wikipedia' GROUP BY 1
//   LIMIT 10
```

The new `WHERE` goes on its own line, and `GROUP BY 1` stays where it was, right after the gap it had before.

## Table of contents

### Basics

- 🏁 [Getting started](getting-started.md)
- ✍️ [Text preservation](text-preservation.md): why the library keeps the user's text, and how
- 📖 [Parsing](parsing.md): the parse methods, what they return, and errors
- 🧱 [Building SQL](building.md): `C`, `T`, `L`, `F`, the `sql` tag and templates

### Working with the tree

- 🧮 [Expressions](expressions.md): comparisons, `AND`/`OR`, taking filters apart, aliases, placeholders
- 🌳 [Walking the tree](traversal.md): questions about a query, `walk` and friends
- 📜 [Queries](queries.md): what every query has (context, `EXPLAIN`, `INSERT`/`REPLACE`, `ORDER BY`, `LIMIT`, `UNION ALL`)
- 🔎 [SELECT queries](select-queries.md): select list, `FROM` and joins, `WHERE`, `GROUP BY`, `HAVING`, `WITH`
- 🚰 [Pipe syntax](pipe-syntax.md): `FROM t |> WHERE ...` queries and `unpipe()`
- 💅 [Formatting and comparing](formatting.md): `prettify`, capitalization, equality, parentheses, spacing

### Use cases

- 🖱️ [Editing queries from UI actions](use-case-ui-edits.md): the Druid web console's result table and column tree actions
- 🛡️ [Validating user input](use-case-validation.md): checking formulas before they go into generated queries
- 🔁 [Rewriting queries](use-case-rewriting.md): expanding macros into joins, adding mandatory filters

### Beyond SQL

- 📦 [Running queries and results](results.md): `QueryRunner`, `QueryResult`, introspection, filter patterns

### Reference

- 📚 [API reference](api.md)

## More examples

The unit tests (`src/**/*.spec.ts`) cover every method and are a good source of examples. The largest real world user is the [Druid web console](https://github.com/apache/druid/tree/master/web-console/src), especially its [query view](https://github.com/apache/druid/tree/master/web-console/src/views/workbench-view) and [explore view](https://github.com/apache/druid/tree/master/web-console/src/views/explore-view).
