{
  function makeListMap1(head, tail) {
  if (head == null) return [];
  return [head].concat(tail.map(function(t) { return t[1] }));
  }
  function makeListMap(head, tail) {
    if (head == null) return [];
    return [head].concat(tail.map(function(t) { return t }));
  }
  function makeListMap_1(head, tail) {
    if (head == null) return [];
    return [head].concat(tail.map(function(t) { return t[0][1] }));
  }
  function makeListMap_2(head, tail) {
    if (head == null) return [];
    return [head].concat(tail.map(function(t) { return t[0][2] }));
  }
  function makeListMapEmpty(tail) {
    return [].concat(tail.map(function(t) { return t[1] }));
  }
  function makeListMapEmpty0(tail) {
    return [].concat(tail.map(function(t) { return t[0] }));
  }
    function makeListMapEmptyConcat0(tail) {
      return [].concat(tail.map(function(t) { return t[0].join('') }));
    }
  function makeListMapEmpty01(tail) {
    return [].concat(tail.map(function(t) { return t[0][1] }));
  }
  function makeListCasesSpacing(caseValue) {
    caseValue.map(caseValue => {caseValue[1].spacing = makeListMap(caseValue[0], caseValue[1].spacing)});
    return makeListMapEmpty(caseValue);
  }

 functions = functions || ["COUNT", "FILTER",
  "SUM","MIN", "MAX","AVG","APPROX_COUNT_DISTINCT",
  "APPROX_COUNT_DISTINCT_DS_HLL", "APPROX_COUNT_DISTINCT_DS_THETA",
  "APPROX_QUANTILE", "APPROX_QUANTILE_DS", "APPROX_QUANTILE_FIXED_BUCKETS"];
}

start = SelectQuery
SelectQuery
  = SelectToken distinct:(_ DistinctToken)?
  spacing1: _
  columns:Columns?
  spacing2: _
  fromClause:FromClause?
  whereClause: (_ WhereClause)?
  groupByClause:(_ GroupByClause)?
  havingClause:(_ HavingClause)?
  orderByClause:(_ OrderByClause)?
  limitClause:(_ LimitClause)?
  endSpacing: [;\t\n\r]*
    {
      return new SqlQuery({
        verb: 'SELECT',
        distinct: distinct ? distinct[1]: null,
        columns: columns,
        fromClause: fromClause,
        whereClause: whereClause ? whereClause[1]: null,
        groupByClause: groupByClause ? groupByClause[1] : null,
        havingClause: havingClause ? havingClause[1] : null,
        orderByClause: orderByClause ? orderByClause[1] : null,
        spacing: [distinct ? distinct[0]: null,
        	spacing1,
            spacing2,
            whereClause ? whereClause[0]:null,
            groupByClause ? groupByClause[0]:null,
            havingClause? havingClause[0]: null,
            orderByClause? orderByClause[0]: null,
            limitClause ? limitClause[0] : null,
            endSpacing.join(''),
            ],
        limitClause: limitClause ? limitClause[1] : null,
      });
    }

SelectSubQuery
  = SelectQuery

Columns
  = head:(Column)
    tail:((Comma _) Column)*
    {
    	return new Columns({
    	    parens: [],
        	columns: makeListMap1(head, tail),
          spacing: tail ? makeListMapEmpty01(tail) : null
      })
    }
  /open: (OpenParen _?) ex:Columns close: (_? CloseParen)
   {
     return ex.addParen(open,close);
   }


Column
  = ex:(CaseExpression/Function/RefExpression/StarToken/String) alias:(_ AsOptional)?
  {
    return new Column({
    parens:[],
    ex: ex,
    alias: alias ? alias[1]: null,
    spacing: alias ? [alias[0]] : null});
  }
   /open: (OpenParen _?) ex:Column close: (_? CloseParen)
   {
     return ex.addParen(open,close);
   }


FromClause
  = keyword: FromToken spacing0: _ fc:FromContent alias:(_ AsOptional)?
    {
    return new FromClause({
    		keyword: keyword,
    		spacing: [spacing0,alias ? alias[0] : null],
        fc: fc,
        alias: alias ? alias[1] : null
    	});
    }

FromContent
  = RefExpression
  / OpenParen subQuery:SelectQuery CloseParen
    {
      return subQuery;
    }

WhereClause
  = keyword:WhereToken spacing0:_ filter:Expression
    {
      return new WhereClause({
        keyword: keyword,
        filter: filter,
        spacing: [spacing0]
      });
    }

GroupByClause
  = groupKeyword: GroupToken
    spacing0:_ byKeyWord:ByToken
    spacing1:_ head:Expression
    tail:((Comma _)Expression)*
    {
      return new GroupByClause ({
        groupKeyword: groupKeyword,
        byKeyword: byKeyWord,
        groupBy: makeListMap1(head, tail),
        spacing: [spacing0, spacing1, makeListMapEmpty(tail)]
      });
    }

