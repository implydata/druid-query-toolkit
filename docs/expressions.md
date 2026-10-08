# 🧮 Expressions

`SqlExpression` is the base class of everything that can appear where SQL expects an expression. Its methods are the building blocks for most edits: they make comparisons, combine filters, take filters apart, set aliases and fill in templates. They all return new objects.

The examples below assume:

```js
import { C, F, L, SqlComparison, SqlExpression, SqlFunction, SqlType } from 'druid-query-toolkit';
```

## Comparisons

Every comparison takes either an expression or a plain value (which is wrapped with `L`):

```js
C('channel').equal('#en.wikipedia'); //=> "channel" = '#en.wikipedia'
C('channel').unequal('#en.wikipedia'); //=> "channel" <> '#en.wikipedia'
C('added').greaterThan(100); //=> "added" > 100
C('added').greaterThanOrEqual(100); //=> "added" >= 100
C('added').lessThan(C('deleted')); //=> "added" < "deleted"
C('added').lessThanOrEqual(100); //=> "added" <= 100

C('country').isNull(); //=> "country" IS NULL
C('country').isNotNull(); //=> "country" IS NOT NULL
C('x').isDistinctFrom(C('y')); //=> "x" IS DISTINCT FROM "y"
C('x').isNotDistinctFrom(null); //=> "x" IS NOT DISTINCT FROM NULL

C('country').in(['US', 'UK']); //=> "country" IN ('US', 'UK')
C('country').notIn(['US', 'UK']); //=> "country" NOT IN ('US', 'UK')

C('page').like('%Druid%'); //=> "page" LIKE '%Druid%'
C('page').like('a\\_%', '\\'); //=> "page" LIKE 'a\_%' ESCAPE '\'

C('added').between(1, 5); //=> "added" BETWEEN 1 AND 5
C('added').notBetween(1, 5); //=> "added" NOT BETWEEN 1 AND 5
C('added').betweenSymmetric(5, 1); //=> "added" BETWEEN SYMMETRIC 5 AND 1
C('added').notBetweenSymmetric(5, 1); //=> "added" NOT BETWEEN SYMMETRIC 5 AND 1
```

`Date` values become `TIMESTAMP` literals:

```js
C('__time').between(new Date('2024-01-01'), new Date('2024-02-01'));
//=> "__time" BETWEEN TIMESTAMP '2024-01-01' AND TIMESTAMP '2024-02-01'
```

The same constructors exist as static methods on `SqlComparison` (`SqlComparison.equal(lhs, rhs)`, ..., plus `SqlComparison.notLike`).

## Negation

`not()` always wraps in `NOT`. `negate()` produces the logical opposite in the most natural form, flipping an operator when it can:

```js
C('x').equal(1).not(); //=> NOT ("x" = 1)
C('x').equal(1).negate(); //=> "x" <> 1
C('x').in(['a', 'b']).negate(); //=> "x" NOT IN ('a', 'b')
C('x').like('a%').negate(); //=> "x" NOT LIKE 'a%'
C('x').isNull().negate(); //=> "x" IS NOT NULL
C('x').not().negate(); //=> "x"
```

## Combining with AND and OR

`and` and `or` exist as instance methods and as static methods. The static forms are the most useful for building filters, because they skip `undefined`, drop no-op `TRUE` (for `AND`) or `FALSE` (for `OR`), flatten nested lists and return a single argument unchanged:

```js
SqlExpression.and(C('a').equal(1), undefined, C('b').greaterThan(2)); //=> "a" = 1 AND "b" > 2
SqlExpression.and(L.TRUE, C('a').equal(1)); //=> "a" = 1
SqlExpression.and(C('a').equal(1)); //=> "a" = 1
SqlExpression.and(); //=> TRUE
SqlExpression.or(); //=> FALSE

C('a').equal(1).or(C('b').equal(2)).and(C('c').equal(3));
//=> ("a" = 1 OR "b" = 2) AND "c" = 3
```

Parentheses are added where precedence needs them, as in the last example.

This makes it easy to build a filter from optional parts:

```js
const where = SqlExpression.and(
  channel ? C('channel').equal(channel) : undefined,
  onlyHumans ? C('isRobot').equal(false) : undefined,
  minAdded != null ? C('added').greaterThanOrEqual(minAdded) : undefined,
);
```

## Taking filters apart

