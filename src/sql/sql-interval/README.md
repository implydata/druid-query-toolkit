# SqlInterval

A class used to represent interval literals

String: 

```
INTERVAL '1-2' YEAR_MONTH"
```

SqlUnary:
```
SqlInterval {
        "innerSpacing": Object {
          "postIntervalKeyword": " ",
          "postIntervalValue": " ",
        },
        "intervalKeyword": "INTERVAL",
        "intervalValue": SqlLiteral {
          "innerSpacing": Object {},
          "quotes": "'",
          "stringValue": "1-2",
          "type": "literal",
          "value": "1-2",
        },
        "type": "interval",
        "unitKeyword": "YEAR_MONTH",
      }
```

## License 
[Apache 2.0](LICENSE)
