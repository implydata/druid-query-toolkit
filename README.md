[![npm version](https://badge.fury.io/js/druid-query-toolkit.svg)](//npmjs.com/package/druid-query-toolkit)

# Druid Query Toolkit

A number of tools to make working with Druid queries a treat.

## Set up 

install druid-query-toolkit

`npm i druid-query-toolkit`

## SQL to AST 

```
const parser = require('druid-query-toolkit');
cosnt ast = parser.parse('SELECT "server" FROM sys.server_segments');
console.log(ast);

```      

logs:

 ```
{
    "type": "query",
    "queryType": "SELECT",
    "selectParts": [
       {
          "type": "selectPart",
          "distinct": null,
          "expr": {
             "type": "variable",
             "value": "server",
             "spacing": [],
             "quote": "\""
          },
          "alias": null,
          "spacing": [
             " "
          ]
       }
    ],
    "from": {
       "type": "from",
       "value": {
          "type": "table",
          "schema": "sys",
          "alias": null,
          "table": "server_segments",
          "spacing": [
             " "
          ]
       },
       "spacing": [
          " "
       ],
       "syntax": "FROM"
    },
    "where": null,
    "groupby": null,
    "having": null,
    "orderBy": null,
    "limit": null,
    "unionAll": null,
    "syntax": "SELECT",
    "spacing": [],
    "endSpacing": []
}
```

## AST to SQL

```
const parser = require('druid-query-toolkit');
ast = {
    "type": "query",
    "queryType": "SELECT",
    "selectParts": [
       {
          "type": "selectPart",
          "distinct": null,
          "expr": {
             "type": "variable",
             "value": "server",
             "spacing": [],
             "quote": "\""
          },
          "alias": null,
          "spacing": [
             " "
          ]
       }
    ],
    "from": {
       "type": "from",
       "value": {
          "type": "table",
          "schema": "sys",
          "alias": null,
          "table": "server_segments",
          "spacing": [
             " "
          ]
       },
       "spacing": [
          " "
       ],
       "syntax": "FROM"
    },
    "where": null,
    "groupby": null,
    "having": null,
    "orderBy": null,
    "limit": null,
    "unionAll": null,
    "syntax": "SELECT",
    "spacing": [],
    "endSpacing": []
 }
 const sql = parser.stringify(ast);
```
logs: `'SELECT "server" FROM sys.server_segments'`

## License 

[Apache 2.0](LICENSE)
