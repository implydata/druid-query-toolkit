Start = Sql

//

Sql
  = SqlRef
  / SqlLiteral
  / SqlInParens


/* ToDo: ...
Expression
  = OrExpression

OrExpression = head:AndExpression tail:(_ OrToken _ AndExpression)*
  {
    let ex = makeListMap1(head, tail);
    if (ex.length > 1) {
      return new OrExpression({
        parens: [],
        ex: makeListMap1(head, tail),
        spacing: makeListMapEmpty0Joined(tail)
      });
    } else {
      return head;
    }
  }


AndExpression = head:NotExpression tail:(_ AndToken _ NotExpression)*
  {
    let ex = makeListMap1(head, tail);
    if(ex.length >1 )
    {
      return new AndExpression({
        parens: [],
        ex: ex,
        spacing: makeListMapEmpty0Joined(tail)
      });
    } else {
      return head;
    }
  }


NotExpression = not:(NotToken _)? ex:ComparisonExpression
  {
    if (!not) return ex;
    return new NotExpression({
      keyword: not ? not[0] : null,
      ex: ex,
      spacing: not ? [not[1]] : null
    });
  }

*/


SqlInParens = OpenParen leftSpacing:_? ex:Sql rightSpacing:_? CloseParen
  {
    return ex.addParens(leftSpacing, rightSpacing);
  }

// ------------------------------

SqlLiteral = lit:(Number / SingleQuotedString)
  {
    return new sql.SqlLiteral(lit);
  }

Number = n:$([0-9]+)
  {
    return {
      value: Number(n),
      stringValue: n
    };
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
    return new sql.SqlRef({
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