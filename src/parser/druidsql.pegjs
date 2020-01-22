Start = Sql

//

Sql = Expression
  / SqlRef
  / SqlLiteral
  / SqlInParens

// ------------------------------

Expression = OrExpression

OrExpression = head:AndExpression tail: (_ OrToken _ (OrExpression/AndExpression))?
  {
  	if (!tail) return head
    return new sql.Expression ({
      operator:tail[1],
      left: head,
      leftSpace: tail[0],
      right: tail[3],
      rightSpace: tail[2]
    });
  }

AndExpression = head:NotExpression tail:(_ AndToken _ (AndExpression/NotExpression))?
  {
  	if (!tail) return head
    return new sql.Expression ({
    	operator:tail[1],
      left: head,
      leftSpace: tail[0],
      right: tail[3],
      rightSpace: tail[2]
    });
  }

NotExpression = tail:(NotToken _ (NotExpression/ComparisonExpression))
  {
    return new sql.Expression ({
      operator:tail[0],
      right: tail[2],
      rightSpace: tail[1]
    });
  }
  /ComparisonExpression

ComparisonExpression = head:AdditiveExpression tail:((_ ComparisonOperator _ (ComparisonExpression/AdditiveExpression))/(_ BetweenToken _ (AndExpression/ComparisonExpression)))?
  {
  	if (!tail) return head
    return new sql.Expression ({
    	operator:tail[1],
      left: head,
      leftSpace: tail[0],
      right: tail[3],
      rightSpace: tail[2]
    });
  }

AdditiveExpression = head:MultiplicativeExpression tail:(_ AdditiveOperator _ (AdditiveExpression/MultiplicativeExpression))?
  {
  	if (!tail) return head
    return new sql.Expression ({
      operator:tail[1],
      left: head,
      leftSpace: tail[0],
      right: tail[3],
      rightSpace: tail[2]
    });
  }

MultiplicativeExpression = head:BaseType tail:(_ MultiplicativeOperator _ (MultiplicativeExpression/BaseType))?
  {
  	if (!tail) return head
    return new sql.Expression ({
      operator:tail[1],
      left: head,
      leftSpace: tail[0],
      right: tail[3],
      rightSpace: tail[2]
    });
}


BaseType =
Function
/SqlLiteral
/SqlRef
/SqlInParens

// ------------------------------

Function = fn: Functions OpenParen leftSpacing:_? argument:Expression rightSpacing: _? CloseParen
{
  return new sql.Function({
    fn: fn.name,
    leftSpacing: leftSpacing,
    argument: argument,
    rightSpacing: rightSpacing,
  });
}

Functions =
	Function: UnquotedRefPart &{
   	if (functions.includes(Function.name.toUpperCase())) {
    	return true
    }
  }
  {
  return Function;
  }


SqlInParens = OpenParen leftSpacing:_? ex:Sql rightSpacing:_? CloseParen
  {
    return ex.addParens(leftSpacing, rightSpacing);
  }

SqlLiteral = lit:(Number / SingleQuotedString)
  {
    return new sql.SqlLiteral(lit);
  }

Number = n:$([0-9]+)
  {
    return new sql.Number({
      value: Number(n),
      stringValue: n
    });
  }

SingleQuotedString = ['] name:$([^']*) [']
  {
    return {
      value: name,
      stringValue: name
    };
  }

// ------------------------------

SqlRef = namespaceBits:(RefPart _? "." _?)? main:RefPart
  {
    return new sql .SqlRef({
      name: main.name,
      quotes: main.quotes,
      namespace: deepGet(namespaceBits, '0.name'),
      namespaceQuotes: deepGet(namespaceBits, '0.quotes'),
      innerSpacing: {
        preDot: deepGet(namespaceBits, '1'),
        postDot: deepGet(namespaceBits, '3'),
      }
    });
  }

RefPart = QuotedRefPart / UnquotedRefPart

QuotedRefPart = ["] name:$([^"]+) ["]
  {
    return {
      name: name,
      quotes: '"'
    }
  }

UnquotedRefPart = name:$([a-z_\-:*/]i [a-z0-9_\-:*/]i*)
  !{ return name === 'user'; /* ToDo */ }
  {
    return {
      name: name,
      quotes: ''
    }
  }

// -----------------------------------

_ "whitespace" =
  spacing: $([ \t\n\r]+)

OpenParen "("
 = "("

CloseParen ")"
= ")"

ComparisonOperator =
 '='
/'<>'
/'>='
/'<='
/'<'
/'>'

AdditiveOperator =
'+'
/'-'

MultiplicativeOperator=
'*'
/'/'

OrToken = 'OR'i
AndToken = 'AND'i
NotToken = 'NOT'i
BetweenToken = 'BETWEEN'i
