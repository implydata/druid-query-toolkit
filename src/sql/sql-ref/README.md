# SqlRef

A class used to sqlRef with no alias, such as a column, namespace or table. Sql Refs can be unquoted or quoted with double quotes. 
SqlRef take the shape:

   `namespace` `.`? `table` `.` ?`column`

String: 

```
"test"."namespace"
```

## upgrade 
The upgrade function changes a SqlRef representing `table.column` to represent the form `namespace.table`


String
```angular2
"namespace"."table"
```

