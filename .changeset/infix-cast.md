---
'druid-query-toolkit': minor
---

Parse the infix cast (`x::BIGINT`, `v:a::BIGINT`) as the new `SqlInfixCast`, build it with `ex.infixCast(type)`, and turn it into the `CAST` or `JSON_VALUE ... RETURNING` call it is sugar for with `toFunction()`. Output names follow Druid: `x::BIGINT` is named "x" and `v:a.b` is named "b", unless the select list has a `*` or another column of that name. The contains and regexp filter patterns also recognize `x::VARCHAR`. Types in `CAST` and `::` can be interval types (`INTERVAL DAY`, `INTERVAL DAY TO SECOND`), have a precision (`DECIMAL(5, 1)`) or be `DOUBLE PRECISION`
