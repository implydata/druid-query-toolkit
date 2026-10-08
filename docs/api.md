# 📚 API reference

This page lists the main classes and their methods with their signatures. The guide pages linked from each section explain them in context, with more examples.

Every method that returns a node returns a **new** node, and leaves the one it was called on unchanged. `this` in a return type means "the same class as the node it was called on".

- [Shortcuts](#shortcuts)
- [SqlBase](#sqlbase) (every node)
- [SqlExpression](#sqlexpression) (every expression and query)
- [SqlQueryBase](#sqlquerybase) (every query)
- [SqlQuery](#sqlquery) (`SELECT` queries)
- [SqlPipesQuery](#sqlpipesquery) (pipe syntax queries)
- [Other query classes](#other-query-classes)
- [Expression classes](#expression-classes)
- [Types](#types)

## Shortcuts

[More info.](building.md)

### C(name)

`name`: `string | SqlColumn`\
_Returns_: `SqlColumn`

A quoted column reference. `C.optionalQuotes(name)` only quotes when needed.

### T(name)

`name`: `string | SqlTable`\
_Returns_: `SqlTable`

A quoted table reference. `T.optionalQuotes(name)` only quotes when needed.

### N(name)

`name`: `string | SqlNamespace`\
_Returns_: `SqlNamespace`

A quoted namespace (schema) reference, like `N('sys')`. `N.optionalQuotes(name)` only quotes when needed, and `N(name).table(tableName)` makes a table in it.

### L(value)

`value`: [`LiteralValue`](#literalvalue) `| SqlLiteral`\
_Returns_: `SqlLiteral`

A literal. Constants: `L.NULL`, `L.TRUE`, `L.FALSE`.

### F(name, ...args)

`name`: `string`\
`args`: `(SqlExpression | LiteralValue | undefined)[]`\
_Returns_: `SqlFunction`

A function call. Trailing `undefined` arguments are dropped. Helpers: `F.count`, `F.countDistinct`, `F.sum`, `F.min`, `F.max`, `F.avg`, `F.cast`, `F.floor`, `F.timeFloor`, `F.timeCeil`, `F.timeShift`, `F.stringFormat`, `F.array`, `F.regexpLike`, `F.jsonValue`, `F.jsonObject`.

### sql\`...\`

_Returns_: `SqlExpression`

A template tag that parses its template, turning interpolations into literals (`${x}` and `'${x}'`), identifiers (`"${x}"`) or inserted expressions (`${expression}`).

## SqlBase

The base class of every node.

[More info.](traversal.md)

### SqlBase.parseSql(input)

`input`: `string | SqlBase`\
_Returns_: `SqlBase`

Parses anything the grammar accepts. Throws a `SyntaxError` with a `location` on invalid SQL.

### SqlBase.setCapitalization(capitalization)

`capitalization`: `'upper' | 'lower' | 'title' | 'random'`

Sets, globally, how new keywords are written. [More info.](formatting.md#keyword-capitalization)

### node.type

_Type_: `string`

The kind of node, such as `'column'`, `'function'`, `'query'` or `'pipesQuery'`.

### node.toString()

_Returns_: `string`

The SQL text. For a parsed node this is exactly the text it was parsed from. [More info.](text-preservation.md)

### node.equals(other)

`other`: `SqlBase | undefined`\
_Returns_: `boolean`

Whether both are the same type and print the same text.

### node.logicalEquals(other)

`other`: `SqlBase | undefined`\
_Returns_: `boolean`

Like `equals`, but ignores whitespace, comments and keyword casing. [More info.](formatting.md#comparing)

### node.walk(fn)

`fn`: [`Substitutor`](#substitutor)\
_Returns_: `SqlBase`

Visits every node, parents before children, and replaces a node with whatever `fn` returns. A replacement is not walked into. Returning `undefined` stops the walk and returns the original. [More info.](traversal.md#walk)

### node.walkPostorder(fn)

`fn`: [`Substitutor`](#substitutor)\
_Returns_: `SqlBase`

Like `walk`, but visits children before their parents.

### node.some(fn), node.every(fn)

`fn`: `(node: SqlBase, stack: SqlBase[]) => boolean`\
_Returns_: `boolean`

Whether any (or every) node in the tree matches.

### node.find(fn), node.collect(fn)

`fn`: `(node: SqlBase, stack: SqlBase[]) => node is T`\
_Returns_: `T | undefined` / `T[]`

The first matching node, or all of them.

### node.getColumns(), node.getUsedColumnNames(), node.getFirstColumnName()

_Returns_: `SqlColumn[]` / `string[]` / `string | undefined`

The column references in the tree, their distinct names (sorted), or the first name.

### node.getTables(), node.getUsedTableNames(), node.getFirstTableName(), node.getFirstSchema()

_Returns_: `SqlTable[]` / `string[]` / `string | undefined` / `string | undefined`

The table references in the tree, their distinct names (sorted), the first table name, or the first namespace used to qualify a table.

### node.contains(thing), node.containsColumnName(name), node.containsFunction(name)

_Returns_: `boolean`

Whether the tree contains a node that `equals` `thing`, a column with that name, or a call to that function (compared in upper case).

### node.prettify(options?)

`options`: [`PrettifyOptions`](#prettifyoptions)\
_Returns_: `this`

Reformats the whole tree in the default style. [More info.](formatting.md#prettifyoptions)

### node.prettyTrim(maxLength)

`maxLength`: `number`\
_Returns_: `this`

Shortens long literals and identifiers, for display.

### node.addClarifyingParens()

_Returns_: `this`

Adds parentheses around an `AND` inside an `OR` and the other way round.

### node.getParens(), node.hasParens(), node.changeParens(parens), node.addParens(), node.ensureParens(), node.removeOwnParenSpaces()

Read and change the parentheses around a node. `ensureParens` adds a pair only if there are none. [More info.](formatting.md#parentheses)

### node.getSpace(name, default?), node.changeSpace(name, space), node.changeSpaces(spaces), node.resetOwnSpacing()

Read and change the whitespace (and comments) in a node's named slots. [More info.](formatting.md#spacing)

### node.apply(fn), node.applyIf(condition, thenFn, elseFn?), node.applyForEach(things, fn)

Call a function on the node, conditionally, or once per item (threading the result through), so edits can stay in one chain. [More info.](formatting.md#helpers-for-chaining)

## SqlExpression

The base class of every expression, including queries. Extends [`SqlBase`](#sqlbase).

[More info.](expressions.md)

### SqlExpression.parse(input)

`input`: `string | SqlExpression`\
_Returns_: `SqlExpression`

Parses an expression or a query of any form. An already parsed expression is returned as is. [More info.](parsing.md)

### SqlExpression.maybeParse(input)

`input`: `string | SqlExpression`\
_Returns_: `SqlExpression | undefined`

Like `parse`, but returns `undefined` instead of throwing.

### SqlExpression.wrap(value)

`value`: `SqlExpression | LiteralValue`\
_Returns_: `SqlExpression`

Returns an expression as is and wraps a plain value with `L`.

### SqlExpression.and(...expressions), SqlExpression.or(...expressions)

`expressions`: `(SqlExpression | undefined)[]`\
_Returns_: `SqlExpression`

Joins the expressions with `AND` (or `OR`), skipping `undefined` and no-op `TRUE` (or `FALSE`) and flattening nested lists. One expression is returned as is, none gives `TRUE` (or `FALSE`). [More info.](expressions.md#combining-with-and-and-or)

### SqlExpression.add(...), .subtract(...), .multiply(...), .divide(...), .concat(...)

`expressions`: `(SqlExpression | undefined)[]`\
_Returns_: `SqlExpression`

Arithmetic and `||`, skipping `undefined`.

### SqlExpression.fromTimeExpressionAndInterval(time, interval)

`time`: `SqlExpression`\
`interval`: `string | string[]`\
_Returns_: `SqlExpression`

`start <= time AND time < end` for an ISO interval like `'2024-01-01/2024-02-01'`, or an `OR` of those for a list. [More info.](expressions.md#time-intervals)

### SqlExpression.arrayOfLiterals(values)

`values`: `LiteralValue[]`\
_Returns_: `SqlExpression`

`ARRAY[...]` of literals.

### expression.equal(rhs), .unequal(rhs), .lessThan(rhs), .greaterThan(rhs), .lessThanOrEqual(rhs), .greaterThanOrEqual(rhs)

`rhs`: `SqlExpression | LiteralValue`\
_Returns_: `SqlComparison`

`=`, `<>`, `<`, `>`, `<=`, `>=`. [More info.](expressions.md#comparisons)

### expression.isNull(), .isNotNull(), .isDistinctFrom(rhs), .isNotDistinctFrom(rhs)

_Returns_: `SqlComparison`

### expression.in(values), .notIn(values)

`values`: `(SqlExpression | LiteralValue)[]`\
_Returns_: `SqlComparison`

### expression.like(pattern, escape?)

`pattern`: `SqlExpression | string`\
`escape`: `SqlExpression | string`\
_Returns_: `SqlComparison`

### expression.between(start, end), .notBetween(start, end), .betweenSymmetric(start, end), .notBetweenSymmetric(start, end)

`start`, `end`: `SqlExpression | LiteralValue`\
_Returns_: `SqlComparison`

### expression.not()

_Returns_: `SqlUnary`

Wraps in `NOT`.

### expression.negate()

_Returns_: `SqlExpression`

The logical opposite, flipping the operator where possible (`=` to `<>`, `IN` to `NOT IN`, `IS NULL` to `IS NOT NULL`, ...). [More info.](expressions.md#negation)

### expression.and(...expressions), .or(...expressions)

`expressions`: `SqlExpression[]`\
_Returns_: `SqlExpression`

Same as the static versions, with `this` first.

### expression.add(...), .subtract(...), .multiply(...), .divide(...), .concat(...)

`expressions`: `SqlExpression[]`\
_Returns_: `SqlExpression`

### expression.cast(type)

`type`: `SqlType | string`\
_Returns_: `SqlExpression`

`CAST(expression AS type)`.

### expression.as(alias, forceQuotes?)

`alias`: `string | RefName`\
`forceQuotes`: `boolean`\
_Returns_: `SqlAlias`

Adds an alias. [More info.](expressions.md#aliases-and-output-names)

### expression.setAlias(alias, forceQuotes?)

`alias`: `string | RefName | undefined`\
_Returns_: `SqlExpression`

Sets the alias, or removes it when `alias` is `undefined`.

### expression.ifUnnamedAliasAs(alias, forceQuotes?)

_Returns_: `SqlExpression`

Adds an alias only if there is none.

### expression.getOutputName()

_Returns_: `string | undefined`

The name of the result column this expression produces as a select expression: the alias, or the name of a bare column.

### expression.getUnderlyingExpression(), expression.changeUnderlyingExpression(expression)

_Returns_: `SqlExpression`

The expression under an alias, or replace it (keeping the alias).

### expression.toOrderByExpression(direction?)

`direction`: `'ASC' | 'DESC'`\
_Returns_: `SqlOrderByExpression`

### expression.decomposeViaAnd(options?), expression.decomposeViaOr(options?)

`options`: [`DecomposeViaOptions`](#decomposeviaoptions)\
_Returns_: `SqlExpression[]`

The parts of an `AND` (or `OR`), or `[expression]` if it is not one. [More info.](expressions.md#taking-filters-apart)

### expression.filterAnd(fn)

`fn`: `(ex: SqlExpression) => boolean`\
_Returns_: `SqlExpression | undefined`

Keeps the parts of an `AND` for which `fn` is true.

### expression.removeColumnFromAnd(column)

`column`: `string`\
_Returns_: `SqlExpression | undefined`

Removes the parts of an `AND` that use the column.

### expression.flatten(op?)

_Returns_: `SqlExpression`

Flattens nested lists of the same operator: `(a AND b) AND c` becomes `a AND b AND c`.

### expression.fillPlaceholders(values)

`values`: `(SqlExpression | LiteralValue)[]`\
_Returns_: `SqlExpression`

Replaces `?` placeholders, in order. [More info.](expressions.md#fillplaceholders)

### expression.addFilterToAggregations(filter, knownAggregations)

`filter`: `SqlExpression`\
`knownAggregations`: `string[]`\
_Returns_: `SqlExpression`

Adds `FILTER (WHERE filter)` to every aggregation call. [More info.](expressions.md#filtered-aggregations)

## SqlQueryBase

The base class of every query. Extends [`SqlExpression`](#sqlexpression).

[More info.](queries.md)

### query.getContext(), query.hasContext()

_Returns_: `Record<string, any>` / `boolean`

The context set by the query's `SET` statements.

### query.changeContext(context)

`context`: `Record<string, any> | undefined`\
_Returns_: `this`

Replaces the `SET` statements. `undefined` or `{}` removes them. [More info.](queries.md#context-set-statements)

### query.changeContextStatements(statements)

`statements`: `SqlSetStatement[] | SeparatedArray<SqlSetStatement> | undefined`\
_Returns_: `this`

### query.explain, query.changeExplain(explain), query.makeExplain()

`explain`: `boolean`\
_Returns_: `this`

Adds or removes `EXPLAIN PLAN FOR`.

### query.getInsertIntoTable(), query.changeInsertIntoTable(table)

`table`: `SqlExpression | string | undefined`

`INSERT INTO table`. `changeInsertClause(clause)` works on the whole clause.

### query.getReplaceIntoTable(), query.changeReplaceIntoTable(table)

`table`: `SqlExpression | string | undefined`

`REPLACE INTO table OVERWRITE ALL`. `changeReplaceClause(clause)` works on the whole clause, for `OVERWRITE WHERE ...` use `SqlReplaceClause.create(table, where)`.

### query.getIngestTable()

_Returns_: `SqlExpression | undefined`

The `INSERT` or `REPLACE` target, if any.

### query.changePartitionedByClause(clause), query.changeClusteredByClause(clause), query.changeClusteredByExpressions(expressions)

Set or remove (`undefined`) `PARTITIONED BY` and `CLUSTERED BY`. [More info.](queries.md#insert-and-replace)

### query.getOrderByClause(), query.changeOrderByClause(clause)

_Returns_: `SqlOrderByClause | undefined` / `this`

### query.hasOrderBy(), query.getOrderByExpressions()

_Returns_: `boolean` / `readonly SqlOrderByExpression[]`

### query.changeOrderByExpressions(expressions), query.changeOrderByExpression(expression)

`expressions`: `SqlOrderByExpression[] | undefined`\
_Returns_: `this`

Replaces the `ORDER BY` list (`undefined` or `[]` removes it). [More info.](queries.md#order-by)

### query.addOrderBy(expression)

`expression`: `SqlOrderByExpression`\
_Returns_: `this`

Adds a sort as the first one.

### query.getOrderByForExpression(expression)

`expression`: `SqlExpression`\
_Returns_: `SqlOrderByExpression | undefined`

### query.getLimitValue(), query.hasLimit(), query.changeLimitValue(limit)

`limit`: `number | SqlLiteral | undefined`\
_Returns_: `number | undefined` / `boolean` / `this`

`undefined` or `Infinity` removes the `LIMIT`, a negative number throws. [More info.](queries.md#limit-and-offset)

### query.getOffsetValue(), query.hasOffset(), query.changeOffsetValue(offset)

`offset`: `number | SqlLiteral | undefined`

### query.getLimitClause(), query.changeLimitClause(clause), query.getOffsetClause(), query.changeOffsetClause(clause)

Work on the clauses themselves.

### query.combineWithLimitClause(clause), query.combineWithOffsetClause(clause)

_Returns_: `this`

Applies another limit (keeping the smaller one) or offset (adding them up).

### query.unionQuery, query.changeUnionQuery(query)

`query`: `SqlQueryBase | undefined`\
_Returns_: `this`

The query after `UNION ALL`. [More info.](queries.md#union-all)

### query.flattenWith()

_Returns_: `SqlQueryBase`

Merges nested `WITH` clauses where that keeps the meaning. [More info.](queries.md#with)

## SqlQuery

A `SELECT` query. Extends [`SqlQueryBase`](#sqlquerybase).

[More info.](select-queries.md)

### SqlQuery.parse(input)

`input`: `string | SqlQuery`\
_Returns_: `SqlQuery`

Parses a `SELECT` query. Throws `Provided SQL was not a query` for other kinds of query.

### SqlQuery.maybeParse(input)

_Returns_: `SqlQuery | undefined`

### SqlQuery.from(from), SqlQuery.selectStarFrom(from)

`from`: `string | SqlExpression | SqlFromClause`\
_Returns_: `SqlQuery`

A query reading from a table or sub-query, with no select list (`from`) or `SELECT *` (`selectStarFrom`). `SET` statements of a sub-query move to the outer query.

### SqlQuery.isPhonyOutputName(name)

_Returns_: `boolean`

Whether a name is one of Druid's made up `EXPR$n` names.

### Select list

| Method | Returns |
| --- | --- |
| `query.getSelectExpressionsArray()` | `readonly SqlExpression[]` |
| `query.getSelectExpressionForIndex(index)` | `SqlExpression \| undefined` |
| `query.isValidSelectIndex(index)` | `boolean` |
| `query.getOutputColumns()` | `string[]` |
| `query.getSelectIndexForOutputColumn(name)` | `number` (`-1` if none) |
| `query.getSelectIndexForExpression(ex, allowAliasReferences)` | `number` |
| `query.getSelectIndexesForColumn(column)` | `number[]` |
| `query.isRealOutputColumnAtSelectIndex(index)` | `boolean` |
| `query.hasStarInSelect()` | `boolean` |
| `query.addSelect(ex, options?)` | `this`, see [`AddSelectOptions`](#addselectoptions) |
| `query.changeSelect(index, ex)` | `this` |
| `query.changeSelectExpressions(expressions)` | `this` |
| `query.removeSelectIndex(index)`, `query.removeSelectIndexes(indexes)` | `this` |
| `query.removeOutputColumn(name)` | `this` |
| `query.changeDecorator('DISTINCT' \| 'ALL' \| undefined)` | `this` |

[More info.](select-queries.md#changing-the-select-list)

### FROM and JOIN

| Method | Returns |
| --- | --- |
| `query.hasFrom()` | `boolean` |
| `query.getFromExpressions()`, `query.getFirstFromExpression()` | `readonly SqlExpression[]`, `SqlExpression \| undefined` |
| `query.changeFromExpressions(expressions)`, `query.changeFromClause(clause)` | `this` |
| `query.hasJoin()`, `query.getJoins()` | `boolean`, `readonly SqlJoinPart[]` |
| `query.addJoin(join)` | `this` |
| `query.addLeftJoin(table, on)`, `addRightJoin`, `addInnerJoin`, `addFullJoin` | `this`, `on` can be an array of conditions |
| `query.addCrossJoin(table)` | `this` |
| `query.removeAllJoins()` | `this` |

[More info.](select-queries.md#from-and-join)

### WHERE and HAVING

| Method | Returns |
| --- | --- |
| `query.hasWhere()`, `query.hasHaving()` | `boolean` |
| `query.getWhereExpression()`, `query.getHavingExpression()` | `SqlExpression \| undefined` |
| `query.getEffectiveWhereExpression()`, `query.getEffectiveHavingExpression()` | `SqlExpression` (`TRUE` if none) |
| `query.addWhere(...ex)`, `query.addHaving(...ex)` | `this`, AND-ed on |
| `query.removeColumnFromWhere(column)`, `query.removeFromHaving(column)` | `this` |
| `query.changeWhereExpression(ex)`, `query.changeHavingExpression(ex)` | `this`, `undefined` or `TRUE` removes |
| `query.changeWhereClause(clause)`, `query.changeHavingClause(clause)` | `this` |

[More info.](select-queries.md#where)

### GROUP BY

| Method | Returns |
| --- | --- |
| `query.hasGroupBy()` | `boolean` |
| `query.getGroupByExpressions()` | `readonly SqlExpression[] \| undefined`, as written |
| `query.getGroupingExpressions()` | `SqlExpression[]`, with references resolved |
| `query.getGroupingExpressionInfos()` | `ExpressionInfo[]` |
| `query.isGroupedSelectIndex(index)`, `query.isGroupedOutputColumn(name)` | `boolean` |
| `query.getGroupedSelectExpressions()`, `query.getGroupedOutputColumns()` | `SqlExpression[]`, `string[]` |
| `query.getGroupedSelectIndexesForColumn(column)` | `number[]` |
| `query.isAggregateSelectIndex(index)`, `query.isAggregateOutputColumn(name)` | `boolean` |
| `query.getAggregateSelectExpressions()`, `query.getAggregateOutputColumns()` | `SqlExpression[]`, `string[]` |
| `query.addGroupBy(ex)` | `this` |
| `query.changeGroupByExpressions(expressions)`, `query.changeGroupByClause(clause)` | `this`, `[]` gives `GROUP BY ()`, `undefined` removes |

[More info.](select-queries.md#group-by)

### ORDER BY

| Method | Returns |
| --- | --- |
| `query.getOrderByForSelectIndex(index)`, `query.getOrderByForOutputColumn(name)` | `SqlOrderByExpression \| undefined` |
| `query.getOrderedSelectExpressions()`, `query.getOrderedOutputColumns()` | `SqlExpression[]`, `string[]` |
| `query.removeOrderByForSelectIndex(index)`, `query.removeOrderByForOutputColumn(name)` | `this` |

[More info.](select-queries.md#order-by)

### WITH

| Method | Returns |
| --- | --- |
| `query.getWithParts()` | `readonly SqlWithPart[]` |
| `query.changeWithParts(parts)`, `query.changeWithClause(clause)` | `this` |
| `query.prependWith(name, query)` | `this` |

### query.inlineMaxDataTime(maxTime)

`maxTime`: `number | undefined`\
_Returns_: `SqlQuery`

Replaces `MAX_DATA_TIME()` with a timestamp literal (the current time if `maxTime` is not given).

## SqlPipesQuery

A pipe syntax query. Extends [`SqlQueryBase`](#sqlquerybase); its ORDER BY, LIMIT and OFFSET methods work on the trailing pipe operators.

[More info.](pipe-syntax.md)

### SqlPipesQuery.create(query, pipeOperators)

`query`: `SqlQueryBase`\
`pipeOperators`: `SqlPipeOperator[]`\
_Returns_: `SqlPipesQuery`

### pipesQuery.query, pipesQuery.changeQuery(query)

The starting query.

### pipesQuery.getPipeOperators(), pipesQuery.getLastPipeOperator()

_Returns_: `readonly SqlPipeOperator[]` / `SqlPipeOperator`

### pipesQuery.appendPipeOperator(op), pipesQuery.insertPipeOperator(index, op), pipesQuery.changePipeOperators(ops)

_Returns_: `this`

### pipesQuery.removePipeOperator(index)

_Returns_: `SqlQueryBase`

Removing the last operator returns the starting query.

### pipesQuery.unpipe()

_Returns_: `SqlQuery`

An equivalent query without pipes. Throws if a `|> SET` or `|> DROP` has input with unknown columns. [More info.](pipe-syntax.md#unpipe)

## Other query classes

All of these extend [`SqlQueryBase`](#sqlquerybase).

- `SqlFromQuery`: `FROM t`. `SqlFromQuery.create(table)`, `optionalQuotes(table)`, `getTableName()`, `changeTableName(name)`, `changeTable(table)`, `getNamespaceName()`, `changeNamespace(namespace)`.
- `SqlTableQuery`: `TABLE t`. The same methods as `SqlFromQuery`.
- `SqlValues`: `VALUES (...), (...)`. `SqlValues.create(records)`, `changeRecords(records)`.
- `SqlWithQuery`: a `WITH` clause around a body that is not a plain `SELECT`. `withClause`, `query`, `getWithParts()`, `changeWithParts(parts)`, `prependWith(name, query)`, `changeQuery(query)`.

## Expression classes

The classes an expression parses into, and their own methods, are listed in [Expressions](expressions.md#reading-specific-kinds-of-expression). They are `SqlColumn`, `SqlTable`, `SqlNamespace`, `SqlStar`, `SqlLiteral`, `SqlPlaceholder`, `SqlInterval`, `SqlType`, `SqlFunction`, `SqlComparison`, `SqlMulti`, `SqlUnary`, `SqlAlias`, `SqlCase`, `SqlRecord`, `SqlLabeledExpression` and `SqlKeyValue`, plus the query classes above.

## Types

### LiteralValue

`null | boolean | number | bigint | string | Date`

A plain value that can become a `SqlLiteral`.

### AddSelectOptions

| Property | Type | Description |
| --- | --- | --- |
| `insertIndex` | `number \| 'last' \| 'last-grouping'` | Where to insert. Defaults to `'last'`. |
| `addToGroupBy` | `'start' \| 'end'` | Also group by the new column. |
| `groupByExpression` | `SqlExpression` | Group by this instead of the column's index. |
| `addToOrderBy` | `'start' \| 'end'` | Also order by the new column. |
| `orderByExpression` | `SqlOrderByExpression` | Order by this instead of the column's index. |
| `direction` | `'ASC' \| 'DESC'` | The direction for `addToOrderBy`. |

### DecomposeViaOptions

| Property | Type | Description |
| --- | --- | --- |
| `flatten` | `boolean` | Also split nested `AND`s (or `OR`s). |
| `preserveParens` | `boolean` | Keep the parentheses around each part. |

### PrettifyOptions

| Property | Type | Description |
| --- | --- | --- |
| `keywordCasing` | `'preserve'` | Keep the casing of keywords. |
| `clarifyingParens` | `'disable'` | Do not add clarifying parentheses. |

### Substitutor

`(node: SqlBase, stack: SqlBase[]) => SqlBase | undefined`

The callback of `walk` and `walkPostorder`. `stack` holds the node's ancestors, nearest first.

### ExpressionInfo

`{ expression: SqlExpression, selectIndex: number, outputColumn?: string, orderByExpression?: SqlOrderByExpression }`

Returned by `getGroupingExpressionInfos()`. `selectIndex` is `-1` for a grouping expression that is not in the select list.

<hr>

[**Top**: Table of contents](README.md)
