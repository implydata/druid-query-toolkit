# SqlTimeStamp

A class used to represent timestamp literals

String: 

```
TIMESTAMP '2020-02-25 00:00:00'
```

SqlUnary:
```
 SqlTimestamp {
        "innerSpacing": Object {
          "postTimestampKeyword": " ",
        },
        "timestampKeyword": "TIMESTAMP",
        "timestampValue": SqlLiteral {
          "innerSpacing": Object {},
          "quotes": "'",
          "stringValue": "2020-02-25 00:00:00",
          "type": "literal",
          "value": "2020-02-25 00:00:00",
        },
        "type": "timestamp",
      }
```

## License 
[Apache 2.0](LICENSE)
