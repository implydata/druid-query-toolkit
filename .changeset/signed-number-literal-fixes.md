---
'druid-query-toolkit': patch
---

Fix parsing of a sign followed by whitespace and a number (`- 1`, `x * - 1`, `- -1`) and of long number literals with an exponent and no decimal point (`8640000000000000E0`)