HavingClause
  = keyword: HavingToken
    spacing0:_
    having: Expression
    {
      return new HavingClause({
    		keyword: keyword,
        having: having,
        spacing: [spacing0]
      });
    }

OrderByClause
  = orderKeyword: OrderToken
    spacing0 : _
    byKeyword: ByToken
    spacing1: _
    head: OrderByPart
    tail:((Comma _) OrderByPart)*
    {
      return new OrderByClause({
        orderKeyword: orderKeyword,
        byKeyword : byKeyword,
        orderBy: makeListMap1(head, tail),
        spacing: [spacing0,spacing1].concat(makeListMapEmpty01(tail))
      });
    }

OrderByPart
	= orderBy:Expression
	direction:(_ Direction)?
	{
    return new OrderByPart({
      orderBy: orderBy,
      direction: direction ? direction[1] : null,
      spacing: direction ? [direction[0]] : null
    });
  }


LimitClause
  = keyword: LimitToken spacing0:_  a:Integer b:((Comma _?) Integer)*
  {
    return new LimitClause({
      keyword: keyword,
      value: b ? makeListMap1(a, b) : [a],
      spacing: b ? makeListMap_1(spacing0, b) : [spacing0]
    });
  }

Direction
  = AscToken
  / DescToken

AsOptional
  = keyword: AsToken spacing0: _ value:(String / Ref)
  {
    return new Alias ({
      keyword: keyword,
      value: value,
      spacing: [spacing0]
    });
  }

/*
Expressions are defined below in acceding priority order

  Or (OR)
  And (AND)
  Not (NOT)
  Comparison (=, <=>, <, >, <=, >=, <>, !=, IS, LIKE, BETWEEN, IN, CONTAINS, REGEXP)
  Additive (+, -)
  Multiplicative (*), Division (/)
  Unary identity (+), negation (-)
*/

Expression = OrExpression

OrExpression
  = head:AndExpression tail:(_ OrPart)*
  {
    let headValue = new OrPart({keyword:null, ex:head, spacing:[['']]});
    return new OrExpression({
      parens: [],
      ex: makeListMap1(headValue, tail),
      spacing: makeListMapEmpty0(tail)
    });
  }
  / open: (OpenParen _?) ex:AndExpression close: (_? CloseParen)
  {
    return ex.addParen({open,close});
  }

OrPart
	= keyword:OrToken spacing0:_ 	ex:AndExpression
	{
    return new OrPart({
      keyword: keyword,
      ex: ex,
      spacing:[spacing0]
    });
  }

AndExpression
  = head:NotExpression tail:(_ AndPart)*
  {
    let headValue = new AndPart({keyword:null, ex:head, spacing:[['']]});
    return new OrExpression({
        parens: [],
        ex: makeListMap1(headValue, tail),
        spacing: makeListMapEmpty0(tail)
    });
  }
  / open: (OpenParen _?) ex:AndExpression close: (_? CloseParen)
  {
    return ex.addParen({open,close});
  }

AndPart
	= keyword:AndToken spacing0:_ ex:NotExpression
  {
    return new AndPart({
      keyword: keyword,
      ex: ex,
      spacing:[spacing0]
    });
  }

NotExpression
  = not:(NotToken _)? ex:ComparisonExpression
  {
    return new NotExpression ({
      parens: [],
      keyword: not ? not[0] : null,
      ex: ex,
      spacing: not ? [not[1]] : null
    });
  }
  /open: (OpenParen _?) ex:NotExpression close: (_? CloseParen) {
    return ex.addParen({open,close});
  }


ComparisonExpression
  = ex:AdditiveExpression  rhs:(_? ComparisonExpressionRhs)?
  {
    //if (rhs) ex = rhs(ex);
    return new ComparisonExpression({
      parens: [],
      ex: ex,
      rhs: rhs ? rhs[1] : null,
      spacing: rhs? rhs[0]: null
     });
  }
  /open: (OpenParen _?) ex:ComparisonExpression close: (_? CloseParen)
  {
    return ex.addParen({open,close});
  }

ComparisonExpressionRhs
  = not:NotToken? spacing0: _ rhs:ComparisonExpressionRhsNotable
  {
    return new ComparisonExpressionRhs({
      parens: [],
      op: null,
      is: null,
      not: not,
      rhs: rhs,
      spacing: [spacing0]
    });
  }
  / is:IsToken spacing0:_  not: (NotToken _)? rhs:AdditiveExpression
  {
    return  new ComparisonExpressionRhs({
      parens: [],
      op:null,
      is: is,
      not: not ? not[0] : null,
      rhs: rhs,
      spacing: not ? [spacing0, not[1]]: [spacing0],
    });
  }
  / op:ComparisonOp spacing0: _? rhs:AdditiveExpression
  {
    return  new ComparisonExpressionRhs({
      parens: [],
      is: null,
      not: null,
      op: op,
      spacing: [spacing0],
      rhs: rhs
    });
  }
  /open: (OpenParen _?) ex:ComparisonExpressionRhs close: (_? CloseParen)
  {
    return ex.addParen({open,close});
  }


