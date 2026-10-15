---
'druid-query-toolkit': minor
---

Parse colon access (`v:a.b`, `v:['field name']`, `v:[0]`) as the new `SqlColonAccess`. A short `JSON_OBJECT` key can no longer be an unparenthesized arithmetic or comparison expression
