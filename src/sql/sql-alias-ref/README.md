# SqlAliasRef

A class used to represent a SqlBase value such as a function with an alias. A SqlAliasRef takes the form:

`Column` `AS` `SqlRef`

The keyword as is case insensitive. 

Example: 

```
Sum(*) As sums
```

## upgrade 

The upgrade calls upgrade() on the alias value. 
The function changes the SqlRef of the Alias representing `table.column` to represent the form `namespace.table`.