ComparisonExpressionRhsNotable
  = BetweenToken start:(AdditiveExpression) AndToken end:(AdditiveExpression)
  / InToken list:(InSetLiteralExpression / AdditiveExpression)
  / ContainsToken string:String
  / LikeRhs
  / RegExpToken string:String


LikeRhs
  = LikeToken string:String escape:(EscapeToken String)?

AdditiveExpression
  = head:MultiplicativeExpression tail:((_? AdditiveOp _?) MultiplicativeExpression)*
    {
      return new AdditiveExpression({
        parens:[],
        ex: makeListMap1(head, tail),
        spacing: makeListMapEmpty0(tail),
        op: makeListMapEmpty(tail),
      });
    }
    /open: (OpenParen _?) ex:AdditiveExpression close: (_? CloseParen) {
        return ex.addParen({open,close});
    }

AdditiveOp
  = op:("+" / "-") !"+"
  {
    return op;
  }

MultiplicativeExpression
  = head:BasicExpression tail:((_? MultiplicativeOp _?) BasicExpression)*
  {
    return new MultiplicativeExpression({
      parens : [],
      ex: makeListMap1(head, tail),
      spacing: makeListMapEmpty0(tail),
      op: makeListMapEmpty01(tail),
    });

  }
  /open: (OpenParen _?) ex:MultiplicativeExpression close: (_? CloseParen)
  {
    return ex.addParen({open,close});
  }

MultiplicativeOp
  = op:("*" / "/")
  {
    return op;
  }

BasicExpression
  = CaseExpression
  /Function
  /OpenParen spacing0: _? sub:(Expression/ SelectSubQuery) spacing1:_? CloseParen
  {
  	return new Sub({
  		spacing:[spacing0,spacing1],
      ex:sub
    });
  }
  /String
  /Integer
  /RefExpression

  /*LiteralExpression
  / AggregateExpression
  / FunctionCallExpression
  / CaseExpression
  / OpenParen sub:(Expression / SelectSubQuery) CloseParen
  {
    return sub.addParen(open,close);
  }
  / RefExpression*/

Function
  = fn:Functions
   OpenParen spacing0:_?
   distinct:(DistinctToken _)?
   valueHead:(Expression/StarToken)
   valueTail:((Comma _)?
   (Expression/StarToken))*
   spacing1:_?
   CloseParen
   filterClause:(_ FilterClause)?
    {
      return new Function({
        parens : [],
        distinct: distinct ? distinct[0] : null,
        fn: fn,
        value: makeListMap1(valueHead, valueTail),
        filterClause: filterClause ? filterClause[1] : null,
        spacing:[spacing0,(distinct? distinct[1] : ''), makeListMapEmpty(valueTail), spacing1, (filterClause ? filterClause[0] : null),]
       });
    }
    /open: (OpenParen _?) ex:Function close: (_? CloseParen)
    {
      return ex.addParen(open,close);
    }

FilterClause
  = keyword: FilterToken
    spacing0: _?
    OpenParen spacing1: _?
    ex:WhereClause
    spacing2:_?
    CloseParen
    {
      return new FilterClause({
         keyword: keyword,
         spacing: [spacing0, spacing1, spacing2],
         ex: ex
      });
    }


CaseExpression
  =  keyword:CaseToken v: (_ !WhenToken Expression)? cases:(_ Case)* els:(_ ElseToken _ Expression)? end: (_ EndToken)
    {
      return new CaseExpression({
        parens: [],
      	keyword: keyword,
        expr: v,
        cases: cases,
        else: els,
        end: end
      });
    }
     /open: (OpenParen _?) ex:CaseExpression close: (_? CloseParen)
     {
       return ex.addParen(open,close);
     }

Case
	= whenKeyword: "When"i spacing0: _ whenExpr: Expression spacing1:_  thenKeyword: ThenToken spacing2:_ thenExpr: Expression
	{
    return new CasePart({
      whenKeyword: whenKeyword,
      whenExpr : whenExpr,
      thenKeyword: thenKeyword,
      thenExpr: thenExpr,
      spacing: [spacing0, spacing1, spacing2]
    });
  }

SetLiteral
  = OpenCurly head:StringNumberOrNull? tail:(Comma StringNumberOrNull)* CloseCurly
    {
      return Set.fromJS(makeListMap1(head, tail).map(undummyNull));
    }

