---
'druid-query-toolkit': minor
---

`QueryResult.sqlQuery` and `attachQuery` take any query (`SqlQueryBase`), and `QueryRunner` attaches pipe, `TABLE`, `VALUES` and other queries, not only `SELECT`. The questions about a query's output columns, filters and grouping (`getSelectExpressionForIndex`, `getOutputColumns`, `isAggregateOutputColumn`, `getEffectiveWhereExpression`, `hasGroupBy`, `getOrderByForOutputColumn`, ...) move from `SqlQuery` to `SqlQueryBase`, as do `getSelectExpressionOutput` and `isPhonyOutputName`, and there is a new `SqlQueryBase.parse` / `maybeParse` for any query. Code that changes `result.sqlQuery` (`addWhere`, `changeSelect`, ...) needs to narrow it with `instanceof SqlQuery` first
