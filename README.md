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
ast = parser(`SELECT "segment_id", "datasource", "start", "end", "size", "version", "partition_num", "num_replicas", "num_rows", "is_published", "is_available", "is_realtime", "is_overshadowed"
FROM sys.segments
ORDER BY "start" DESC
LIMIT 25`);
console.log(ast); 
```      

logs:

 ```
 SqlQuery {
         "explainKeyword": "",
         "fromKeyword": "FROM",
         "groupByExpression": undefined,
         "groupByExpressionSeparators": undefined,
         "groupByKeyword": undefined,
         "havingExpression": undefined,
         "havingKeyword": undefined,
         "innerSpacing": Object {
           "postExplain": "",
           "postFrom": " ",
           "postJoinKeyword": "",
           "postJoinTable": "",
           "postJoinType": "",
           "postLimitKeyword": " ",
           "postOn": "",
           "postOrderByKeyword": " ",
           "postQuery": "",
           "postSelect": " ",
           "postSelectDecorator": "",
           "postSelectValues": "
       ",
           "postUnionKeyword": "",
           "postWith": "",
           "postWithQuery": "",
           "preGroupByKeyword": "",
           "preHavingKeyword": "",
           "preJoin": "",
           "preLimitKeyword": "
       ",
           "preOrderByKeyword": "
       ",
           "preQuery": "",
           "preUnionKeyword": "",
           "preWhereKeyword": "",
         },
         "joinKeyword": undefined,
         "joinTable": undefined,
         "joinType": undefined,
         "limitKeyword": "LIMIT",
         "limitValue": SqlLiteral {
           "innerSpacing": Object {},
           "quotes": "",
           "stringValue": "25",
           "type": "literal",
           "value": 25,
         },
         "onExpression": undefined,
         "onKeyword": undefined,
         "orderByKeyword": "ORDER BY",
         "orderBySeparators": Array [],
         "orderByUnits": Array [
           Object {
             "direction": "DESC",
             "expression": SqlRef {
               "column": "start",
               "innerSpacing": Object {},
               "namespace": undefined,
               "namespaceQuotes": undefined,
               "quotes": "\\"",
               "table": undefined,
               "tableQuotes": undefined,
               "type": "ref",
             },
             "postExpression": " ",
           },
         ],
         "postQueryAnnotation": Array [],
         "selectAnnotations": Array [
           null,
           null,
           null,
           null,
           null,
           null,
           null,
           null,
           null,
           null,
           null,
           null,
           null,
           null,
         ],
         "selectDecorator": "",
         "selectKeyword": "SELECT",
         "selectSeparators": Array [
           Separator {
             "left": "",
             "right": " ",
             "separator": ",",
           },
           Separator {
             "left": "",
             "right": " ",
             "separator": ",",
           },
           Separator {
             "left": "",
             "right": " ",
             "separator": ",",
           },
           Separator {
             "left": "",
             "right": " ",
             "separator": ",",
           },
           Separator {
             "left": "",
             "right": " ",
             "separator": ",",
           },
           Separator {
             "left": "",
             "right": " ",
             "separator": ",",
           },
           Separator {
             "left": "",
             "right": " ",
             "separator": ",",
           },
           Separator {
             "left": "",
             "right": " ",
             "separator": ",",
           },
           Separator {
             "left": "",
             "right": " ",
             "separator": ",",
           },
           Separator {
             "left": "",
             "right": " ",
             "separator": ",",
           },
           Separator {
             "left": "",
             "right": " ",
             "separator": ",",
           },
           Separator {
             "left": "",
             "right": " ",
             "separator": ",",
           },
           Separator {
             "left": "",
             "right": " ",
             "separator": ",",
           },
         ],
         "selectValues": Array [
           SqlRef {
             "column": "segment_id",
             "innerSpacing": Object {},
             "namespace": undefined,
             "namespaceQuotes": undefined,
             "quotes": "\\"",
             "table": undefined,
             "tableQuotes": undefined,
             "type": "ref",
           },
           SqlRef {
             "column": "datasource",
             "innerSpacing": Object {},
             "namespace": undefined,
             "namespaceQuotes": undefined,
             "quotes": "\\"",
             "table": undefined,
             "tableQuotes": undefined,
             "type": "ref",
           },
           SqlRef {
             "column": "start",
             "innerSpacing": Object {},
             "namespace": undefined,
             "namespaceQuotes": undefined,
             "quotes": "\\"",
             "table": undefined,
             "tableQuotes": undefined,
             "type": "ref",
           },
           SqlRef {
             "column": "end",
             "innerSpacing": Object {},
             "namespace": undefined,
             "namespaceQuotes": undefined,
             "quotes": "\\"",
             "table": undefined,
             "tableQuotes": undefined,
             "type": "ref",
           },
           SqlRef {
             "column": "size",
             "innerSpacing": Object {},
             "namespace": undefined,
             "namespaceQuotes": undefined,
             "quotes": "\\"",
             "table": undefined,
             "tableQuotes": undefined,
             "type": "ref",
           },
           SqlRef {
             "column": "version",
             "innerSpacing": Object {},
             "namespace": undefined,
             "namespaceQuotes": undefined,
             "quotes": "\\"",
             "table": undefined,
             "tableQuotes": undefined,
             "type": "ref",
           },
           SqlRef {
             "column": "partition_num",
             "innerSpacing": Object {},
             "namespace": undefined,
             "namespaceQuotes": undefined,
             "quotes": "\\"",
             "table": undefined,
             "tableQuotes": undefined,
             "type": "ref",
           },
           SqlRef {
             "column": "num_replicas",
             "innerSpacing": Object {},
             "namespace": undefined,
             "namespaceQuotes": undefined,
             "quotes": "\\"",
             "table": undefined,
             "tableQuotes": undefined,
             "type": "ref",
           },
           SqlRef {
             "column": "num_rows",
             "innerSpacing": Object {},
             "namespace": undefined,
             "namespaceQuotes": undefined,
             "quotes": "\\"",
             "table": undefined,
             "tableQuotes": undefined,
             "type": "ref",
           },
           SqlRef {
             "column": "is_published",
             "innerSpacing": Object {},
             "namespace": undefined,
             "namespaceQuotes": undefined,
             "quotes": "\\"",
             "table": undefined,
             "tableQuotes": undefined,
             "type": "ref",
           },
           SqlRef {
             "column": "is_available",
             "innerSpacing": Object {},
             "namespace": undefined,
             "namespaceQuotes": undefined,
             "quotes": "\\"",
             "table": undefined,
             "tableQuotes": undefined,
             "type": "ref",
           },
           SqlRef {
             "column": "is_realtime",
             "innerSpacing": Object {},
             "namespace": undefined,
             "namespaceQuotes": undefined,
             "quotes": "\\"",
             "table": undefined,
             "tableQuotes": undefined,
             "type": "ref",
           },
           SqlRef {
             "column": "is_overshadowed",
             "innerSpacing": Object {},
             "namespace": undefined,
             "namespaceQuotes": undefined,
             "quotes": "\\"",
             "table": undefined,
             "tableQuotes": undefined,
             "type": "ref",
           },
         ],
         "tableSeparators": Array [],
         "tables": Array [
           SqlRef {
             "column": undefined,
             "innerSpacing": Object {
               "postTable": "",
               "preTable": "",
             },
             "namespace": "sys",
             "namespaceQuotes": "",
             "quotes": undefined,
             "table": "segments",
             "tableQuotes": "",
             "type": "ref",
           },
         ],
         "type": "query",
         "unionKeyword": undefined,
         "unionQuery": undefined,
         "whereExpression": undefined,
         "whereKeyword": undefined,
         "withKeyword": undefined,
         "withSeparators": undefined,
         "withUnits": undefined,
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
SELECT "segment_id", "datasource", "start", "end", "size", "version", "partition_num", "num_replicas", "num_rows", "is_published", "is_available", "is_realtime", "is_overshadowed"
FROM sys.segments
ORDER BY "start" DESC
LIMIT 25
```

## orderBy
Returns an SqlQuery object with a new ORDER BY clause. 
Takes arguments:<br>
`column:string` <br>
`direction: 'ASC' | 'DESC'`

```
const orderedAst = ast.toString('end', 'ASC');
console.log(orderedAst.toString());
```
logs: 
```
SELECT "segment_id", "datasource", "start", "end", "size", "version", "partition_num", "num_replicas", "num_rows", "is_published", "is_available", "is_realtime", "is_overshadowed"
FROM sys.segments
ORDER BY "end" ASC
LIMIT 25
```

## excludeColumn
Returns an SqlQuery object with with the specified column removed from the SELECT, ORDER BY and GROUP BY clauses.
Takes arguement:<br>
 `column:string`  

```
const excludeColumnAst = ast.excludeColumn('start');
console.log(excludeColumnAst.toString());
```
logs: 
```
SELECT "segment_id", "datasource", "end", "size", "version", "partition_num", "num_replicas", "num_rows", "is_published", "is_available", "is_realtime", "is_overshadowed"
FROM sys.segments
LIMIT 25
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
]
```

## GetCurrentFilters
Returns an array of the string names of all the columns currently being used byy the having and where filters
    
```
let query = parser(`SELECT column, SUM(column1) As aggregated, column2
                      FROM sys."github"
                      Group By column2
                      Having column > 1 AND aggregated < 100`);
