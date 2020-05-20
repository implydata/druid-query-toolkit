# SqlCaseSimple

A class used to represent a case expression that takes the form:

`CASE expr WHEN value1 THEN result1 \[ WHEN value2 THEN result2 ... \] \[ ELSE resultN \] END`

Example:

```
CASE WHEN B THEN C ELSE D END
```

## upgrade 
The upgrade calls upgrade() on the alias value. 
The function changes the SqlRef of the Alias representing `table.column` to represent the form `namespace.table`.
