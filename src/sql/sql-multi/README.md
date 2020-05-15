# SqlMulti

A class used to represent boolean, mathematical and comparison expressions of the form: 
`SqlBase` `operator` `SqlBase`

String: 

```
A OR B AND C > D + E
```

SqlMulti:
```
SqlMulti {
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
          SqlMulti {
            "arguments": Array [
              SqlRef {
                "column": "B",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": undefined,
                "quotes": "",
                "table": undefined,
                "tableQuotes": undefined,
                "type": "ref",
              },
              SqlMulti {
                "arguments": Array [
                  SqlRef {
                    "column": "C",
                    "innerSpacing": Object {},
                    "namespace": undefined,
                    "namespaceQuotes": undefined,
                    "quotes": "",
                    "table": undefined,
                    "tableQuotes": undefined,
                    "type": "ref",
                  },
                  SqlMulti {
                    "arguments": Array [
                      SqlRef {
                        "column": "D",
                        "innerSpacing": Object {},
                        "namespace": undefined,
                        "namespaceQuotes": undefined,
                        "quotes": "",
                        "table": undefined,
                        "tableQuotes": undefined,
                        "type": "ref",
                      },
                      SqlRef {
                        "column": "E",
                        "innerSpacing": Object {},
                        "namespace": undefined,
                        "namespaceQuotes": undefined,
                        "quotes": "",
                        "table": undefined,
                        "tableQuotes": undefined,
                        "type": "ref",
                      },
                    ],
                    "expressionType": "Additive",
                    "innerSpacing": Object {},
                    "separators": Array [
                      Separator {
                        "left": " ",
                        "right": " ",
                        "separator": "+",
                      },
                    ],
                    "type": "multi",
                  },
                ],
                "expressionType": "Comparison",
                "innerSpacing": Object {},
                "separators": Array [
                  Separator {
                    "left": " ",
                    "right": " ",
                    "separator": ">",
                  },
                ],
                "type": "multi",
              },
            ],
            "expressionType": "AND",
            "innerSpacing": Object {},
            "separators": Array [
              Separator {
                "left": " ",
                "right": " ",
                "separator": "AND",
              },
            ],
            "type": "multi",
          },
        ],
        "expressionType": "OR",
        "innerSpacing": Object {},
        "separators": Array [
          Separator {
            "left": " ",
            "right": " ",
            "separator": "OR",
          },
        ],
        "type": "multi",
      }
```

## License 
[Apache 2.0](LICENSE)
