# SqlCaseSimple

A class used to represent a case expression that takes the form:<br>
`CASE expr WHEN value1 THEN result1 \[ WHEN value2 THEN result2 ... \] \[ ELSE resultN \] END` <br>

String: 

```
CASE WHEN B THEN C ELSE D END
```

SqlCaseSimple:
```
SqlCaseSimple {
        "caseExpression": SqlRef {
          "column": "A",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "table": undefined,
          "tableQuotes": undefined,
          "type": "ref",
        },
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
          "postCaseExpression": " ",
          "postElse": " ",
          "postWhenThen": " ",
          "preEnd": " ",
        },
        "postWhenThenUnits": Array [],
        "type": "caseSimple",
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
