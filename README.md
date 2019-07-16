[![Build Status](https://travis-ci.org/mcbrewster/druid-sql-parser.svg?branch=master)](https://travis-ci.org/mcbrewster/druid-sql-parser)
[![npm version](https://badge.fury.io/js/druid-sql-parser.svg)](//npmjs.com/package/druid-sql-parser)
# Druid Sql Parser 
Parses Sql to an AST and re-stringifies SQL ASTs

## Set up 

install druid-sql-parser

`npm i druid-sql-parser`

## Sql to AST 

```
const parser = require('druid-sql-parser');
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
const parser = require('druid-sql-parser');
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
[MIT](LICENSE)
