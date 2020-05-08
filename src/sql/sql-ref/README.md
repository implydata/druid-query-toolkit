# SqlRef

A class used to sqlRef with no alias, such as a column, namespace or table. Sql Refs can be unquoted or quoted with double quotes. 
SqlRef take the shape: <br>
   `namespace` `.`? `table` `.` ?`column`

String: 

```
"test"."namespace"
```

SqlUnary:
```
 SqlRef {
         "column": "namespace",
         "innerSpacing": Object {},
         "namespace": undefined,
         "namespaceQuotes": undefined,
         "quotes": "\"",
         "table": "test",
         "tableQuotes": "\"",
         "type": "ref",
       }
```
## upgrade 
The upgrade function changes a SqlRef representing `table.column` to represent the form `namespace.table`


String
```angular2
"namespace"."table"
```

Before upgrade():
```
SqlRef {
        "column": "table",
        "innerSpacing": Object {},
        "namespace": undefined,
        "namespaceQuotes": undefined,
        "quotes": "",
        "table": "namespace",
        "tableQuotes": "\"",
        "type": "ref",
      }
```
After upgrade():
```
SqlRef {
        SqlRef {
                "column": undefined,
                "innerSpacing": Object {
                  "postTable": "",
                  "preTable": "",
                },
                "namespace": "namespace",
                "namespaceQuotes": "\"",
                "quotes": undefined,
                "table": "table",
                "tableQuotes": "\"",
                "type": "ref",
              },
      }
```

## License 
[Apache 2.0](LICENSE)
