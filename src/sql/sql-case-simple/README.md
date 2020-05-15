# SqlCaseSearched

A class used to represent a case expression that takes the form:<br>
`CASE WHEN boolean_expr1 THEN result1 \[ WHEN boolean_expr2 THEN result2 ... \] \[ ELSE resultN \] END` <br>

String: 

```
CASE A WHEN B THEN C ELSE D END
```

SqlCaseSearched:
```
      SqlCaseSearched {
             "caseKeyword": "CASE",
             "elseExpression": SqlRef {
               "column": "D",
               "innerSpacing": Object {},
               "namespace": undefined,
               "namespaceQuotes": undefined,
               "quotes": "",
               "table": undefined,
               "tableQuotes": undefined,
               "type": "ref",
             },
             "elseKeyword": "ELSE",
             "endKeyword": "END",
             "innerSpacing": Object {
               "postCase": " ",
               "postElse": " ",
               "postWhenThen": " ",
               "preEnd": " ",
             },
             "postWhenThenUnitSpaces": Array [],
             "type": "caseSearched",
             "whenThenUnits": Array [
               Object {
                 "postThenSpace": " ",
                 "postWhenExpressionSpace": " ",
                 "postWhenSpace": " ",
                 "thenExpression": SqlRef {
                   "column": "C",
                   "innerSpacing": Object {},
                   "namespace": undefined,
                   "namespaceQuotes": undefined,
                   "quotes": "",
                   "table": undefined,
                   "tableQuotes": undefined,
                   "type": "ref",
                 },
                 "thenKeyword": "THEN",
                 "whenExpression": SqlRef {
                   "column": "B",
                   "innerSpacing": Object {},
                   "namespace": undefined,
                   "namespaceQuotes": undefined,
                   "quotes": "",
                   "table": undefined,
                   "tableQuotes": undefined,
                   "type": "ref",
                 },
                 "whenKeyword": "WHEN",
               },
             ],
           }
```
## upgrade 
The upgrade calls upgrade() on the alias value. 
The function changes the SqlRef of the Alias representing `table.column` to represent the form `namespace.table`.

## License 
[Apache 2.0](LICENSE)