A filter is usually a list of conditions joined by `AND`. `decomposeViaAnd()` gives you that list, and `decomposeViaOr()` does the same for `OR`:

```js
const where = SqlExpression.parse(`channel = '#en' AND (isRobot OR user LIKE 'Bot%') AND added > 0`);

where.decomposeViaAnd();
//=> [channel = '#en', isRobot OR user LIKE 'Bot%', added > 0]

where.decomposeViaAnd({ preserveParens: true });
//=> [channel = '#en', (isRobot OR user LIKE 'Bot%'), added > 0]
```

Something that is not an `AND` decomposes into a list of just itself, so you can call it on any filter. Pass `{ flatten: true }` to also split nested `AND`s.

`filterAnd(fn)` keeps the parts of an `AND` for which `fn` returns true, and returns `undefined` when nothing is left. `removeColumnFromAnd(column)` removes every part that mentions the column:

```js
where.filterAnd(ex => !ex.containsColumnName('added'));
//=> channel = '#en' AND (isRobot OR user LIKE 'Bot%')

where.removeColumnFromAnd('user'); //=> channel = '#en' AND added > 0
SqlExpression.parse('a = 1').removeColumnFromAnd('a'); //=> undefined
```

Together these let a UI treat a filter as a list of clauses. For example, when a user clicks "filter on this value" for a column that already has an `=` filter, the web console turns it into an `IN`:

```js
function addValueToFilter(where: SqlExpression, column: string, value: string): SqlExpression {
  const clauses = where.decomposeViaAnd();
  const existing = clauses.find(
    c => c instanceof SqlComparison && c.op === '=' && c.lhs.equals(C(column)),
  );
  if (!existing) return SqlExpression.and(where, C(column).equal(value));

  return SqlExpression.and(
    ...clauses.map(c => (c === existing ? existing.lhs.in([existing.rhs, L(value)]) : c)),
  );
}

addValueToFilter(SqlExpression.parse(`"channel" = '#en' AND added > 0`), 'channel', '#fr');
//=> "channel" IN ('#en', '#fr') AND added > 0
```

## Arithmetic and concatenation

```js
C('added').add(C('deleted')); //=> "added" + "deleted"
C('a').subtract(C('b'), L(1)); //=> "a" - "b" - 1
C('a').multiply(C('b').add(L(1))); //=> "a" * ("b" + 1)
C('a').divide(L(2)); //=> "a" / 2
SqlExpression.concat(C('a'), L('-'), C('b')); //=> "a" || '-' || "b"
```

## Casting

```js
C('x').cast('BIGINT'); //=> CAST("x" AS BIGINT)
C('x').cast(SqlType.VARCHAR); //=> CAST("x" AS VARCHAR)
```

## Aliases and output names

A select expression like `LOWER(page) AS "page"` is a `SqlAlias` wrapping `LOWER(page)`. Several methods help you edit the expression without losing its name:

```js
const selectExpression = SqlExpression.parse(`LOWER(page) AS "page"`);

selectExpression.getOutputName(); //=> 'page'
selectExpression.getUnderlyingExpression(); //=> LOWER(page)
```

- `as(alias)` always adds an alias: `F.count().as('Count')` gives `COUNT(*) AS "Count"`. Pass `true` as a second argument to force quotes.
- `setAlias(alias)` sets the alias, or removes it when `alias` is `undefined`.
- `ifUnnamedAliasAs(alias)` adds an alias only if there is not one already: `C('x').add(L(1)).ifUnnamedAliasAs('z')` gives `"x" + 1 AS "z"`, while `C('x').as('q').ifUnnamedAliasAs('z')` stays `"x" AS "q"`.
- `getOutputName()` is the name the column will have in the result: the alias, or the column name for a bare column, or `undefined` for an unnamed expression (Druid calls those `EXPR$0`, `EXPR$1`, ...).
- `getUnderlyingExpression()` strips the alias, and `changeUnderlyingExpression(ex)` replaces what is under it.

The web console's "Cast to..." action on a result column header is a one liner with these:

```js
query.changeSelect(
  headerIndex,
  selectExpression.getUnderlyingExpression().cast('VARCHAR').setAlias(selectExpression.getOutputName()),
);
//=> CAST(LOWER(page) AS VARCHAR) AS "page"
```

## fillPlaceholders

`fillPlaceholders(values)` replaces the `?` placeholders in order. Values can be expressions or plain values. Placeholders beyond the given values stay:

