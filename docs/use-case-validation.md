# 🛡️ Validating user input

Products built on Druid often let people type a piece of SQL that the product then puts inside a bigger query it generates: a custom dimension, a measure formula, a filter. The generated query only works if the piece follows some rules, and it is much friendlier to check those rules when the formula is saved, with a message that says what to fix, than to show a Druid error later.

Parsing the formula and [walking](traversal.md) it makes those checks short.

## Example: formulas over an aliased table

Say the product generates queries like this, always aliasing the data source as `t`, and pastes each user formula in as a select expression:

```sql
SELECT
  <formula> AS "dimension",
  COUNT(*) AS "count"
FROM "wikipedia" AS t
LEFT JOIN "lookup"."country_names" AS c ON ...
GROUP BY 1
```

Because of the join, an unqualified column like `cityName` could be ambiguous, so formulas must refer to columns as `t."cityName"`. The formula also must not be a query, contain a sub-query, have its own alias, or contain `?` placeholders (which would shift the query's parameters).

```ts
import {
  L,
  SqlAlias,
  SqlColumn,
  SqlExpression,
  SqlFunction,
  SqlPlaceholder,
  SqlQueryBase,
  T,
} from 'druid-query-toolkit';

function validateFormula(formula: string): string[] {
  const expression = SqlExpression.maybeParse(formula);
  if (!expression) return [`could not parse \`${formula}\``];
  if (expression instanceof SqlQueryBase) return ['the formula must be an expression, not a query'];

  const problems: string[] = [];
  expression.walk(ex => {
    if (ex instanceof SqlQueryBase) {
      problems.push(`\`${ex}\` is a sub-query, sub-queries are not supported`);
      return L.NULL; // a replacement is not walked into, so this skips the sub-query's insides
    }

    if (ex instanceof SqlPlaceholder) {
      problems.push('placeholders (?) are not supported');
    } else if (ex instanceof SqlAlias) {
      problems.push('the formula can not have an alias (AS ...)');
    } else if (ex instanceof SqlColumn && ex.getTableName() !== 't') {
      const suggestion = ex.changeTable(T.optionalQuotes('t'));
      problems.push(`every column must be qualified with "t.", try \`${suggestion}\` instead of \`${ex}\``);
    }
    return ex;
  });
  return problems;
}
```

The walk is only used to look, so its result is thrown away. That is why the sub-query can be "replaced" with `L.NULL`: it stops the walk from going into the sub-query (whose columns belong to other tables and would give confusing messages) without affecting anything.

The error messages quote the user's own text back to them (`${ex}` prints the node exactly as they wrote it), and the suggestion is built by editing the offending node, so it keeps their quoting:

```js
validateFormula(`UPPER(t."cityName")`);
//=> []

validateFormula(`UPPER(cityName) || '-' || t.channel`);
//=> ['every column must be qualified with "t.", try `t.cityName` instead of `cityName`']

validateFormula(`"countryName"`);
//=> ['every column must be qualified with "t.", try `t."countryName"` instead of `"countryName"`']

validateFormula(`t.x IN (SELECT x FROM t.y)`);
//=> ['`(SELECT x FROM t.y)` is a sub-query, sub-queries are not supported']

validateFormula(`t.x = ?`); //=> ['placeholders (?) are not supported']
validateFormula(`t.x AS y`); //=> ['the formula can not have an alias (AS ...)']
validateFormula(`SELECT 1`); //=> ['the formula must be an expression, not a query']
validateFormula(`t.x +`); //=> ['could not parse `t.x +`']
```

To stop at the first problem instead of collecting them all, throw from inside the callback.

## Checking functions

`collect` gathers every function call, and `SqlFunction#getEffectiveFunctionName()` gives its name in upper case, whatever casing the user used. That is enough to check that a measure aggregates, or to reject functions a product does not allow:

```ts
const KNOWN_AGGREGATIONS = ['COUNT', 'SUM', 'MIN', 'MAX', 'AVG', 'APPROX_COUNT_DISTINCT_DS_HLL', 'LATEST', 'EARLIEST'];

function validateMeasure(expression: SqlExpression): string | undefined {
  const functions = expression.collect((ex): ex is SqlFunction => ex instanceof SqlFunction);

  if (!functions.some(f => f.isAggregation(KNOWN_AGGREGATIONS))) {
    return `the measure \`${expression}\` must contain an aggregation, like SUM(...)`;
  }
  if (functions.some(f => f.windowSpec)) {
    return `the measure \`${expression}\` can not use window functions (OVER ...)`;
  }
  return;
}

validateMeasure(SqlExpression.parse('SUM(t.added)')); //=> undefined
validateMeasure(SqlExpression.parse('COUNT(*) FILTER (WHERE t.x = 1) * 1.0 / COUNT(*)')); //=> undefined
validateMeasure(SqlExpression.parse('t.added * 2')); //=> 'the measure `t.added * 2` must contain an aggregation, like SUM(...)'
validateMeasure(SqlExpression.parse('SUM(t.added) OVER ()')); //=> 'the measure `SUM(t.added) OVER ()` can not use window functions (OVER ...)'
```

## Recognizing a shape

Sometimes the check is about the overall shape of the formula rather than what is in it. For example, to detect a formula that is just a function wrapped around a single column (so it can be simplified, or upgraded from an old format):

```ts
function getWrappedColumn(expression: SqlExpression, functionName: string): SqlColumn | undefined {
  if (!(expression instanceof SqlFunction)) return;
  if (expression.getEffectiveFunctionName() !== functionName || expression.numArgs() !== 1) return;
  const arg = expression.getArg(0);
  return arg instanceof SqlColumn ? arg : undefined;
}

getWrappedColumn(SqlExpression.parse('ip_stringify(t."client_ip")'), 'IP_STRINGIFY'); //=> t."client_ip"
getWrappedColumn(SqlExpression.parse('IP_STRINGIFY(t.a || t.b)'), 'IP_STRINGIFY'); //=> undefined
```

## Other useful checks

- `expression.getUsedColumnNames()` lists the columns a formula depends on, to check them against the data source's schema or to work out dependencies between formulas.
- `expression.containsFunction('MAX_DATA_TIME')` detects a macro that has to be expanded before running.
- `expression.some(ex => ex instanceof SqlQueryBase)` is a one line "has a sub-query" check.
- `SqlQuery.maybeParse(text)?.getUsedColumnNames()` works as a best effort column list for a whole query, falling back to nothing when the text does not parse.

<hr>

[**Next**: 🔁 Rewriting queries](use-case-rewriting.md)\
[**Top**: Table of contents](README.md)
