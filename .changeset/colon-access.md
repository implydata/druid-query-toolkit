---
'druid-query-toolkit': minor
---

Parse colon access (`v:a.b`, `v:['field name']`, `v:[0]`) as the new `SqlColonAccess`, build it with `ex.access(...path)`, and turn it into the `JSON_VALUE` call it is sugar for with `toJsonValue()`. A short `JSON_OBJECT` key can no longer be an unparenthesized arithmetic or comparison expression