```js
SqlExpression.parse('x = ? AND y IN (?, ?)').fillPlaceholders(['a', 2, C('z')]);
//=> x = 'a' AND y IN (2, "z")

const LATEST_DAY = SqlExpression.parse(`? >= CURRENT_TIMESTAMP - INTERVAL '1' DAY`);
LATEST_DAY.fillPlaceholders([C('__time')]);
//=> "__time" >= CURRENT_TIMESTAMP - INTERVAL '1' DAY
```

Parse the template once and fill it many times. It is a readable way to keep SQL shaped snippets in your code.

## Time intervals

`SqlExpression.fromTimeExpressionAndInterval(time, interval)` turns an ISO interval (or a list of them) into a half open range filter:

```js
SqlExpression.fromTimeExpressionAndInterval(C('__time'), '2024-01-01/2024-02-01');
//=> TIMESTAMP '2024-01-01' <= "__time" AND "__time" < TIMESTAMP '2024-02-01'
```

A list of intervals becomes an `OR` of ranges.

## Filtered aggregations

`addFilterToAggregations(filter, knownAggregations)` pushes a filter into every aggregation call of a measure, using `FILTER (WHERE ...)`. Pass the names of the functions that count as aggregations:

```js
SqlExpression.parse('COUNT(*) * 1.0 / SUM(x)').addFilterToAggregations(C('isRobot').equal(false), [
  'COUNT',
  'SUM',
]);
//=> COUNT(*) FILTER (WHERE "isRobot" = FALSE) * 1.0 / SUM(x) FILTER (WHERE "isRobot" = FALSE)
```

It throws `column reference outside aggregation` if a column is used outside any aggregation, since such an expression can not be filtered this way. On a single `SqlFunction`, `addWhere(...)` does the same thing directly: `F.sum(C('added')).addWhere(C('channel').equal('#en'))` gives `SUM("added") FILTER (WHERE "channel" = '#en')`.

## ORDER BY expressions

`toOrderByExpression(direction?)` wraps an expression for use in `ORDER BY`:

```js
query.changeOrderByExpression(C('edits').toOrderByExpression('DESC'));
```

## Reading specific kinds of expression

Narrow with `instanceof` and then use the class's own accessors:

| Class | Useful members |
| --- | --- |
| `SqlColumn` | `getName()`, `changeName(name)`, `getTableName()`, `changeTableName(name)`, `changeTable(table)` |
| `SqlLiteral` | `value`, `getStringValue()`, `getNumberValue()`, `getDateValue()`, `isIndex()`, `getIndexValue()`, `SqlLiteral.isTrue(ex)` |
| `SqlFunction` | `getEffectiveFunctionName()` (upper case), `getEffectiveDecorator()`, `numArgs()`, `getArg(i)`, `getArgArray()`, `getArgAsString(i)`, `getArgAsNumber(i)`, `changeArg(i, ex)`, `changeArgs(args)`, `getWhereExpression()`, `addWhere(...)`, `isCountStar()`, `getCastType()` |
| `SqlComparison` | `op`, `lhs`, `rhs`, `changeLhs(ex)`, `changeRhs(ex)`, `negate()`, `getLikeMatchPattern()` |
| `SqlMulti` (`AND`, `OR`, `+`, ...) | `op`, `numArgs()`, `getArg(i)`, `getArgArray()`, `changeArgs(args)` |
| `SqlUnary` (`NOT`, `-`) | `op`, `argument`, `changeArgument(ex)` |
| `SqlAlias` | `getAliasName()`, `changeAlias(name)`, `expression`, `changeExpression(ex)` |
| `SqlCase` | `caseExpression`, `whenThenParts`, `elseExpression` |

```js
const ex = SqlExpression.parse(`APPROX_QUANTILE_DS("added", 0.98)`);
if (ex instanceof SqlFunction && ex.getEffectiveFunctionName() === 'APPROX_QUANTILE_DS') {
  ex.getArgAsNumber(1); //=> 0.98
  ex.changeArg(1, L(0.5)); //=> APPROX_QUANTILE_DS("added", 0.5)
}
```

Expressions also have all the tree methods from `SqlBase`, such as `walk`, `some`, `getUsedColumnNames` and `containsColumnName`. See [Walking the tree](traversal.md).

<hr>

[**Next**: 🌳 Walking the tree](traversal.md)\
[**Top**: Table of contents](README.md)
