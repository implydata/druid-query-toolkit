[![npm version](https://badge.fury.io/js/druid-query-toolkit.svg)](//npmjs.com/package/druid-query-toolkit)

# Druid Query Toolkit

A number of tools to make working with [Druid queries](https://calcite.apache.org/docs/reference.html) a treat.
There are a number of use cases for this toolkit and one of the chief use cases can be found in Druid's own [web-console](https://druid.apache.org/docs/latest/operations/druid-console.html).

Search for uses within [web-console/src](https://github.com/apache/druid/tree/master/web-console/src) for some examples.
Specifically the [query view](https://github.com/apache/druid/tree/master/web-console/src/views/workbench-view) uses these tools a lot.

## Parts

At a high level there are 4 parts to this toolkit:

- SQL - a set of classes and parsers to model and parse DruidSQL.
- QueryResult - a class to model and decode all the different shapes of Druid query results.
- QueryRunner - a class to wrap around the boilerplate of running a query
- Introspection - a set of utilities that help in decoding the results of Druid introspective metadata queries.

There are plenty of examples in the unit tests.

### SQL

The SQL parser parses and models the whitespace and casing as well as the logical representation of the query allowing the query to be transformed in a very human friendly way.

Here are a few examples of what the SQL parser can do:

Adding a column at the start of the select clause.

```javascript
import { SqlQuery } from 'druid-query-toolkit';

const sql = SqlQuery.parse(`
SELECT
  isAnonymous,
  cityName,
  flags,
  COUNT(*) AS "Count",
  SUM(added) AS "sum_added"
FROM wikipedia
GROUP BY 1, 2, 3
ORDER BY 4 DESC
`);

sql.addSelect(`"new_column" AS "New column"`, { insertIndex: 0 }).toString()
/* →
`
SELECT
  "new_column" AS "New column",
  isAnonymous,
  cityName,
  flags,
  COUNT(*) AS "Count",
  SUM(added) AS "sum_added"
FROM wikipedia
GROUP BY 2, 3, 4
ORDER BY 5 DESC
`
 */

sql.addSelect(`UPPER(city) AS City`, { insertIndex: 'last-grouping', addToGroupBy: 'end' }).toString()
/* →
`
SELECT
  isAnonymous,
  cityName,
  flags,
  UPPER(city) AS City,
  COUNT(*) AS "Count",
  SUM(added) AS "sum_added"
FROM wikipedia
GROUP BY 1, 2, 3, 4
ORDER BY 5 DESC
`
 */
```

For more examples, check out the unit tests.

#### ToDo

Not every valid DruidSQL construct can currently be parsed, the following snippets are not currently supported:

- `(a, b) IN (subquery)`

## License

[Apache 2.0](LICENSE)
