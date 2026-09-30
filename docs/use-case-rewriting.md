# 🔁 Rewriting queries

Sometimes a query has to change before it is sent to Druid, in ways the user should not have to write out by hand: expanding a macro into real SQL, adding a filter every query must have, pointing a query at a different table. Parse, [walk](traversal.md), edit and print, and the rewrite leaves everything else in the query as the user wrote it.

## Expanding a macro into a JOIN

Suppose a product lets people pull a value from a lookup table with a made up function:

```sql
JOIN_VALUE(key_expression, 'table', 'key_column', 'value_column')
```

meaning "the `value_column` of the row in `table` whose `key_column` equals `key_expression`". Druid does not know this function, so before running the query every call has to become a column of a `LEFT JOIN`ed table:

- replace each `JOIN_VALUE(...)` call with a reference to a joined column, `"j0"."value_column"`,
- add one `LEFT JOIN "table" AS "j0" ON key_expression = "j0"."key_column"` for each distinct table, key column and key expression, so two calls that read different columns of the same row share a join,
- handle each sub-query on its own, since a join belongs to the query whose `FROM` it extends.

```ts
import { SqlColumn, SqlExpression, SqlFunction, SqlQuery, T } from 'druid-query-toolkit';

const MACRO = 'JOIN_VALUE';

interface JoinInfo {
  joinKey: string;
  table: string;
  keyColumn: string;
  keyExpression: SqlExpression;
}

function expandJoinValue(query: SqlQuery): SqlQuery {
  const joins: JoinInfo[] = [];

  const rewritten = query.walk((ex, stack) => {
    // A nested query gets its own joins, so expand it with its own call
    if (ex instanceof SqlQuery && stack.length) return expandJoinValue(ex);

    if (!(ex instanceof SqlFunction) || ex.getEffectiveFunctionName() !== MACRO) return ex;

    if (ex.numArgs() !== 4) {
      throw new Error(`${MACRO} needs 4 arguments, got ${ex.numArgs()} in \`${ex}\``);
    }
    const keyExpression = ex.getArg(0)!;
    const [table, keyColumn, valueColumn] = [1, 2, 3].map(i => ex.getArgAsString(i));
    if (!table || !keyColumn || !valueColumn) {
      throw new Error(`arguments 2 to 4 of ${MACRO} must be string literals in \`${ex}\``);
    }

    // Calls that would produce the same join share it
    const joinKey = [table, keyColumn, String(keyExpression)].join('|');
    let joinIndex = joins.findIndex(j => j.joinKey === joinKey);
    if (joinIndex === -1) {
      joinIndex = joins.length;
      joins.push({ joinKey, table, keyColumn, keyExpression });
    }

    return SqlColumn.create(valueColumn, `j${joinIndex}`);
  }) as SqlQuery;

  return rewritten.applyForEach(joins, (q, join, i) =>
    q.addLeftJoin(
      T(join.table).as(`j${i}`),
      join.keyExpression.equal(SqlColumn.create(join.keyColumn, `j${i}`)),
    ),
  );
}
```

Given this query:

```sql
SELECT
  JOIN_VALUE(countryIsoCode, 'countries', 'iso', 'name') AS country,
  JOIN_VALUE(countryIsoCode, 'countries', 'iso', 'continent') AS continent,
  COUNT(*) AS edits
FROM wikipedia
WHERE JOIN_VALUE(channel, 'channel_owners', 'channel', 'team') = 'Growth'
GROUP BY 1, 2
ORDER BY 3 DESC
```

`expandJoinValue` returns:

```sql
SELECT
  "j0"."name" AS country,
  "j0"."continent" AS continent,
  COUNT(*) AS edits
FROM wikipedia
LEFT JOIN "countries" AS "j0" ON countryIsoCode = "j0"."iso"
LEFT JOIN "channel_owners" AS "j1" ON channel = "j1"."channel"
WHERE "j1"."team" = 'Growth'
GROUP BY 1, 2
ORDER BY 3 DESC
```

A few things make this work:

- **Preorder walk, replace and stop.** `walk` visits parents before children, and does not go into a node that the callback replaced. So the macro call is replaced as a whole, and a nested query, once handed to its own `expandJoinValue`, is not visited again by the outer walk.
- **`stack.length` tells the root apart.** The root query is visited with an empty stack. Any other `SqlQuery` is a sub-query.
- **Arguments are read by position.** `getArg(i)` returns the argument expression and `getArgAsString(i)` returns the value of a string literal argument (or `undefined` for anything else), which doubles as validation.
- **Unchanged queries stay the same object.** A query without the macro comes back as the very object that was passed in (`expandJoinValue(plain) === plain`), so a caller can skip any follow-up work cheaply.
- **Errors quote the user's text.** `` `${ex}` `` prints the call exactly as written, which makes the message easy to act on: ``JOIN_VALUE needs 4 arguments, got 3 in `JOIN_VALUE(x, 'a', 'b')` ``.

## Adding a filter every query must have

To make sure every read of a multi-tenant table is limited to one tenant, add a filter to every query, including sub-queries, whose `FROM` reads that table. `walkPostorder` handles the innermost queries first, and each query only has to look at its own `FROM`:

```ts
import { SqlAlias, SqlColumn, SqlQuery, SqlTable } from 'druid-query-toolkit';

