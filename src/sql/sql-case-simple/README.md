# SqlCaseSearched

A class used to represent a case expression that takes the form:

`CASE WHEN boolean_expr1 THEN result1 \[ WHEN boolean_expr2 THEN result2 ... \] \[ ELSE resultN \] END`

Example:

```
CASE A WHEN B THEN C ELSE D END
```

## upgrade 

The upgrade calls upgrade() on the alias value. 
The function changes the SqlRef of the Alias representing `table.column` to represent the form `namespace.table`.
