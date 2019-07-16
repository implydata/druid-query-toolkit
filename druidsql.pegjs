{
  var functions = ["COUNT",
  "SUM","MIN", "MAX","AVG","APPROX_COUNT_DISTINCT",
  "APPROX_COUNT_DISTINCT_DS_HLL", "APPROX_COUNT_DISTINCT_DS_THETA",
  "APPROX_QUANTILE", "APPROX_QUANTILE_DS", "APPROX_QUANTILE_FIXED_BUCKETS",
  "BLOOM_FILTER", "ABS", "CEIL", "EXP", "FLOOR", "LN", "LOG10", "POWER", "SQRT",
  "TRUNCATE", "TRUNC", "ROUND", "MOD", "SIN", "COS", "TAN", "COT", "ASIN", "ACOS",
  "ATAN", "ATAN2", "DEGREES", "RADIANS", "CONCAT", "TEXTCAT", "STRING_FORMAT",
  "LENGTH", "CHAR_LENGTH", "CHARARACTER_LENGTH", "STRLEN", "LOOKUP", "LOWER",
  "PARSE_LONG", "POSITION", "REGEXP_EXTRACT", "REPLACE", "STRPOS", "SUBSTRING",
  "RIGHT", "LEFT", "SUBSTR", "TRIM", "BTRIM", "LTRIM", "RTRIM", "UPPER", "REVERSE",
  "REPEAT", "LPAD", "RPAD", "CURRENT_TIMESTAMP", "CURRENT_DATE", "DATE_TRUNC",
  "TIME_FLOOR", "TIME_SHIFT", "TIME_EXTRACT", "TIME_PARSE", "TIME_FORMAT",
  "MILLIS_TO_TIMESTAMP", "TIMESTAMP_TO_MILIS", "EXTRACT", "FLOOR", "CEIL", "TIMESTAMPADD",
  "timestamp_expr", "CAST", "NULLIF", "COALESCE", "BLOOM_FILTER_TEST"];
}

Start =
  Query
  / spacing:_  expression: Expression endspacing:_ {
  return {type: 'expressionOnly',
  			spacing: spacing,
  			expression: expression,
  			endSpacing: endspacing }}

Query =
  spacing: _
  syntax: "SELECT"i
  selectParts: SelectParts
  from: From?
  where: Where?
  groupby: GroupBy?
  having: Having?
  orderBy: OrderBy?
  limit: Limit?
  unionAll: UnionAll?
  endSpacing: _
  {
    return {
      type: 'query',
      queryType: "SELECT",
      selectParts: selectParts,
      from: from,
      where: where,
      groupby: groupby,
      having: having,
      orderBy: orderBy,
      limit: limit,
      unionAll: unionAll,
      syntax: syntax,
      spacing: spacing,
      endSpacing: endSpacing
    }
  }

SelectParts =
  SelectPart: (SelectPart)+
  {
    return SelectPart
  }

SelectPart =
 spacing: _
 distinct: Distinct?
 selectPart: (
   Variable
   / Function
   / Case
   / Constant
   / star
 )
 alias:Alias?
  {
    return {
      type: "selectPart",
      distinct: distinct,
      expr: selectPart,
      alias: alias,
      spacing: spacing
    }
  }

From =
  spacing: _
  syntax: "FROM"i
  value: (
  Query
  / Table
  )
  {
    return {
      type: 'from',
      value: value,
      spacing: spacing,
      syntax: syntax
    }
  }

Where =
	spacing: _
	syntax: "WHERE"i
	expr:
	  Expression
	{
    return {
      type: "where",
      expr: expr,
      spacing: spacing,
      syntax: syntax
    }
  }

GroupBy =
	spacing: _
	syntax:"GROUP BY"i
	groupByParts: GroupByPart+
	{
    return {
      type: 'groupBy',
      groupByParts: groupByParts,
      spacing: spacing,
      syntax: syntax
    }
  }

GroupByPart =
	!Reserved
	 groupByPart: (
	   Integer
	   / Variable
	   / Constant
	 )
	 {
    return groupByPart
   }


Having =
	spacing: _
	syntax: "HAVING"i
	expr: (
	  Expression
	  / BinaryExpression
  )
  {
    return {
      type: "having",
      expr: expr,
      spacing: spacing,
      syntax: syntax
    }
  }

