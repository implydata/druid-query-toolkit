# SqlUnary

A class used to represent sql unary expressions of the shape: 
`Keword`  `Arguement`

String: 

```
NOT B
```

SqlUnary:
```
SqlUnary {
        "argument": SqlRef {
          "column": "B",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "table": undefined,
          "tableQuotes": undefined,
          "type": "ref",
        },
        "expressionType": "NOT",
        "innerSpacing": Object {
          "postKeyword": " ",
        },
        "keyword": "NOT",
        "type": "unaryExpression",
      }
```

## License 
[Apache 2.0](LICENSE)
