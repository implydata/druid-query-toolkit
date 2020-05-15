# SqlFunction

A class used to represent function of the form:<br>
`FunctionKeyword` `(` `arguments` `)`

An string array of `FunctionKeywords` can be passed in to the parser constructor to define all supported functions.

String
```
SUM(A)
```

SqlFunction:
```
SqlFunction {
    "arguments": Array [
      SqlRef {
        "column": "A",
        "innerSpacing": Object {},
        "namespace": undefined,
        "namespaceQuotes": undefined,
        "quotes": "",
        "table": undefined,
        "tableQuotes": undefined,
        "type": "ref",
      },
    ],
    "decorator": undefined,
    "filterKeyword": undefined,
    "functionName": "SUM",
    "innerSpacing": Object {
      "postDecorator": "",
      "postFilterKeyword": "",
      "postFilterLeftParen": "",
      "postLeftParen": "",
      "postName": "",
      "postWhereKeyword": "",
      "preFilter": "",
      "preFilterRightParen": "",
      "preRightParen": "",
    },
    "separators": Array [],
    "type": "function",
    "whereExpression": undefined,
    "whereKeyword": undefined,
  }
```
## License 
[Apache 2.0](LICENSE)
