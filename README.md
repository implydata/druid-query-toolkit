[![npm version](https://badge.fury.io/js/druid-query-toolkit.svg)](//npmjs.com/package/druid-query-toolkit)

# Druid Query Toolkit

A number of tools to make working with Druid queries a treat.

## Set up 

Install druid-query-toolkit

`npm i druid-query-toolkit`

## SQL to AST 

Converts an SQL string to a SqlQuery object. SqlParserFactory takes an argument of an array of the names of functions to be used by the parser, these are not case sensitive. The parser created by sqlParserFactory can then be used to parse strings to abstract syntax trees.  

```
import { sqlParserFactory } from './parser/druidsql';
const parser = sqlParserFactory(FUNCTIONS);
ast = parser(`SELECT "segment_id", "datasource", "start", "end", "size", "version", "partition_num", "num_replicas", "num_rows", "is_published", "is_available", "is_realtime", "is_overshadowed", "payload"
FROM sys.segments
ORDER BY "start" DESC
LIMIT 25`);
console.log(ast); 
```      

logs:

 ```
 SqlQuery {
   "columns": Columns {
     "columns": Array [
       Column {
         "alias": null,
         "ex": RefExpression {
           "name": StringType {
             "chars": "segment_id",
             "quote": "\\"",
             "spacing": Array [
               null,
               null,
             ],
           },
           "namespace": null,
           "quote": undefined,
           "quoteSpacing": undefined,
         },
         "parens": Array [],
         "spacing": null,
       },
       Column {
         "alias": null,
         "ex": RefExpression {
           "name": StringType {
             "chars": "datasource",
             "quote": "\\"",
             "spacing": Array [
               null,
               null,
             ],
           },
           "namespace": null,
           "quote": undefined,
           "quoteSpacing": undefined,
         },
         "parens": Array [],
         "spacing": null,
       },
       Column {
         "alias": null,
         "ex": RefExpression {
           "name": StringType {
             "chars": "start",
             "quote": "\\"",
             "spacing": Array [
               null,
               null,
             ],
           },
           "namespace": null,
           "quote": undefined,
           "quoteSpacing": undefined,
         },
         "parens": Array [],
         "spacing": null,
       },
       Column {
         "alias": null,
         "ex": RefExpression {
           "name": StringType {
             "chars": "end",
             "quote": "\\"",
             "spacing": Array [
               null,
               null,
             ],
           },
           "namespace": null,
           "quote": undefined,
           "quoteSpacing": undefined,
         },
         "parens": Array [],
         "spacing": null,
       },
       Column {
         "alias": null,
         "ex": RefExpression {
           "name": StringType {
             "chars": "size",
             "quote": "\\"",
             "spacing": Array [
               null,
               null,
             ],
           },
           "namespace": null,
           "quote": undefined,
           "quoteSpacing": undefined,
         },
         "parens": Array [],
         "spacing": null,
       },
       Column {
         "alias": null,
         "ex": RefExpression {
           "name": StringType {
             "chars": "version",
             "quote": "\\"",
             "spacing": Array [
               null,
               null,
             ],
           },
           "namespace": null,
           "quote": undefined,
           "quoteSpacing": undefined,
         },
         "parens": Array [],
         "spacing": null,
       },
       Column {
         "alias": null,
         "ex": RefExpression {
           "name": StringType {
             "chars": "partition_num",
             "quote": "\\"",
             "spacing": Array [
               null,
               null,
             ],
           },
           "namespace": null,
           "quote": undefined,
           "quoteSpacing": undefined,
         },
         "parens": Array [],
         "spacing": null,
       },
       Column {
         "alias": null,
         "ex": RefExpression {
           "name": StringType {
             "chars": "num_replicas",
             "quote": "\\"",
             "spacing": Array [
               null,
               null,
             ],
           },
           "namespace": null,
           "quote": undefined,
           "quoteSpacing": undefined,
         },
         "parens": Array [],
         "spacing": null,
       },
       Column {
         "alias": null,
         "ex": RefExpression {
           "name": StringType {
             "chars": "num_rows",
             "quote": "\\"",
             "spacing": Array [
               null,
               null,
             ],
           },
           "namespace": null,
           "quote": undefined,
           "quoteSpacing": undefined,
         },
         "parens": Array [],
         "spacing": null,
       },
       Column {
         "alias": null,
         "ex": RefExpression {
           "name": StringType {
             "chars": "is_published",
             "quote": "\\"",
             "spacing": Array [
               null,
               null,
             ],
           },
           "namespace": null,
           "quote": undefined,
           "quoteSpacing": undefined,
         },
         "parens": Array [],
         "spacing": null,
       },
       Column {
         "alias": null,
         "ex": RefExpression {
           "name": StringType {
             "chars": "is_available",
             "quote": "\\"",
             "spacing": Array [
               null,
               null,
             ],
           },
           "namespace": null,
           "quote": undefined,
           "quoteSpacing": undefined,
         },
         "parens": Array [],
         "spacing": null,
       },
       Column {
         "alias": null,
         "ex": RefExpression {
           "name": StringType {
             "chars": "is_realtime",
             "quote": "\\"",
             "spacing": Array [
               null,
               null,
             ],
           },
           "namespace": null,
           "quote": undefined,
           "quoteSpacing": undefined,
         },
         "parens": Array [],
         "spacing": null,
       },
       Column {
         "alias": null,
         "ex": RefExpression {
           "name": StringType {
             "chars": "is_overshadowed",
             "quote": "\\"",
             "spacing": Array [
               null,
               null,
             ],
           },
           "namespace": null,
           "quote": undefined,
           "quoteSpacing": undefined,
         },
         "parens": Array [],
         "spacing": null,
       },
       Column {
         "alias": null,
         "ex": RefExpression {
           "name": StringType {
             "chars": "payload",
             "quote": "\\"",
             "spacing": Array [
               null,
               null,
             ],
           },
           "namespace": null,
           "quote": undefined,
           "quoteSpacing": undefined,
         },
         "parens": Array [],
         "spacing": null,
       },
     ],
     "parens": Array [],
     "spacing": Array [
       " ",
       " ",
       " ",
       " ",
       " ",
       " ",
       " ",
       " ",
       " ",
       " ",
       " ",
       " ",
       " ",
     ],
   },
   "distinct": null,
   "fromClause": FromClause {
     "alias": null,
     "fc": RefExpression {
       "name": "segments",
       "namespace": "sys",
       "quote": undefined,
       "quoteSpacing": undefined,
     },
     "keyword": "FROM",
     "parens": undefined,
     "spacing": Array [
       " ",
       null,
     ],
   },
   "groupByClause": null,
   "havingClause": null,
   "limitClause": LimitClause {
     "keyword": "LIMIT",
     "spacing": Array [
       " ",
     ],
     "value": Array [
       Integer {
         "value": "50",
       },
     ],
   },
   "orderByClause": OrderByClause {
     "byKeyword": "BY",
     "orderBy": Array [
       OrderByPart {
         "direction": "DESC",
         "orderBy": StringType {
           "chars": "start",
           "quote": "\\"",
           "spacing": Array [
             null,
             null,
           ],
         },
         "spacing": Array [
           " ",
         ],
       },
     ],
     "orderKeyword": "ORDER",
     "spacing": Array [
       " ",
       " ",
     ],
   },
   "spacing": Array [
     null,
     " ",
     "
 ",
     null,
     null,
     null,
     "
 ",
     "
 ",
     "",
   ],
   "type": "query",
   "verb": "SELECT",
   "whereClause": null,
 }
```

## toString
Returns the SQL query represented by the SqlQuery object as a string.
```
const sqlString = ast.toString();
console.log(sqlString);
```
logs: 
```
SELECT "segment_id", "datasource", "start", "end", "size", "version", "partition_num", "num_replicas", "num_rows", "is_published", "is_available", "is_realtime", "is_overshadowed", "payload"
FROM sys.segments
ORDER BY "start" DESC
LIMIT 25
```

## orderBy
Returns an SqlQuery object with a new ORDER BY clause. Takes `column:string` and `direction: 'ASC' | 'DESC'` arguments 

```
const orderedAst = ast.toString('end', 'ASC');
console.log(orderedAst.toString());
```
logs: 
```
SELECT "segment_id", "datasource", "start", "end", "size", "version", "partition_num", "num_replicas", "num_rows", "is_published", "is_available", "is_realtime", "is_overshadowed", "payload"
FROM sys.segments
ORDER BY "end" ASC
LIMIT 25
```

ast: 
```
SqlQuery {
  "columns": Columns {
    "columns": Array [
      Column {
        "alias": null,
        "ex": RefExpression {
          "name": StringType {
            "chars": "segment_id",
            "quote": "\\"",
            "spacing": Array [
              null,
              null,
            ],
          },
          "namespace": null,
          "quote": undefined,
          "quoteSpacing": undefined,
        },
        "parens": Array [],
        "spacing": null,
      },
      Column {
        "alias": null,
        "ex": RefExpression {
          "name": StringType {
            "chars": "datasource",
            "quote": "\\"",
            "spacing": Array [
              null,
              null,
            ],
          },
          "namespace": null,
          "quote": undefined,
          "quoteSpacing": undefined,
        },
        "parens": Array [],
        "spacing": null,
      },
      Column {
        "alias": null,
        "ex": RefExpression {
          "name": StringType {
            "chars": "start",
            "quote": "\\"",
            "spacing": Array [
              null,
              null,
            ],
          },
          "namespace": null,
          "quote": undefined,
          "quoteSpacing": undefined,
        },
        "parens": Array [],
        "spacing": null,
      },
      Column {
        "alias": null,
        "ex": RefExpression {
          "name": StringType {
            "chars": "end",
            "quote": "\\"",
            "spacing": Array [
              null,
              null,
            ],
          },
          "namespace": null,
          "quote": undefined,
          "quoteSpacing": undefined,
        },
        "parens": Array [],
        "spacing": null,
      },
      Column {
        "alias": null,
        "ex": RefExpression {
          "name": StringType {
            "chars": "size",
            "quote": "\\"",
            "spacing": Array [
              null,
              null,
            ],
          },
          "namespace": null,
          "quote": undefined,
          "quoteSpacing": undefined,
        },
        "parens": Array [],
        "spacing": null,
      },
      Column {
        "alias": null,
        "ex": RefExpression {
          "name": StringType {
            "chars": "version",
            "quote": "\\"",
            "spacing": Array [
              null,
              null,
            ],
          },
          "namespace": null,
          "quote": undefined,
          "quoteSpacing": undefined,
        },
        "parens": Array [],
        "spacing": null,
      },
      Column {
        "alias": null,
        "ex": RefExpression {
          "name": StringType {
            "chars": "partition_num",
            "quote": "\\"",
            "spacing": Array [
              null,
              null,
            ],
          },
          "namespace": null,
          "quote": undefined,
          "quoteSpacing": undefined,
        },
        "parens": Array [],
        "spacing": null,
      },
      Column {
        "alias": null,
        "ex": RefExpression {
          "name": StringType {
            "chars": "num_replicas",
            "quote": "\\"",
            "spacing": Array [
              null,
              null,
            ],
          },
          "namespace": null,
          "quote": undefined,
          "quoteSpacing": undefined,
        },
        "parens": Array [],
        "spacing": null,
      },
      Column {
        "alias": null,
        "ex": RefExpression {
          "name": StringType {
            "chars": "num_rows",
            "quote": "\\"",
            "spacing": Array [
              null,
              null,
            ],
          },
          "namespace": null,
          "quote": undefined,
          "quoteSpacing": undefined,
        },
        "parens": Array [],
        "spacing": null,
      },
      Column {
        "alias": null,
        "ex": RefExpression {
          "name": StringType {
            "chars": "is_published",
            "quote": "\\"",
            "spacing": Array [
              null,
              null,
            ],
          },
          "namespace": null,
          "quote": undefined,
          "quoteSpacing": undefined,
        },
        "parens": Array [],
        "spacing": null,
      },
      Column {
        "alias": null,
        "ex": RefExpression {
          "name": StringType {
            "chars": "is_available",
            "quote": "\\"",
            "spacing": Array [
              null,
              null,
            ],
          },
          "namespace": null,
          "quote": undefined,
          "quoteSpacing": undefined,
        },
        "parens": Array [],
        "spacing": null,
      },
      Column {
        "alias": null,
        "ex": RefExpression {
          "name": StringType {
            "chars": "is_realtime",
            "quote": "\\"",
            "spacing": Array [
              null,
              null,
            ],
          },
          "namespace": null,
          "quote": undefined,
          "quoteSpacing": undefined,
        },
        "parens": Array [],
        "spacing": null,
      },
      Column {
        "alias": null,
        "ex": RefExpression {
          "name": StringType {
            "chars": "is_overshadowed",
            "quote": "\\"",
            "spacing": Array [
              null,
              null,
            ],
          },
          "namespace": null,
          "quote": undefined,
          "quoteSpacing": undefined,
        },
        "parens": Array [],
        "spacing": null,
      },
      Column {
        "alias": null,
        "ex": RefExpression {
          "name": StringType {
            "chars": "payload",
            "quote": "\\"",
            "spacing": Array [
              null,
              null,
            ],
          },
          "namespace": null,
          "quote": undefined,
          "quoteSpacing": undefined,
        },
        "parens": Array [],
        "spacing": null,
      },
    ],
    "parens": Array [],
    "spacing": Array [
      " ",
      " ",
      " ",
      " ",
      " ",
      " ",
      " ",
      " ",
      " ",
      " ",
      " ",
      " ",
      " ",
    ],
  },
  "distinct": null,
  "fromClause": FromClause {
    "alias": null,
    "fc": RefExpression {
      "name": "segments",
      "namespace": "sys",
      "quote": undefined,
      "quoteSpacing": undefined,
    },
    "keyword": "FROM",
    "parens": undefined,
    "spacing": Array [
      " ",
      null,
    ],
  },
  "groupByClause": null,
  "havingClause": null,
  "limitClause": LimitClause {
    "keyword": "LIMIT",
    "spacing": Array [
      " ",
    ],
    "value": Array [
      Integer {
        "value": "25",
      },
    ],
  },
  "orderByClause": OrderByClause {
    "byKeyword": "BY",
    "orderBy": Array [
      OrderByPart {
        "direction": "ASC",
        "orderBy": StringType {
          "chars": "end",
          "quote": "\\"",
          "spacing": Array [
            "",
            "",
          ],
        },
        "spacing": Array [
          " ",
        ],
      },
    ],
    "orderKeyword": "ORDER",
    "spacing": Array [
      " ",
      " ",
      "",
    ],
  },
  "spacing": Array [
    null,
    " ",
    "
  ",
    null,
    null,
    null,
    "
  ",
    "
  ",
    "",
  ],
  "type": "query",
  "verb": "SELECT",
  "whereClause": null,
 }
```
## excludeColumn
Returns an SqlQuery object with with the specified column removed from the SELECT, ORDER BY and GROUP BY clauses. Takes  a `column:string` argument. 

```
const excludeColumnAst = ast.excludeColumn('start');
console.log(excludeColumnAst.toString());
```
logs: 
```
SELECT "segment_id", "datasource", "end", "size", "version", "partition_num", "num_replicas", "num_rows", "is_published", "is_available", "is_realtime", "is_overshadowed", "payload"
FROM sys.segments
LIMIT 25
```

ast: 
```
SqlQuery {
  "columns": Columns {
    "columns": Array [
      Column {
        "alias": null,
        "ex": RefExpression {
          "name": StringType {
            "chars": "segment_id",
            "quote": "\"",
            "spacing": Array [
              null,
              null,
            ],
          },
          "namespace": null,
          "quote": undefined,
          "quoteSpacing": undefined,
        },
        "parens": Array [],
        "spacing": null,
      },
      Column {
        "alias": null,
        "ex": RefExpression {
          "name": StringType {
            "chars": "datasource",
            "quote": "\"",
            "spacing": Array [
              null,
              null,
            ],
          },
          "namespace": null,
          "quote": undefined,
          "quoteSpacing": undefined,
        },
        "parens": Array [],
        "spacing": null,
      },
      Column {
        "alias": null,
        "ex": RefExpression {
          "name": StringType {
            "chars": "end",
            "quote": "\"",
            "spacing": Array [
              null,
              null,
            ],
          },
          "namespace": null,
          "quote": undefined,
          "quoteSpacing": undefined,
        },
        "parens": Array [],
        "spacing": null,
      },
      Column {
        "alias": null,
        "ex": RefExpression {
          "name": StringType {
            "chars": "size",
            "quote": "\"",
            "spacing": Array [
              null,
              null,
            ],
          },
          "namespace": null,
          "quote": undefined,
          "quoteSpacing": undefined,
        },
        "parens": Array [],
        "spacing": null,
      },
      Column {
        "alias": null,
        "ex": RefExpression {
          "name": StringType {
            "chars": "version",
            "quote": "\"",
            "spacing": Array [
              null,
              null,
            ],
          },
          "namespace": null,
          "quote": undefined,
          "quoteSpacing": undefined,
        },
        "parens": Array [],
        "spacing": null,
      },
      Column {
        "alias": null,
        "ex": RefExpression {
          "name": StringType {
            "chars": "partition_num",
            "quote": "\"",
            "spacing": Array [
              null,
              null,
            ],
          },
          "namespace": null,
          "quote": undefined,
          "quoteSpacing": undefined,
        },
        "parens": Array [],
        "spacing": null,
      },
      Column {
        "alias": null,
        "ex": RefExpression {
          "name": StringType {
            "chars": "num_replicas",
            "quote": "\"",
            "spacing": Array [
              null,
              null,
            ],
          },
          "namespace": null,
          "quote": undefined,
          "quoteSpacing": undefined,
        },
        "parens": Array [],
        "spacing": null,
      },
      Column {
        "alias": null,
        "ex": RefExpression {
          "name": StringType {
            "chars": "num_rows",
            "quote": "\"",
            "spacing": Array [
              null,
              null,
            ],
          },
          "namespace": null,
          "quote": undefined,
          "quoteSpacing": undefined,
        },
        "parens": Array [],
        "spacing": null,
      },
      Column {
        "alias": null,
        "ex": RefExpression {
          "name": StringType {
            "chars": "is_published",
            "quote": "\"",
            "spacing": Array [
              null,
              null,
            ],
          },
          "namespace": null,
          "quote": undefined,
          "quoteSpacing": undefined,
        },
        "parens": Array [],
        "spacing": null,
      },
      Column {
        "alias": null,
        "ex": RefExpression {
          "name": StringType {
            "chars": "is_available",
            "quote": "\"",
            "spacing": Array [
              null,
              null,
            ],
          },
          "namespace": null,
          "quote": undefined,
          "quoteSpacing": undefined,
        },
        "parens": Array [],
        "spacing": null,
      },
      Column {
        "alias": null,
        "ex": RefExpression {
          "name": StringType {
            "chars": "is_realtime",
            "quote": "\"",
            "spacing": Array [
              null,
              null,
            ],
          },
          "namespace": null,
          "quote": undefined,
          "quoteSpacing": undefined,
        },
        "parens": Array [],
        "spacing": null,
      },
      Column {
        "alias": null,
        "ex": RefExpression {
          "name": StringType {
            "chars": "is_overshadowed",
            "quote": "\"",
            "spacing": Array [
              null,
              null,
            ],
          },
          "namespace": null,
          "quote": undefined,
          "quoteSpacing": undefined,
        },
        "parens": Array [],
        "spacing": null,
      },
      Column {
        "alias": null,
        "ex": RefExpression {
          "name": StringType {
            "chars": "payload",
            "quote": "\"",
            "spacing": Array [
              null,
              null,
            ],
          },
          "namespace": null,
          "quote": undefined,
          "quoteSpacing": undefined,
        },
        "parens": Array [],
        "spacing": null,
      },
    ],
    "parens": Array [],
    "spacing": Array [
      " ",
      " ",
      " ",
      " ",
      " ",
      " ",
      " ",
      " ",
      " ",
      " ",
      " ",
      " ",
      undefined,
    ],
  },
  "distinct": null,
  "fromClause": FromClause {
    "alias": null,
    "fc": RefExpression {
      "name": "segments",
      "namespace": "sys",
      "quote": undefined,
      "quoteSpacing": undefined,
    },
    "keyword": "FROM",
    "parens": undefined,
    "spacing": Array [
      " ",
      null,
    ],
  },
  "groupByClause": undefined,
  "havingClause": null,
  "limitClause": LimitClause {
    "keyword": "LIMIT",
    "spacing": Array [
      " ",
    ],
    "value": Array [
      Integer {
        "value": "25",
      },
    ],
  },
  "orderByClause": undefined,
  "spacing": Array [
    null,
    " ",
    "
  ",
    null,
    null,
    null,
    "
  ",
    "
  ",
    "",
  ],
  "type": "query",
  "verb": "SELECT",
  "whereClause": null
 }
```

## filterRow
Returns an SqlQuery object with a WHERE clause filtered on the specified row and value. Takes `header:string, row:string, operator: '!=' | '='` arguments. 
                   
```
const filterRowAst  = ast.filterRow('datasource','github', '!=');
console.log(filterRowAst .toString());
```
logs: 
```
SELECT "segment_id", "datasource", "start", "end", "size", "version", "partition_num", "num_replicas", "num_rows", "is_published", "is_available", "is_realtime", "is_overshadowed", "payload"
FROM sys.segments
WHERE "datasource"!='rowvalue'
ORDER BY "start" DESC
LIMIT 25"
```

ast: 
```
SqlQuery {
  "columns": Columns {
    "columns": Array [
      Column {
        "alias": null,
        "ex": RefExpression {
          "name": StringType {
            "chars": "segment_id",
            "quote": "\"",
            "spacing": Array [
              null,
              null,
            ],
          },
          "namespace": null,
          "quote": undefined,
          "quoteSpacing": undefined,
        },
        "parens": Array [],
        "spacing": null,
      },
      Column {
        "alias": null,
        "ex": RefExpression {
          "name": StringType {
            "chars": "datasource",
            "quote": "\"",
            "spacing": Array [
              null,
              null,
            ],
          },
          "namespace": null,
          "quote": undefined,
          "quoteSpacing": undefined,
        },
        "parens": Array [],
        "spacing": null,
      },
      Column {
        "alias": null,
        "ex": RefExpression {
          "name": StringType {
            "chars": "start",
            "quote": "\"",
            "spacing": Array [
              null,
              null,
            ],
          },
          "namespace": null,
          "quote": undefined,
          "quoteSpacing": undefined,
        },
        "parens": Array [],
        "spacing": null,
      },
      Column {
        "alias": null,
        "ex": RefExpression {
          "name": StringType {
            "chars": "end",
            "quote": "\"",
            "spacing": Array [
              null,
              null,
            ],
          },
          "namespace": null,
          "quote": undefined,
          "quoteSpacing": undefined,
        },
        "parens": Array [],
        "spacing": null,
      },
      Column {
        "alias": null,
        "ex": RefExpression {
          "name": StringType {
            "chars": "size",
            "quote": "\"",
            "spacing": Array [
              null,
              null,
            ],
          },
          "namespace": null,
          "quote": undefined,
          "quoteSpacing": undefined,
        },
        "parens": Array [],
        "spacing": null,
      },
      Column {
        "alias": null,
        "ex": RefExpression {
          "name": StringType {
            "chars": "version",
            "quote": "\"",
            "spacing": Array [
              null,
              null,
            ],
          },
          "namespace": null,
          "quote": undefined,
          "quoteSpacing": undefined,
        },
        "parens": Array [],
        "spacing": null,
      },
      Column {
        "alias": null,
        "ex": RefExpression {
          "name": StringType {
            "chars": "partition_num",
            "quote": "\"",
            "spacing": Array [
              null,
              null,
            ],
          },
          "namespace": null,
          "quote": undefined,
          "quoteSpacing": undefined,
        },
        "parens": Array [],
        "spacing": null,
      },
      Column {
        "alias": null,
        "ex": RefExpression {
          "name": StringType {
            "chars": "num_replicas",
            "quote": "\"",
            "spacing": Array [
              null,
              null,
            ],
          },
          "namespace": null,
          "quote": undefined,
          "quoteSpacing": undefined,
        },
        "parens": Array [],
        "spacing": null,
      },
      Column {
        "alias": null,
        "ex": RefExpression {
          "name": StringType {
            "chars": "num_rows",
            "quote": "\"",
            "spacing": Array [
              null,
              null,
            ],
          },
          "namespace": null,
          "quote": undefined,
          "quoteSpacing": undefined,
        },
        "parens": Array [],
        "spacing": null,
      },
      Column {
        "alias": null,
        "ex": RefExpression {
          "name": StringType {
            "chars": "is_published",
            "quote": "\"",
            "spacing": Array [
              null,
              null,
            ],
          },
          "namespace": null,
          "quote": undefined,
          "quoteSpacing": undefined,
        },
        "parens": Array [],
        "spacing": null,
      },
      Column {
        "alias": null,
        "ex": RefExpression {
          "name": StringType {
            "chars": "is_available",
            "quote": "\"",
            "spacing": Array [
              null,
              null,
            ],
          },
          "namespace": null,
          "quote": undefined,
          "quoteSpacing": undefined,
        },
        "parens": Array [],
        "spacing": null,
      },
      Column {
        "alias": null,
        "ex": RefExpression {
          "name": StringType {
            "chars": "is_realtime",
            "quote": "\"",
            "spacing": Array [
              null,
              null,
            ],
          },
          "namespace": null,
          "quote": undefined,
          "quoteSpacing": undefined,
        },
        "parens": Array [],
        "spacing": null,
      },
      Column {
        "alias": null,
        "ex": RefExpression {
          "name": StringType {
            "chars": "is_overshadowed",
            "quote": "\"",
            "spacing": Array [
              null,
              null,
            ],
          },
          "namespace": null,
          "quote": undefined,
          "quoteSpacing": undefined,
        },
        "parens": Array [],
        "spacing": null,
      },
      Column {
        "alias": null,
        "ex": RefExpression {
          "name": StringType {
            "chars": "payload",
            "quote": "\"",
            "spacing": Array [
              null,
              null,
            ],
          },
          "namespace": null,
          "quote": undefined,
          "quoteSpacing": undefined,
        },
        "parens": Array [],
        "spacing": null,
      },
    ],
    "parens": Array [],
    "spacing": Array [
      " ",
      " ",
      " ",
      " ",
      " ",
      " ",
      " ",
      " ",
      " ",
      " ",
      " ",
      " ",
      " ",
    ],
  },
  "distinct": null,
  "fromClause": FromClause {
    "alias": null,
    "fc": RefExpression {
      "name": "segments",
      "namespace": "sys",
      "quote": undefined,
      "quoteSpacing": undefined,
    },
    "keyword": "FROM",
    "parens": undefined,
    "spacing": Array [
      " ",
      null,
    ],
  },
  "groupByClause": null,
  "havingClause": null,
  "limitClause": LimitClause {
    "keyword": "LIMIT",
    "spacing": Array [
      " ",
    ],
    "value": Array [
      Integer {
        "value": "25",
      },
    ],
  },
  "orderByClause": OrderByClause {
    "byKeyword": "BY",
    "orderBy": Array [
      OrderByPart {
        "direction": "DESC",
        "orderBy": StringType {
          "chars": "start",
          "quote": "\"",
          "spacing": Array [
            null,
            null,
          ],
        },
        "spacing": Array [
          " ",
        ],
      },
    ],
    "orderKeyword": "ORDER",
    "spacing": Array [
      " ",
      " ",
    ],
  },
  "spacing": Array [
    null,
    " ",
    "
  ",
    "
  ",
    null,
    null,
    "
  ",
    "
  ",
    "",
  ],
  "type": "query",
  "verb": "SELECT",
  "whereClause": WhereClause {
    "filter": ComparisonExpression {
      "ex": StringType {
        "chars": "datasource",
        "quote": "\"",
        "spacing": Array [
          "",
          "",
        ],
      },
      "parens": Array [],
      "rhs": ComparisonExpressionRhs {
        "is": null,
        "not": null,
        "op": "!=",
        "parens": Array [],
        "rhs": StringType {
          "chars": "github",
          "quote": "'",
          "spacing": Array [
            "",
            "",
          ],
        },
        "spacing": Array [
          "",
        ],
      },
      "spacing": Array [
        "",
      ],
    },
    "keyword": "WHERE",
    "spacing": Array [
      " ",
    ],
  },
}
```

## getSorted
Returns an array of objects of type `{desc: string, id:string}` representing the direction of each column in the ORDER BY clause.
```
const getSortedArray = ast.getSorted();
console.log(getSortedArray);
```
logs: 
```
Array [
  Object {
    "desc": true,
    "id": "start",
  },
]
  ```
  
## getSchema
Returns the schema of the table in the FROM clause as a string.
```
const schema = ast.getSchema();
console.log(schema);
```
logs:                 
```
sys
```

## getTableName
Returns the name of the table in the FROM clause as a string.
```
const table = ast.getTableName();
console.log(table);
```
     
 logs:                 
```
segments
```

## getAggregateColumns
Returns an array of strings containing the names of the aggregate columns.
```
const aggregateColumns = ast.getAggregateColumns();
console.log(aggregateColumns);
```
     
 logs:                 
```
Array [
  "segment_id",
  "datasource",
  "start",
  "end",
  "size",
  "version",
  "partition_num",
  "num_replicas",
  "num_rows",
  "is_published",
  "is_available",
  "is_realtime",
  "is_overshadowed",
  "payload",
]
```

## License 

[Apache 2.0](LICENSE)