OrderBy =
	spacing: _
	syntax: "ORDER BY"i
	orderByParts: OrderByPart+
	{
    return {
      type: 'orderBy',
      orderByParts: orderByParts,
      spacing: spacing,
      syntax: syntax
    }
  }

OrderByPart =
	spacing: _
	!"LIMIT"i
	expr: ExprPart+
	direction: Direction?
	{
    return {
      type: "orderByPart",
      expr: expr,
      direction: direction,
      spacing: spacing
    }
  }

Direction =
	spacing: _
	direction: (
	  "DESC"i
	  / "ASC"i
	)
	{
    return {
      type: 'direction',
      direction: direction,
      spacing: spacing
    }
  }

ExprPart =
	spacing: _
	!Direction
	value: (
	  Function
	  / Variable
	  / Constant
	)
	{
    return {
      type: 'exprPart',
      value: value,
      spacing: spacing
    }
  }

Limit =
	spacing: _
	syntax: "LIMIT"i
	value: Integer
	{
    return {
      type: 'limit',
      value: value,
      spacing: spacing,
      syntax: syntax
    }
  }

UnionAll =
	spacing: _
	syntax: "UNION ALL"i
	newQuery: Query
	{
    return {
      type: 'unionAll',
      expr: newQuery,
      spacing: spacing,
      syntax:syntax
    }
  }

Case =
  spacing:_
  syntax: "CASE"i
  caseValue: CaseValue?
  whenClause: WhenClause+
  elseValue: ElseValue
  end: End?
  {
    return {
      type: "case",
      caseValue: caseValue,
      when: whenClause,
      elseValue: elseValue,
      end: end,
      spacing: spacing,
      syntax: syntax

    }
  }

CaseValue =
	spacing: _
	!"WHEN"i
	caseValue: (Variable/Constant)
	{
    return {
      type: 'caseValue',
      caseValue: caseValue,
      spacing: spacing
      }
  }

ElseValue =
	spacing: _
	syntax: "ELSE"i?
	elseValue: (
	  BinaryExpression
	  / Expression
	  / Integer
	  / Variable
	  / Constant
  )?
  {
    return {
      type: 'elseValue',
      elseValue: elseValue,
      spacing: spacing,
      syntax: syntax
    }
  }

End =
	spacing: _
	syntax: "END"i
	{
	 return {
      type:'end',
      spacing: spacing,
      syntax: syntax
    }
  }

WhenClause =
	spacing:_
	syntax: "WHEN"i
	when: (
	  BinaryExpression
	  / Expression
	  / Variable
	  / Constant
	  / Integer
	  )
  then: Then
  {
    return {
      type:'when',
      when: when,
      then: then,
      syntax: syntax,
      spacing: spacing
    }
  }

Then =
  spacing: _
  syntax: "THEN"i
  then: (
  Integer
  / Case
  / BinaryExpression
  / Expression
  / Variable
  )
  {
	  return {
      type: 'then',
      syntax: syntax,
      then: then,
      spacing: spacing
    }
  }


BinaryExpression =
	spacing: _
	lhs: (
	  Expression
	  / Function
	  / TimeStamp
	  / Variable
	  / Constant
	  / Integer
  )?
  operator: BinaryOperator
  rhs: (
    BinaryExpression
    / Function
    / TimeStamp
    / Expression
    / Variable
    / Constant
    / Integer
    )?
  {
    return {
      type: "binaryExpression",
      operator: operator,
      lhs: lhs,
      rhs: rhs,
      spacing: spacing
    }
  }

Expression =
	spacing: _
	lhs: (
	  Function
	  / TimeStamp
	  / Variable
	  / Constant
	  / Integer
	  )
  operator: (
    Operator /
    BinaryOperator
  )
  rhs: (
    Expression
     / Function
     / TimeStamp
     / Interval
     / Variable
     / Constant
     / Integer
   )
   {
    return {
      type: "expression",
      operator: operator,
      lhs: lhs,
      rhs: rhs,
      spacing: spacing
    }
  }

Function =
  spacing: _
  functionCall: Functions
  OpenParen
  argument: Argument+
  CloseParen
  {
    return {
      type: "function",
      functionCall: functionCall,
      arguments: argument,
      spacing: spacing
    }
  }

