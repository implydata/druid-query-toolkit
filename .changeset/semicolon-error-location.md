---
'druid-query-toolkit': patch
---

A query followed by `;` and more text fails after the `;` again (`Expected end of input or possible semicolon`), as in 1.2, instead of at the `;` with a long list of expected tokens
