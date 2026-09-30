# 💅 Formatting and comparing

By default the library [keeps text as written](text-preservation.md). When you do want to reformat, these methods are on every node (they come from `SqlBase`).

## prettify(options?)

`prettify()` throws away all the original whitespace, comments and keyword spelling, and prints the tree in the default style:

```js
import { C, SqlBase, SqlExpression, SqlQuery } from 'druid-query-toolkit';

const query = SqlQuery.parse(
  `select  channel,count(*) as cnt from   wikipedia where isRobot=false and(countryName='US' or countryName = 'UK' and cityName is not null) group by 1 order by 2 desc limit 10`,
);

console.log(String(query.prettify()));
```

```sql
SELECT
  channel,
  COUNT(*) AS cnt
FROM wikipedia
WHERE isRobot = FALSE AND (countryName = 'US' OR (countryName = 'UK' AND cityName IS NOT NULL))
GROUP BY 1
ORDER BY 2 DESC
LIMIT 10
```

Options:

- `keywordCasing: 'preserve'` keeps the casing of the keywords as they were written (their inner whitespace is still normalized).
- `clarifyingParens: 'disable'` skips adding parentheses around an `AND` nested in an `OR` (or the other way round). By default they are added, as in `(countryName = 'UK' AND cityName IS NOT NULL)` above, because precedence between the two is easy to misread.

```js
query.prettify({ keywordCasing: 'preserve' });
```

```sql
select
  channel,
  count(*) as cnt
from wikipedia
where isRobot = false and (countryName = 'US' or (countryName = 'UK' and cityName is not null))
group by 1
order by 2 desc
limit 10
```

The web console has a "Prettify query" action that does exactly this. Note that comments are removed too, so offer it as an explicit action rather than doing it implicitly.

`addClarifyingParens()` adds only the clarifying parentheses, leaving everything else alone:

```js
SqlExpression.parse('a OR b AND c').addClarifyingParens(); //=> a OR (b AND c)
```

## prettyTrim(maxLength)

`prettyTrim` shortens long string literals and identifiers, which is useful for showing a query or a filter in a small space (a menu item, a tooltip). The result is for display only, not for running:

```js
SqlQuery.parse(
  `SELECT * FROM t WHERE page = 'An extremely long page title that goes on' AND x IN ('aaaaaaaaaaaaaaaaaaaaaaaaa')`,
).prettyTrim(12);
//=> SELECT * FROM t WHERE page = 'An extrem...' AND x IN ('aaaaaaaaa...')
```

## Keyword capitalization

`SqlBase.setCapitalization(style)` sets how *new* keywords are written, globally. `style` is `'upper'` (the default), `'lower'`, `'title'` or `'random'` (useful for testing that code does not depend on keyword casing):

```js
SqlBase.setCapitalization('title');
SqlQuery.selectStarFrom('t').addWhere(C('x').isNull());
//=> Select *
//   From "t"
//   Where "x" Is Null
SqlBase.setCapitalization('upper');
```

It affects keywords written by the library, whether from building nodes, adding clauses or `prettify()`. It never changes keywords that came from parsing (unless `prettify()` resets them).

## Comparing

- `a.equals(b)` is true when both nodes are of the same type and print the same text. Whitespace, comments and casing all count.
- `a.logicalEquals(b)` compares the prettified forms, so it ignores whitespace, comments, keyword casing and clarifying parentheses. Identifiers are still compared exactly, since column names are case sensitive.

```js
SqlExpression.parse('x=1').equals(SqlExpression.parse('x = 1')); //=> false
SqlExpression.parse('x=1').logicalEquals(SqlExpression.parse('x = 1')); //=> true
SqlExpression.parse('x=1').logicalEquals(SqlExpression.parse('X = 1')); //=> false
```

Methods that look for an expression, such as `contains`, `getOrderByForExpression` and `getSelectIndexForExpression`, use `equals`.

## Parentheses

```js
C('a').addParens(); //=> ("a")
C('a').ensureParens(); //=> ("a"), and does nothing if there already are parentheses
SqlExpression.parse('((a))').changeParens([]); //=> a
SqlExpression.parse('( a )').removeOwnParenSpaces(); //=> (a)
SqlExpression.parse('((a))').hasParens(); //=> true
```

The library adds the parentheses that precedence needs when it combines expressions (for example `C('a').equal(1).or(C('b').equal(2)).and(...)` wraps the `OR`), so you rarely need these directly. `ensureParens` is handy for a sub-query that you are about to embed.

## Spacing

Each node stores the whitespace (and comments) around its parts in named slots, which you can read and change:

```js
const query = SqlQuery.parse('SELECT *\nFROM t');
query.spacing; //=> { postSelect: ' ', preFromClause: '\n' }
query.getSpace('preFromClause'); //=> '\n'
query.changeSpace('preFromClause', '\n-- all rows\n');
//=> SELECT *
//   -- all rows
//   FROM t
```

Because comments live in these slots, `changeSpace` can also attach a comment to a query. `resetOwnSpacing()` resets a single node's slots (without touching its children), and `prettify()` does it for the whole tree.

## Helpers for chaining

Since everything is immutable and method based, edits read best as a chain. `SqlBase` has three helpers to keep conditional and repeated edits in the chain:

```js
query
  .applyIf(limit, q => q.changeLimitValue(limit)) // only when the condition is truthy
  .applyIf(
    sortDescending,
    q => q.changeOrderByExpression(C('__time').toOrderByExpression('DESC')),
    q => q.changeOrderByExpression(C('__time').toOrderByExpression('ASC')), // optional else
  )
  .applyForEach(requiredColumns, (q, column) => q.addWhere(C(column).isNotNull()))
  .apply(q => (q.hasGroupBy() ? q : q.changeLimitValue(100)));
```

<hr>

[**Next**: 🖱️ Editing queries from UI actions](use-case-ui-edits.md)\
[**Top**: Table of contents](README.md)
