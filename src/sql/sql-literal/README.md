# SqlLiteral

A class used to represent Null, boolean, string and number literals.

## Number literals 
Sql literal can represent both decimal an integer numbers. 

String
```angular2
1
```

SqlLiteral:
```
SqlLiteral {
        "innerSpacing": Object {},
        "quotes": "",
        "stringValue": "1",
        "type": "literal",
        "value": 1,
      }
```

String
```angular2
1
```

SqlLiteral:
```
SqlLiteral {
        "innerSpacing": Object {},
        "quotes": "",
        "stringValue": "1",
        "type": "literal",
        "value": 1,
      }
```

## Null and boolean literals 
The literals true, false and null can all be represented as an SqlLiteral, These literals are case insensitive. 
String
```
NULL
```

SqlLiteral:
```
SqlLiteral {
        "innerSpacing": Object {},
        "quotes": "",
        "stringValue": "NULL",
        "type": "literal",
        "value": "NULL",
      }
```


Sql literal can represent a string wrapped in single quotes. 

String
```angular2
'word'
```

SqlLiteral:
```
 SqlLiteral {
        "innerSpacing": Object {},
        "quotes": "'",
        "stringValue": "word",
        "type": "literal",
        "value": "word",
      }
```
## License 
[Apache 2.0](LICENSE)