Distinct =
	spacing: _
	distinct: "DISTINCT"i
	{
    return {
      type: 'distinct',
      distinct: distinct,
      spacing: spacing
    }
  }

Argument =
	distinct: Distinct?
	argumentValue: ArgumentValue
	{
    return {
      type: 'argument',
      distinct: distinct,
      argumentValue: argumentValue
    }
  }

ArgumentValue =
     spacing: _
     !Reserved
     argument: (
        Constant
        / Variable
        / star
        / [^(), ]+
     )
     {
       return {
         type:'argumentValue',
         spacing: spacing,
         argument: Array.isArray(argument) ? argument.join("") : argument
       }
     }

Variable =
  spacing: _
  quote: (
    QuoteMark
    / Apostrophe
  )
  value: [^"'()]+
  (
    QuoteMark
    / Apostrophe
  )
  {
    return {
      type: "variable",
      value: value.join(""),
      spacing: spacing,
      quote: quote
    }
  }

Constant =
  spacing: _
  !Reserved
  value: [a-zA-Z_.]+
  {
    return {
      type: "Constant",
      value: value.join(""),
      spacing: spacing
    }
  }

Integer =
	spacing: _
	value: [0-9]+
	{
    return {
      type: "Integer",
      value: value.join(""),
      spacing: spacing
    }
  }

TimeStamp =
	spacing: _
	"TIMESTAMP"i
	_ Apostrophe
	timeStamp: [0-9" ":-]+
	Apostrophe {
    return {
      type: "timestamp",
      value: timeStamp.join(""),
      spacing: spacing
    }
  }

Operator =
	spacing:_ operator:(
	"+"
   /"-"
   /"/"
   /"*"
   /"="
   )
   {
     return {
       type: 'operator',
       spacing: spacing,
       operator: operator
     }
   }

Interval =
	spacing:_
	"INTERVAL"i
	value: (
	  Apostrophe
	  / Integer
	  / Apostrophe
	  / Variable
  )
	constant: Constant
	{
    return {
        type: "interval",
        value: value,
        constant: constant,
        spacing: spacing
    }
  }

Alias =
	spacing:_ syntax:"AS"i  value:(Variable/Constant/Integer) {
    return {type:'alias',
    value: value,
    spacing: spacing,
    syntax: syntax
    }
	}

Functions =
	Function: IdentifierPart {
   	if (functions.includes(Function)) {
    	return Function
    }
  }



BinaryOperator =
	spacing: _ !Parts operator:(
    ">="
    / ">"
    / "=<"
    / "="
    / "!="
    / "<"
    / "<>"
    / "BETWEEN"i
    / "NOT BETWEEN"i
    / "NOT LIKE"i
    / "LIKE"i
    / "IS NULL"i
    / "IS NOT NULL"i
    / "IS TRUE"i
    / "IS NOT TRUE"i
    / "IS FALSE"i
    / "IN"i
    / "NOT IN"i
    / "NOT IN"i
    / "OR"i
    / "AND"i
    / "NOT"i
  )
  {
    return {
      type: 'operator',
      operator: operator,
      spacing: spacing
    }
  }
_
  = [ \t\n\r(),;]*

Table =
  spacing: _
  schema: (
    IdentifierPart
    Dot
  )?
  table: (
    Variable
    / IdentifierPart
  )
  alias: Alias?
  {
    return {
      type: 'table',
      schema: schema ? schema.join("").replace(/[,.]/g, ""): null,
      alias: alias,
      table: table,
      spacing: spacing
    }
  }

star =
	"*"
	{
		return {
      type: "star",
    }
  }

OpenParen =
	"("

CloseParen =
	")"

QuoteMark =
	"\""

Comma =
	","

SemiColon =
	";"

Apostrophe =
	"\'"

Dot =
	"."

IdentifierPart =
	part:[a-z_]i+
	{
    return part.join("")
  }

Reserved =
	BinaryOperator
    /Operator
    /Function
    /Parts

Parts =
    "FROM"i
    /"WHERE"i
    /"GROUP BY"i
    /"HAVING"i
    /"LIMIT"i
    /"UNION ALL"i
    /"SELECT"i
    /"AS"i
    /"ORDER BY"i
