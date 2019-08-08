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
 function makeListMapEmpty0BookEnd(tail) {
    return [].concat(tail.map(function(t) { return [t[0][0],t[0][2]] })).flat();
  }
 function makeListMapEmpty0Joined(tail) {
    return [].concat(tail.map(function(t) { return t[0].join('') }));
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

Start
  = SelectQuery
  /Expression

SelectQuery
  =
  startSpacing: _?
  SelectToken
  distinct:(_ DistinctToken)?
  spacing1: _
  columns:Columns?
  spacing2: _
  fromClause:FromClause?
  whereClause: (_ WhereClause)?
  groupByClause:(_ GroupByClause)?
  havingClause:(_ HavingClause)?
  orderByClause:(_ OrderByClause)?
  limitClause:(_ LimitClause)?
  endSpacing: [ \t\n\r;]*
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
      spacing: [
      startSpacing,
      distinct ? distinct[0]: null,
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
  /open: (OpenParen _?)
  ex:Columns
  close: (_? CloseParen)
  {
    return ex.addParen(open,close);
  }


Column
  = ex:(CaseExpression/Concat/Function/RefExpression/StarToken/String)
  alias:(_ AsOptional)?
  {
    return new Column({
    parens:[],
    ex: ex,
    alias: alias ? alias[1]: null,
    spacing: alias ? [alias[0]] : null});
  }
   /open: (OpenParen _?)
   ex:Column
   close: (_? CloseParen)
   {
     return ex.addParen(open,close);
   }


FromClause
  = keyword: FromToken
  spacing0: _
  fc:FromContent
  alias:(_ AsOptional)?
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
  / OpenParen
  subQuery:SelectQuery
  CloseParen
  {
    return subQuery;
  }

WhereClause
  = keyword:WhereToken
  spacing0:_
  filter:Expression
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
  tail:((Comma _?)Expression)*
  {
    return new GroupByClause ({
      groupKeyword: groupKeyword,
      byKeyword: byKeyWord,
      groupBy: makeListMap1(head, tail),
      spacing: [spacing0, spacing1, makeListMapEmpty01(tail)]
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
  = keyword: LimitToken
  spacing0:_
  a:NumberType
  b:((Comma _?) NumberType)*
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

Expression
  = OrExpression

OrExpression
  = head:AndExpression
  tail:((_ OrToken _) AndExpression)*
  {
    let ex = makeListMap1(head, tail);
    if(ex.length >1 ){
    return new OrExpression({
      parens: [],
      ex: makeListMap1(head, tail),
      spacing: makeListMapEmpty0Joined(tail)
    });
    } else {
    return head;
    }
  }
  / open: (OpenParen _?)
  ex:OrExpression
  close: (_? CloseParen)
  {
    return ex.addParen(open,close);
  }


AndExpression
  = head:NotExpression
  tail:((_ AndToken _) NotExpression)*
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
  / open: (OpenParen _?)
  ex:AndExpression
  close: (_? CloseParen)
  {
     return ex.addParen(open,close);
  }


NotExpression
  = not:(NotToken _)?
  ex:ComparisonExpression
  {  if (!not) {
        return ex
     }
    return new NotExpression ({
      parens: [],
      keyword: not ? not[0] : null,
      ex: ex,
      spacing: not ? [not[1]] : null
    });
  }
  /open: (OpenParen _?)
  ex:NotExpression
  close: (_? CloseParen) {
     return ex.addParen(open,close);
  }


ComparisonExpression
  = ex:AdditiveExpression
  rhs:(_? ComparisonExpressionRhs)?
  { if (!rhs) {
      return ex;
    }
    return new ComparisonExpression({
      parens: [],
      ex: ex,
      rhs: rhs ? rhs[1] : null,
      spacing: rhs? rhs[0]: null
     });
  }
  /open: (OpenParen _?)
  ex:ComparisonExpression
  close: (_? CloseParen)
  {
     return ex.addParen(open,close);
  }

ComparisonExpressionRhs
  = not:(NotToken _)?
  rhs:ComparisonExpressionRhsNotable
  {
    return new ComparisonExpressionRhs({
      parens: [],
      op: null,
      is: null,
      not: not ? not[0] : null,
      rhs: rhs,
      spacing: [not ? not[1] : null]
    });
  }
  / is:IsToken
  spacing0:_
  not: (NotToken _)?
  rhs:AdditiveExpression
  {
    return new ComparisonExpressionRhs({
      parens: [],
      op:null,
      is: is,
      not: not ? not[0] : null,
      rhs: rhs,
      spacing: not ? [spacing0, not[1]]: [spacing0],
    });
  }
  / op:ComparisonOp
  spacing0: _?
  rhs:AdditiveExpression
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
  /open: (OpenParen _?)
  ex:ComparisonExpressionRhs
  close: (_? CloseParen)
  {
     return ex.addParen(open,close);
  }


ComparisonExpressionRhsNotable
  = keyword: BetweenToken
  spacing0:_
  start:(AdditiveExpression)
  spacing1:_
  AndToken
  spacing2:_
  end:(AdditiveExpression) {
    return new BetweenExpression({
      keyword: keyword,
      start: start,
      andKeyword: andKeyword,
      end: end,
      spacing: [spacing0, spacing1, spacing2]
    });
  }
  / keyword:InToken
  spacing0:_
  list:(Sub/AdditiveExpression/InSetLiteralExpression)
  {
    return new InExpression({
        keyword: keyword,
        list: list,
        spacing: [spacing0]
      });
    }
  / keyword:(ContainsToken/RegExpToken)
  spacing0:_
  string:String
  {
    return new ContainsExpression({
        keyword: keyword,
        string: list,
        spacing: [spacing0]
    });
  }
  / LikeRhs



LikeRhs
  =keyword:LikeToken
  spacing0:_
  ex:(String/Function)
  escape:(_ EscapeToken _ String)?
  {
    return new LikeExpression({
      keyword: keyword,
      ex: ex,
      spacing: [spacing0,(escape ? escape[0]: ''), (escape ? escape[2]: '')],
      escape: escape? escape[3] : null ,
      escapeKeyword: escape ? escape[1] : null
    });
  }

AdditiveExpression
  = head:MultiplicativeExpression
  tail:((_? AdditiveOp _?)
  MultiplicativeExpression)*
  {
    let ex = makeListMap1(head, tail);
    if(ex.length <= 1) {
      return head
    }
    return new AdditiveExpression({
      parens:[],
      ex: makeListMap1(head, tail),
      spacing: makeListMapEmpty0BookEnd(tail),
      op: makeListMapEmpty(makeListMapEmpty0(tail)),
    });
  }
  /open: (OpenParen _?)
  ex:AdditiveExpression
  close: (_? CloseParen) {
   return ex.addParen(open,close);
  }

AdditiveOp
  = op:("+" / "-") !"+"
  {
    return op;
  }

MultiplicativeExpression
  = head:(BasicExpression/Concat)
  tail:((_? MultiplicativeOp _?)
  (BasicExpression/Concat))*
  {
   let ex = makeListMap1(head, tail);
      if(ex.length <= 1) {
        return head
      }
    return new MultiplicativeExpression({
      parens : [],
      ex: makeListMap1(head, tail),
      spacing: makeListMapEmpty0BookEnd(tail),
      op: makeListMapEmpty(makeListMapEmpty0(tail)),
    });

  }
  /open: (OpenParen _?)
  ex:MultiplicativeExpression
  close: (_? CloseParen)
  {
     return ex.addParen(open,close);
  }

MultiplicativeOp
  = op:("*" / "/")
  {
    return op;
  }

BasicExpression
  = CaseExpression
  /Function
  /Sub
  /CurrentTimeStamp
  /Interval
  /String
  /NumberType
  /RefExpression


Interval
  = intervalKeyword:IntervalToken spacing0:_  ex:NumericString spacing1:_ unitKeyword:Name
  {
    return new Interval ({
      intervalKeyword: intervalKeyword,
      ex: ex,
      unitKeyword: unitKeyword,
      spacing: [spacing0, spacing1]
    });
  }


Sub
  = open: (OpenParen _?)
  sub:(SelectSubQuery/Expression)
  close: (_? CloseParen)
  {
    return new Sub({
      parens: [{open,close}],
      ex:sub
    });
  }
  /open: (OpenParen _?)
   ex:Sub
   close: (_? CloseParen)
   {
     return ex.addParen(open,close);
   }


Concat
  = head:BasicExpression
  tail:( (_? '||' _?) BasicExpression)+
  {
    return new Concat({
      parens: [],
      parts: makeListMap1(head, tail),
      spacing: makeListMapEmpty0(tail)
    });
  }
  /open: (OpenParen _?)
  ex:Concat
  close: (_? CloseParen)
  {
     return ex.addParen(open,close);
  }


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
        spacing:[spacing0,(distinct? distinct[1] : ''), makeListMapEmpty(valueTail), spacing1, (filterClause ? filterClause[0] : null)]
       });
    }
    /open: (OpenParen _?)
    ex:Function
    close: (_? CloseParen)
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
  = keyword:CaseToken
  v: (_ !WhenToken Expression)?
  cases:(_ Case)*
  els:(_ ElseToken _ Expression)?
  end: (_ EndToken)
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
	= whenKeyword: "When"i
	spacing0: _
	whenExpr: Expression
	spacing1:_
	thenKeyword: ThenToken
	spacing2:_
	thenExpr: Expression
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
  = OpenCurly
  head:StringNumberOrNull?
  tail:(Comma StringNumberOrNull)*
  CloseCurly
    {
      return Set.fromJS(makeListMap1(head, tail).map(undummyNull));
    }

StringNumberOrNull
  = String
  / NumberType
  / NullToken


InSetLiteralExpression
  = OpenParen
  head:StringOrNumber
  tail:(Comma StringOrNumber)*
  CloseParen
  {
    return r(Set.fromJS(makeListMap1(head, tail)));
  }

StringOrNumber
  = String
  / NumberType

RefExpression
  = ref:NamespacedRef
  {
    return ref;
  }

RelaxedNamespacedRef
  = ns:(Ref Dot)?
  name:RelaxedRef
  {
    return {
      namespace: ns ? ns[0] : null,
      name: name
    };
  }

NamespacedRef
  =ns:((Ref/String) Dot)?
  name:(Ref/String)
  {
    return new RefExpression({
      quotes: [],
      namespace: ns ? ns[0] : null,
      name: name
    });
  }
  /quote:["] spacing0:_? ex: NamespacedRef spacing1: _? ["] {
    return ex.addQuotes( quote, [spacing0, spacing1]);
  }
  /quote:['] spacing0:_? ex: NamespacedRef spacing1: _? ['] {
       return ex.addQuotes( quote, [spacing0, spacing1]);
  }

RelaxedRef
  = name:RelaxedName
  !{ return reserved(name); }
  {
    return name
  }
  / BacktickRef

Ref
  = name:Name
  {
    return name
  }
  / BacktickRef

String
  = CharsetIntroducer? "'"
  spacing0: _?
  chars:NotSQuote
  spacing1: _? "'"
  {
    return new StringType({
      chars: chars,
      quote: "'",
      spacing: [spacing0, spacing1]
    });
  }
  / '"'
  spacing0: _?
  chars:NotDQuote
  spacing1: _?'"'
  {
    return new StringType({
      chars: chars,
      quote: '"',
      spacing: [spacing0, spacing1]
    });
  }


NumericString
  = CharsetIntroducer? "'"
  spacing0: _?
  chars:$ [0-9]+
  spacing1: _? "'"
  {
    return new StringType({
      chars: chars,
      quote: "'",
      spacing: [spacing0, spacing1]
    });
  }
  / '"'
  spacing0: _?
  chars:$ [0-9]+
  spacing1: _?'"'
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

NumberType =
	value:$ [0-9]+
	{
    return new NumberType(
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

CurrentTimeStamp
  = keyword:"CURRENT_TIMESTAMP"i
  {
    return keyword
  }


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
InToken = keyword:"IN"i { return keyword}
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
FilterToken = keyword:"FILTER"i { return keyword}
IntervalToken = keyword:"INTERVAL"i { return keyword}
DayToken = keyword:"DAY"i { return keyword}