function addTenantFilter(query: SqlQuery, table: string, tenantId: string): SqlQuery {
  return query.walkPostorder(ex => {
    if (!(ex instanceof SqlQuery)) return ex;

    const source = ex.getFromExpressions().find(f => {
      const underlying = f.getUnderlyingExpression();
      return underlying instanceof SqlTable && underlying.getName() === table;
    });
    if (!source) return ex;

    // Refer to the table the way this query does: by its alias if it has one
    const tableRef = source instanceof SqlAlias ? source.getAliasName() : table;
    return ex.addWhere(SqlColumn.optionalQuotes('tenant_id', tableRef).equal(tenantId));
  }) as SqlQuery;
}
```

```sql
-- before
SELECT e.page, COUNT(*) AS cnt
FROM events AS e
WHERE e.user IN (SELECT user FROM events WHERE action = 'signup')
GROUP BY 1

-- after addTenantFilter(query, 'events', 'acme')
SELECT e.page, COUNT(*) AS cnt
FROM events AS e
WHERE e.user IN (SELECT user FROM events WHERE action = 'signup' AND events.tenant_id = 'acme') AND e.tenant_id = 'acme'
GROUP BY 1
```

A real implementation would also look at joined tables (`getJoins()`) and at `WITH` parts.

## Renaming and re-scoping columns

Expression level rewrites are one `walk` each. (The rest of this page also uses `C`, `F`, `L`, `SqlComparison` and `SqlLiteral` from `druid-query-toolkit`.) The web console uses rewrites like these when a data source's columns are renamed, or when an expression written against one table is used in a query where that table has an alias:

```ts
function renameColumns(ex: SqlExpression, renames: Map<string, string>): SqlExpression {
  return ex.walk(x => {
    if (!(x instanceof SqlColumn)) return x;
    const newName = renames.get(x.getName());
    return newName ? x.changeName(newName) : x;
  }) as SqlExpression;
}

function scopeColumns(ex: SqlExpression, tableAlias: string): SqlExpression {
  return ex.walk(x =>
    x instanceof SqlColumn && !x.getTableName() ? x.changeTableName(tableAlias) : x,
  ) as SqlExpression;
}

scopeColumns(SqlExpression.parse(`channel = '#en' AND t2.x > 1`), 't');
//=> "t".channel = '#en' AND t2.x > 1
```

## Rewriting a construct into something equivalent

A rewrite can also replace one kind of node with an equivalent expression that a particular engine handles better. For example, to turn `a IS NOT DISTINCT FROM b` into a null safe equality using a sentinel value:

```ts
function rewriteNotDistinctFrom(ex: SqlExpression): SqlExpression {
  return ex.walk(x => {
    if (x instanceof SqlComparison && x.op === 'IS NOT DISTINCT FROM') {
      const nullSafe = (e: SqlExpression) => F('COALESCE', e.cast('VARCHAR'), L('__null__'));
      return nullSafe(x.lhs).equal(nullSafe(x.rhs as SqlExpression));
    }
    return x;
  }) as SqlExpression;
}

rewriteNotDistinctFrom(SqlExpression.parse(`country IS NOT DISTINCT FROM 'US'`));
//=> COALESCE(CAST(country AS VARCHAR), '__null__') = COALESCE(CAST('US' AS VARCHAR), '__null__')
```

## Wrapping a query

Some rewrites are easier from the outside: treat the user's query as a sub-query and build around it. `SqlQuery.from(query.as('t'))` does that (and moves any `SET` statements to the outside, where Druid expects them):

```ts
function topN(query: SqlQuery, column: string, n: number): SqlQuery {
  return SqlQuery.from(query.as('t'))
    .changeSelectExpressions([C(column), F.count().as('Count')])
    .changeGroupByExpressions([SqlLiteral.index(0)])
    .changeOrderByExpression(SqlLiteral.index(1).toOrderByExpression('DESC'))
    .changeLimitValue(n);
}

topN(SqlQuery.parse('SELECT * FROM wikipedia WHERE isRobot = FALSE'), 'channel', 5);
```

```sql
SELECT
  "channel",
  COUNT(*) AS "Count"
FROM (SELECT * FROM wikipedia WHERE isRobot = FALSE) AS "t"
GROUP BY 1
ORDER BY 2 DESC
LIMIT 5
```

For finding the output columns of any query without running it, `Introspect.getQueryColumnIntrospectionQuery(query)` wraps it as `SELECT * FROM (<query>) LIMIT 0`, see [Running queries](results.md#introspection).

<hr>

[**Next**: 📦 Running queries and results](results.md)\
[**Top**: Table of contents](README.md)
