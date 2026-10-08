# ✍️ Text preservation

## Why it matters

The main user of this library is the query view of the [Druid web console](https://druid.apache.org/docs/latest/operations/web-console). There, a person types a query, runs it, and then keeps refining it, partly by typing and partly by clicking on the results: filtering on a value, sorting by a column, removing a column, changing the time range, adding a `LIMIT`.

Each click has to turn into an edit of *their* query. If the edit reformatted the whole query, the user would lose their layout, their comments and their casing on every click, and could no longer tell what the click actually changed. So the rule is:

> A transformation changes only what it touches.

## How it works

The parser keeps every piece of the source text on the tree:

- the whitespace and comments between tokens (in each node's `spacing`),
- the exact spelling of keywords, like `select` vs `SELECT` or `LEFT OUTER JOIN` (in each node's `keywords`),
- the separators between list items, like `,\n  ` (in `SeparatedArray`),
- parentheses and the spacing inside them (in `parens`),
- the quoting of identifiers, like `channel` vs `"channel"` (in `RefName`).

`toString()` puts all of it back, so for anything the parser accepts:

```js
SqlExpression.parse(sql).toString() === sql; //=> always true
```

## What an edit looks like

Take a query written in lower case with comments:

```js
import { C, SqlQuery } from 'druid-query-toolkit';

const query = SqlQuery.parse(`-- Edits per channel in the last day
select
  channel,
  count(*) as edits  -- all edits, bots included
from wikipedia
where __time >= current_timestamp - interval '1' day
group by 1
order by edits desc
limit 50`);

const withFilter = query.addWhere(C('isRobot').equal(false));
console.log(String(withFilter));
```

```sql
-- Edits per channel in the last day
select
  channel,
  count(*) as edits  -- all edits, bots included
from wikipedia
where __time >= current_timestamp - interval '1' day AND "isRobot" = FALSE
group by 1
order by edits desc
limit 50
```

Only the `where` line changed. The comments, the lower case keywords and the layout are all still there. Removing the filter again gives back the original text exactly:

```js
String(withFilter.removeColumnFromWhere('isRobot')) === String(query); //=> true
```

## Text that the library writes

New nodes (the ones you build with [`C`, `L`, `F`, ...](building.md) or add with methods like `addWhere`) are printed in a default style:

- Keywords come out in upper case. Call `SqlBase.setCapitalization('lower')` (or `'title'`, or `'upper'` to go back) to change the casing used for new keywords globally. Keywords that were parsed keep their spelling either way.
- Identifiers built with `C(...)`, `T(...)` and `.as(...)` are always quoted (`"isRobot"`). Use `C.optionalQuotes(...)`, `T.optionalQuotes(...)` and friends to quote only when the name needs it (`isRobot` stays bare, `value`, `my col` and `1x` get quoted because they are reserved or not plain identifiers).
- New clauses start on a new line. A new list item reuses the separator already used in the list it joins, so a one-per-line `SELECT` list stays one-per-line and `a, b` becomes `a, b, c`. A list that had a single item has no separator to copy and gets `,\n  `.

When you need a whole query in the default style (for example to show generated SQL), use [`prettify()`](formatting.md).

## Things to know

- **Comments live in the gaps.** A comment belongs to the whitespace between two tokens. It stays in that gap when things around it change. If you insert a new item at the end of a list, it goes before the gap that follows the list, so a trailing `-- comment` after the last select item ends up after the new item.
- **Equality is textual.** `a.equals(b)` compares printed text, so `x=1` and `x = 1` are not equal. Use `logicalEquals` to compare ignoring whitespace and keyword casing, see [Formatting](formatting.md).
- **Identity is often preserved.** Many methods return the same object when they have nothing to do: a `walk` that replaces nothing, `removeColumnFromWhere` on a column that is not filtered, `addWhere()` with no arguments, `changeOrderByClause(undefined)` on a query without `ORDER BY`. This is handy for skipping work, but it is not guaranteed for every method (`changeLimitValue(5)` on a query that already has `LIMIT 5` builds a new object), so compare with `equals` when it matters.

<hr>

[**Next**: 📖 Parsing](parsing.md)\
[**Top**: Table of contents](README.md)