query = query.getCurrentFilters();
console.log(query.toString());
```
logs:                 
```
["column", "aggregated"]
```

## AddToGroupBy
Adds a column with no alias to the group by clause and the select clause

Takes argument: <br/>
    `column: SqlBase`<br>
    
```
let query = parser(`select Count(*) from table`);
query = query.addToGroupBy(SqlRef.fromStringWithDoubleQuotes('column');
console.log(query.toString());
```
 logs:                 
```
select "column", Count(*) from table 
    GROUP BY 1
```

## AddAggregateColumn
Adds an aggregate column to the select
Takes arguments: <br/>
    `columns: SqlBase[]`<br>
     `functionName: string`<br>
     `alias: string`<br>
     `filter?: SqlBase`<br>
     `decorator?: string`
    
```
let query = parser(`select column1 from table`);
query = query.addAggregateColumn([SqlRef.fromString('column2')], 'min', 'alias');
console.log(query.toString());
```
 logs:                 
```
select column1, min(column2) AS "alias" from table
```

## GetColumns
Returns an array of the string names of all columns in the select clause.
```
let query = parser(`SELECT column, column1, column2
                      FROM sys."github"`);
query = query.getColumns();
console.log(query.toString());
```
 logs:                 
```
["column", "column1", "column2"]
```

## HasGroupByColumn
Checks to see if a column is in the group by clause either by name or index
Takes argument: <br/>
    `column: string`

```
let query = parser(`SELECT column, column1, column2
                      FROM sys."github"
                      Group By column, 3`);
query = query.hasGroupByColumn("column2");
console.log(query.toString());
```
 logs:                 
```
true
```

## ReplaceFrom
Replaces the `From` value of an SqlQuery Object, allowing you to which the the table in the select clause.  
Takes argument: <br/>
    `table: string`

```
let query = parser(`SELECT countryName from wikipedia`);
query = query.replaceFrom("anotherTable");
console.log(query.toString());
```
 logs:                 
```
"SELECT countryName from anotherTable"
```

## AddJoin
Adds either an "INNER" or "LEFT" Join to an existing SqlQuery object. 
Takes arguments: <br/>
    `type: 'LEFT' | 'INNER'`<br/>
    `joinTable: SqlRef`<br/>
    `onExpression: SqlMulti`

```
let query = parser(`SELECT countryName from wikipedia`)
query = query.addJoin(
          'LEFT',
          SqlRef.fromString('country', 'lookup'),
          SqlMulti.sqlMultiFactory('=', [
            SqlRef.fromString('v', 'country', 'lookup'),
            SqlRef.fromString('countryName', 'wikipedia'),
          ]),
        );
console.log(query.toString());
```
     
 logs:                 
```
"SELECT countryName from wikipedia 
LEFT JOIN lookup.country ON lookup.country.v = wikipedia.countryName"
```

## RemoveJoin
Removes the Join clause from an SqlQuery object. 
```
let query = parser(`SELECT countryName from wikipedia
      LEFT JOIN lookup.country ON lookup.country.v = wikipedia.countryName`);
query = query.removeJoin();
console.log(query.toSting());
```
     
 logs:                 
```
SELECT countryName from wikipedia
```
## License 
[Apache 2.0](LICENSE)
