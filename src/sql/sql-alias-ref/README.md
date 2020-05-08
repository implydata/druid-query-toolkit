# SqlAliasRef

A class used to represent a SqlBase value such as a function with an alias. A SqlAliasRef takes the form:<br>
`Column` `AS` `SqlRef` <br>
The keyword as is case insensitive. 

String: 

```
Sum(*) As sums
```

SqlUnary:
```
          SqlAliasRef {
            "alias": SqlRef {
              "column": "sums",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "table": undefined,
              "tableQuotes": undefined,
              "type": "ref",
            },
            "asKeyword": "As",
            "column": SqlFunction {
              "arguments": Array [
                SqlRef {
                  "column": "*",
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
              "functionName": "Sum",
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
            },
            "innerSpacing": Object {
              "postAs": " ",
            },
            "postColumn": " ",
            "type": "alias-ref",
          }
```
## upgrade 
The upgrade calls upgrade() on the alias value. 
The function changes the SqlRef of the Alias representing `table.column` to represent the form `namespace.table`.

## License 
[Apache 2.0](LICENSE)
