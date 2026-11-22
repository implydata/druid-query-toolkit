---
'druid-query-toolkit': patch
---

`prettify()` also resets the spacing and casing of the keyword separators in function arguments (`CAST(x  as  BIGINT)`, `EXTRACT(day  from  t)`, `TRIM(BOTH 'x'  from  y)`), and the spacing around the dots of a qualified column or star (`s . t . c`, `t . *`) and inside a colon access (`v:a . b [ 'c' ]`)
