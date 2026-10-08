# 🌳 Walking the tree

Every node extends `SqlBase`, which can visit all the nodes below it. That is how you answer questions about a query ("which columns does it use?") and how you make edits that are not tied to one clause ("rename this column everywhere").

The examples on this page use this query:

```js
import {
  F,
  L,
  SqlColumn,
  SqlExpression,
  SqlFunction,
  SqlPlaceholder,
  SqlQuery,
  SqlQueryBase,
  SqlTable,
} from 'druid-query-toolkit';

const query = SqlQuery.parse(`SELECT
  countryName,
  SUM(added) AS added
FROM wikipedia
WHERE page IN (SELECT page FROM sys.top_pages WHERE countryName IS NOT NULL)
GROUP BY 1`);
```

## Asking questions

```js
query.getUsedColumnNames(); //=> ['added', 'countryName', 'page']  (deduplicated and sorted)
query.getColumns(); //=> every SqlColumn node, in order, with repeats
query.getFirstColumnName(); //=> 'countryName'

query.getUsedTableNames(); //=> ['top_pages', 'wikipedia']
query.getTables(); //=> every SqlTable node
query.getFirstTableName(); //=> 'wikipedia'
query.getFirstSchema(); //=> 'sys'  (the first namespace used to qualify a table)

query.containsColumnName('page'); //=> true
query.containsFunction('sum'); //=> true  (the name is compared in upper case)
query.contains(SqlExpression.parse('SUM(added)')); //=> true  (compared with equals)
```

These all look inside sub-queries too.

## some, every, find and collect

For anything more specific, pass a predicate. It gets each node and the stack of its ancestors:

```js
query.some(ex => ex instanceof SqlQuery && ex !== query); //=> true, there is a sub-query
query.every(ex => !(ex instanceof SqlPlaceholder)); //=> true, no ? left to fill
query.find(ex => ex instanceof SqlTable); //=> the SqlTable wikipedia
query.collect(ex => ex instanceof SqlFunction); //=> [SUM(added)]
```

In TypeScript, `find` and `collect` take a type guard, so the result is typed:

```ts
const functions = query.collect((ex): ex is SqlFunction => ex instanceof SqlFunction);
const functionNames = functions.map(f => f.getEffectiveFunctionName()); //=> ['SUM']
```

`some` and `find` stop as soon as they have an answer.

## walk

`walk(fn)` visits every node from the top down and lets you replace any of them. `fn` returns:

- the same node, to keep it and continue into its children,
- a different node, to replace it (the walk does *not* continue into the replacement),
- `undefined`, to stop the whole walk. The walk then returns the original tree, dropping any replacements it had made.

```js
const renamed = query.walk(ex =>
  ex instanceof SqlColumn && ex.getName() === 'countryName' ? ex.changeName('country') : ex,
);
console.log(String(renamed));
```

```sql
SELECT
  country,
  SUM(added) AS added
FROM wikipedia
WHERE page IN (SELECT page FROM sys.top_pages WHERE country IS NOT NULL)
GROUP BY 1
```

The result has the same type as the node you started from, but it is typed as `SqlBase` (or `SqlExpression` when walking an expression), so cast it back: `query.walk(...) as SqlQuery`. If nothing was replaced, `walk` returns the very same object.

Because a replacement is not walked into, a node can safely be replaced by something that contains it:

```js
SqlExpression.parse('a + b').walk(ex => (ex instanceof SqlColumn ? F('ABS', ex) : ex));
//=> ABS(a) + ABS(b)
```

### walkPostorder

`walkPostorder(fn)` visits the children before their parent, so `fn` sees a parent after its children have already been replaced. Use it when a change to a parent depends on its (already changed) children, for example to simplify from the bottom up:

```js
const ex = SqlExpression.parse('a + b');
// walk visits:          multi, column, column
// walkPostorder visits: column, column, multi
```

### The stack

The second argument of every callback is the list of the node's ancestors, nearest first. `stack[0]` is the parent, and the last element is the node you called `walk` on. For the `added` column above, the stack is `[SUM(added), SUM(added) AS added, <the query>]`.

A common use is to leave sub-queries alone. Here only the outer query's `countryName` is renamed:

```js
query.walk((ex, stack) => {
  const inSubQuery = stack.some(s => s instanceof SqlQueryBase && s !== query);
  if (!inSubQuery && ex instanceof SqlColumn && ex.getName() === 'countryName') {
    return ex.changeName('country');
  }
  return ex;
});
```

Or to handle each sub-query with its own recursive call, as in [the macro rewriting example](use-case-rewriting.md), check `stack.length` to tell the root apart from nested queries.

## Replacing a function (macros)

`walk` is how the web console expands its `MAX_DATA_TIME()` macro before running a query:

```js
if (query.containsFunction('MAX_DATA_TIME')) {
  const maxTime = await getMaxTimeFor(query.getFirstTableName());
  query = query.walk(ex =>
    ex instanceof SqlFunction && ex.getEffectiveFunctionName() === 'MAX_DATA_TIME' ? L(maxTime) : ex,
  );
}
```

```sql
-- before
SELECT * FROM t WHERE __time > MAX_DATA_TIME() - INTERVAL '1' HOUR
-- after
SELECT * FROM t WHERE __time > TIMESTAMP '2024-05-01 12:00:00' - INTERVAL '1' HOUR
```

(`SqlQuery` has this one built in as `inlineMaxDataTime(maxTime)`.)

## Using a walk to validate

Since `walk` visits everything, it is also a simple way to check a user supplied expression and throw on the first thing that is not allowed. See [Validating user input](use-case-validation.md).

<hr>

[**Next**: 📜 Queries](queries.md)\
[**Top**: Table of contents](README.md)