StringNumberOrNull = String / Integer / NullToken


InSetLiteralExpression
  = OpenParen head:StringOrNumber tail:(Comma StringOrNumber)* CloseParen
    {
      return r(Set.fromJS(makeListMap1(head, tail)));
    }

StringOrNumber = String / Integer

Interval
  = IntervalToken n:Integer unit:Name &{ return intervalUnits[unit] }
    {
      if (n !== 0) error('only zero intervals supported for now');
      return 0;
    }

RefExpression
  = ref:NamespacedRef
  {
    return ref;
  }

RelaxedNamespacedRef
  = ns:(Ref Dot)? name:RelaxedRef
  {
    return {
      namespace: ns ? ns[0] : null,
      name: name
    };
  }

NamespacedRef
  = ns:(Ref Dot)? name:Ref
  {
    return new RefExpression({
      namespace: ns ? ns[0] : null,
      name: name
    });
  }

RelaxedRef
  = name:RelaxedName !{ return reserved(name); }
  {
    return name
  }
  / BacktickRef

Ref
  = name:Name /*!{ return reserved(name); }*/
  {
    return name
  }
  / BacktickRef

String
  = CharsetIntroducer? "'"  spacing0: _? chars:NotSQuote spacing1: _? "'"
  {
    return new StringType({
      chars: chars,
      quote: "'",
      spacing: [spacing0, spacing1]
    });
  }
  / '"' spacing0: _? chars:NotDQuote spacing1: _?'"'
  {
    return new StringType({
      chars: chars,
      quote: '"',
      spacing: [spacing0, spacing1]
    });
  }

Name "Name"
  = name:$([a-z_]i [a-z0-9_]i*)
  {
    return name;
  }

RelaxedName "RelaxedName"
  = name:$([a-z_\-:*/]i [a-z0-9_\-:*/]i*)
  {
    return name;
  }

Integer =
	value:$ [0-9]+
	{
    return new Integer(
      value
    );
  }

Functions =
	Function: Name &{
   	if (functions.includes(Function.toUpperCase())) {
    	return true
    }
  }
  {
  return Function;
  }

ComparisonOp "Comparison"
  = "="
  / "<=>"
  / "<>"
  / "!="
  / "<="
  / ">="
  / "<"
  / ">"

StarToken = keyword:"*"i  { return keyword}
SelectToken = keyword:"SELECT"i  { return keyword}
DistinctToken = keyword:"DISTINCT"i { return keyword}
AsToken = keyword:"AS"i { return keyword}
OrToken = keyword:"OR"i { return keyword}
AndToken = keyword:"AND"i { return keyword}
NotToken = keyword:"NOT"i { return keyword}
CaseToken = keyword:"CASE"i { return keyword}
WhenToken = keyword:"WHEN"i { return keyword}
ThenToken = keyword:"THEN"i { return keyword}
ElseToken = keyword:"ELSE"i { return keyword}
EndToken = keyword:"END"i { return keyword}
CountToken = keyword:"COUNT"i { return keyword}
FromToken = keyword:"FROM"i { return keyword}
WhereToken = keyword:"WHERE"i { return keyword}
IsToken = keyword:"IS"i { return keyword}
BetweenToken = keyword:"BETWEEN"i { return keyword}
InToken = keyword:"BETWEEN"i { return keyword}
GroupToken = keyword:"GROUP"i { return keyword}
ByToken = keyword:"BY"i { return keyword}
HavingToken = keyword:"HAVING"i { return keyword}
OrderToken = keyword:"ORDER"i { return keyword}
AscToken = keyword:"ASC"i { return keyword}
DescToken = keyword:"DESC"i { return keyword}
LimitToken = keyword:"LIMIT"i { return keyword}
ContainsToken = keyword:"Contains"i { return keyword}
RegExpToken = keyword:"REGEXP"i { return keyword}
LikeToken = keyword:"LIKE"i { return keyword}
EscapeToken = keyword:"ESCAPE"i { return keyword}
NullToken = keyword:"NULL"i { return keyword}
IntervalToken = keyword:"INTERVAL"i { return keyword}
FilterToken = keyword:"FILTER"i { return keyword}


Dot
= '.'
OpenParen "("
  = "("

CloseParen ")"
  = ")"

OpenCurly "{"
  = "{" _

CloseCurly "}"
  = "}" _

Comma = ','
_
  = spacing: [ \t\n\r]+ {return spacing.join('')}
CharsetIntroducer
  = "N"
  / "n"
  / "_"$([a-z0-9]+) // assume all charsets are a combo of lowercase + number

BacktickRef
  = "`" name:$([^`]+) "`" _
  {
    return name
  }

NotSQuote "NotSQuote"
  = $([^']*)

NotDQuote "NotDQuote"
  = $([^"]*)
