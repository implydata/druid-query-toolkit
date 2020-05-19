Start = Sql

// Rest of the work...

Sql
  = SqlQuery
  / Expression
  / SqlRef
  / SqlLiteral
  / SqlInParens

// ------------------------------

SqlQuery =
  preQuery:_?
  explainKeyword:(ExplainToken _)?
  withClause:(WithClause _)?
  select:SelectClause
  postSelectValues:_
  from:FromClause
  join:(_ JoinClause)?
  where:(_ WhereClause)?
  groupBy:(_ GroupByClause)?
  having:(_ HavingClause)?
  orderBy:(_ OrderByClause)?
  limit:(_ LimitClause)?
  union:(_ UnionClause)?
  postQueryAnnotation:Annotation*
  postQuery:EndOfQuery?
{
  return new sql.SqlQuery({
    explainKeyword: explainKeyword ? explainKeyword[0]: '',

    withKeyword: withClause ? withClause[0].withKeyword : undefined,
    postWith: withClause ? withClause[0].postWith : undefined,
    withUnits: withClause ? withClause[0].withUnits : undefined,
    withSeparators: withClause ? withClause[0].withSeparators : undefined,

    selectKeyword: select.selectKeyword,
    selectDecorator: select.selectDecorator,
    selectSeparators: select.selectSeparators,
    selectValues: select.selectValues,
    selectAnnotations: select.selectAnnotations,

    fromKeyword: from.fromKeyword,
    tables: from.tables,
    tableSeparators: from.tableSeparators,

    joinType: join ? join[1].joinType: undefined,
    joinKeyword: join ? join[1].joinKeyword : undefined,
    joinTable: join ? join[1].table : undefined,
    onKeyword: join ? join[1].onKeyword : undefined,
    onExpression: join ? join[1].onExpression : undefined,

    whereKeyword: where ? where[1].whereKeyword : undefined ,
    whereExpression: where ? where[1].whereExpression : undefined,

    groupByKeyword: groupBy ? groupBy[1].groupByKeyword : undefined ,
    groupByExpression: groupBy ? groupBy[1].groupByExpression : undefined,
    groupByExpressionSeparators: groupBy ? groupBy[1].groupByExpressionSeparators : undefined,

    havingKeyword: having ? having[1].havingKeyword : undefined ,
    havingExpression: having ? having[1].havingExpression : undefined,

    orderByKeyword: orderBy ? orderBy[1].orderByKeyword : undefined,
    orderByUnits: orderBy ? orderBy[1].orderByUnits : undefined,
    orderBySeparators: orderBy ? orderBy[1].orderBySeparators : undefined,

    limitKeyword: limit ? limit[1].limitKeyword: undefined,
    limitValue: limit ? limit[1].limitValue : undefined,

    unionKeyword: union ? union[1].unionKeyword : undefined,
    unionQuery: union ? union[1].unionQuery : undefined,

    postQueryAnnotation: postQueryAnnotation,

    innerSpacing: {
      preQuery: preQuery || '',

      postExplain: explainKeyword? explainKeyword[1]: '',

      postSelect: select.postSelect,
      postSelectDecorator: select.postSelectDecorator,
      postSelectValues: postSelectValues,

      postWith: withClause ? withClause[0].postWith : '',
      postWithQuery: withClause ? withClause[1] : '',

      postFrom: from.postFrom,

      preJoin: join ? join[0] : '',
      postJoinType: join ? join[1].postJoinTypeSpacing : '',
      postJoinKeyword: join ? join[1].postJoinKeywordSpacing : '',
      postJoinTable: join ? join[1].postJoinTableSpacing : '',
      postOn: join ? join[1].postOnSpacing : '',

      preWhereKeyword: where ? where[0] : '',
      postWhereKeyword: where ? where[1].postWhereKeyword : undefined,

      preGroupByKeyword: groupBy ? groupBy[0] : '',
      postGroupByKeyword: groupBy ? groupBy[1].postGroupByKeyword : undefined,

      preHavingKeyword: having ? having[0] : '',
      postHavingKeyword: having ? having[1].postHavingKeyword : undefined,

      preOrderByKeyword: orderBy ? orderBy[0] : undefined,
      postOrderByKeyword: orderBy ? orderBy[1].postOrderByKeyword : undefined,

      preLimitKeyword: limit ? limit[0] : '',
      postLimitKeyword: limit ? limit[1].postLimitKeyword : '',

      preUnionKeyword: union ? union[0] : '',
      postUnionKeyword: union ? union[1].postUnionKeyword : '',

      postQuery: postQuery || ''
    }
  });
}

WithClause =
  withKeyword:WithToken
  postWith:_
  withUnitsHead:WithUnit
  withUnitsTail: (Comma WithUnit)*
{
  return {
    withKeyword: withKeyword,
    postWith: postWith,
    withUnits: withUnitsTail ? makeListMap(withUnitsTail, 1, withUnitsHead) : [withUnitsHead],
    withSeparators: withUnitsTail ? makeListMap(withUnitsTail, 0): undefined,
  }
}


WithUnit =
  withTableName:Expression
  postWithTable:_?
  columns:(WithColumns _)?
  AsKeyword:AsToken
  postAs:_
  withQuery:SqlInParens
{
  return {
    withTableName: withTableName,
    postWithTable: postWithTable || '',
    postLeftParen: columns ? columns[0].postLeftParen : '',
    withColumns: columns ? columns[0].withColumns : undefined,
    withSeparators: columns ? columns[0].withSeparators : undefined,
    preRightParen: columns ? columns[0].preRightParen : '',
    postWithColumns: columns ? columns[1] : '',
    AsKeyword: AsKeyword,
    postAs: postAs,
    withQuery: withQuery
  }
}

WithColumns = OpenParen postLeftParen:_? withColumnsHead:BaseType withColumnsTail:(Comma BaseType)* preRightParen:_? CloseParen
{
  return {
    postLeftParen: postLeftParen || '',
    withColumns: withColumnsHead ? makeListMap(withColumnsTail, 1, withColumnsHead) : withColumnsHead,
    withSeparators: makeListMap(withColumnsTail, 1),
    preRightParen: preRightParen || ''
  }
}

SelectClause = selectKeyword:SelectToken postSelect:_ selectDecorator:((AllToken / DistinctToken) _)? selectValuesHead:(Alias/Expression) annotationsHead:Annotation? selectValuesTail:(Comma (Alias/Expression) Annotation?)*
{
  return {
    selectKeyword: selectKeyword,
    postSelect: postSelect,
    selectDecorator: selectDecorator ? selectDecorator[0] : '',
    postSelectDecorator: selectDecorator ? selectDecorator[1] : '',
    selectValues: selectValuesTail ? makeListMap(selectValuesTail, 1, selectValuesHead) : [selectValuesHead],
    selectSeparators: makeListMap(selectValuesTail,0),
    selectAnnotations: selectValuesTail ? makeListMap(selectValuesTail, 2, annotationsHead) : [annotationsHead],
  }
}

FromClause = fromKeyword:FromToken postFrom:_ tableHead:(Alias / SqlRef) tableTail:(Comma (Alias / SqlRef))*
{
  return {
    fromKeyword: fromKeyword,
    postFrom: postFrom,
    tables: tableTail ? makeListMap(tableTail, 1, tableHead).map(table => table.upgrade()): [tableHead.upgrade()],
    tableSeparators: tableTail ? makeListMap(tableTail, 0) : undefined
  }
}

JoinClause = joinType:JoinType postJoinTypeSpacing:_ joinKeyword:JoinToken postJoinKeywordSpacing:_? table:(Alias/SqlRef) postJoinTableSpacing:_  onKeyword:OnToken postOnSpacing:_? onExpression:Expression
{
  return {
    joinType: joinType,
    postJoinTypeSpacing: postJoinTypeSpacing,
    joinKeyword: joinKeyword,
    postJoinKeywordSpacing: postJoinKeywordSpacing,
    table: table.upgrade(),
    postJoinTableSpacing: postJoinTableSpacing,
    onKeyword: onKeyword,
    postOnSpacing: postOnSpacing,
    onExpression: onExpression
  }
}

WhereClause = whereKeyword:WhereToken postWhereKeyword:_ whereExpression:Expression
{
  return {
    whereKeyword: whereKeyword,
    postWhereKeyword: postWhereKeyword,
    whereExpression: whereExpression
  }
}

GroupByClause = groupByKeyword:GroupByToken postGroupByKeyword:_  groupByExpressionHead:Expression groupByExpressionTail:(Comma Expression)*
{
  return {
    groupByKeyword: groupByKeyword,
    postGroupByKeyword: postGroupByKeyword,
    groupByExpression: groupByExpressionTail ? makeListMap(groupByExpressionTail, 1, groupByExpressionHead) : [groupByExpressionHead],
    groupByExpressionSeparators: groupByExpressionTail ? makeListMap(groupByExpressionTail, 0) : undefined,
  }
}

HavingClause = havingKeyword:HavingToken postHavingKeyword:_ havingExpression:Expression
{
  return {
    havingKeyword: havingKeyword,
    postHavingKeyword: postHavingKeyword,
    havingExpression: havingExpression
  }
}

OrderByClause = orderByKeyword:OrderToken postOrderByKeyword:_ orderByUnitsHead:OrderByPart orderByUnitsTail:(Comma OrderByPart)*
{
  return {
    orderByKeyword: orderByKeyword,
    postOrderByKeyword: postOrderByKeyword,
    orderByUnits: orderByUnitsHead ? makeListMap(orderByUnitsTail, 1, orderByUnitsHead) : [orderByUnitsHead],
    orderBySeparators: makeListMap(orderByUnitsTail, 0),
  }
}

OrderByPart = expression:Expression direction:(_ (AscToken / DescToken))?
{
  return {
    expression: expression,
    postExpression: direction ? direction[0] : '',
    direction: direction ? direction[1] : '',
  }
}

LimitClause = limitKeyword:LimitToken postLimitKeyword:_ limitValue:SqlLiteral
{
  return {
    limitKeyword: limitKeyword,
    postLimitKeyword: postLimitKeyword,
    limitValue: limitValue
  }
}

UnionClause = unionKeyword:UnionToken postUnionKeyword:_ unionQuery:SqlQuery
{
  return {
    unionKeyword: unionKeyword,
    postUnionKeyword: postUnionKeyword,
    unionQuery: unionQuery
  }
}

// ------------------------------

Alias = column:Expression postColumn:_ asKeyword:AsToken postAs:_ alias:SqlRef
{
  return new sql.SqlAliasRef({
    column: column,
    postColumn: postColumn || '',
    asKeyword: asKeyword,
    alias: alias,
    innerSpacing: {
      postAs: postAs,
    }
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

Expression = CaseExpression / OrExpression

OrExpression = head:AndExpression tail:(_ OrToken _ AndExpression)*
{
  return maybeMakeMulti('OR', head, tail);
}

AndExpression = head:NotExpression tail:(_ AndToken _ NotExpression)*
{
  return maybeMakeMulti('AND', head, tail);
}

NotExpression = keyword:NotToken postKeyword:_ argument:NotExpression
{
  return new sql.SqlUnary({
    expressionType: 'NOT',
    keyword: keyword,
    innerSpacing: {
      postKeyword: postKeyword
    },
    argument: argument
  });
}
  / ComparisonExpression

ComparisonExpression = head:AdditionExpression tail:((__ ComparisonOperator __ (ComparisonExpression/AdditionExpression))/(_ BetweenToken _ (AndExpression/ComparisonExpression))/(_ (IsNotToken/IsToken) _ NullLiteral))*
{
  return maybeMakeMulti('Comparison', head, tail);
}

AdditionExpression = head:SubtractionExpression tail:(__ '+' __ SubtractionExpression)*
{
  return maybeMakeMulti('Additive', head, tail);
}

SubtractionExpression = head:MultiplicationExpression tail:(__ $('-' !'-') __ MultiplicationExpression)*
{
  return maybeMakeMulti('Additive', head, tail);
}

MultiplicationExpression = head:DivisionExpression tail:(__ '*' __ DivisionExpression)*
{
  return maybeMakeMulti('Multiplicative', head, tail);
}

DivisionExpression = head:UnaryExpression tail:(__ '/' __ UnaryExpression)*
{
  return maybeMakeMulti('Multiplicative', head, tail);
}

// !Number is to make sure that -3 parses as a number and not as -(3)
UnaryExpression = keyword:[+-] postKeyword:__ !Number argument:ConcatExpression
{
  return new sql.SqlUnary({
    expressionType: keyword,
    keyword: keyword,
    innerSpacing: {
      postKeyword: postKeyword
    },
    argument: argument
  });
}
  / ConcatExpression

ConcatExpression = head:BaseType tail:(__ '||' __ BaseType)*
{
  return maybeMakeMulti('Concat', head, tail);
}

BaseType
  = Function
  / Interval
  / Timestamp
  / SqlLiteral
  / SqlRef
  / SqlInParens

//--------------------------------------------------------------------------------------------------------------------------------------------------------

CaseExpression = SearchedCaseExpression/SimpleCaseExpression

SearchedCaseExpression =
  caseKeyword:CaseToken
  postCase:_
  whenThenUnitsHead:WhenThenPair
  whenThenUnitsTail:(_ WhenThenPair)*
  elseValue:(_ ElseToken _ Expression)?
  preEnd:_
  endKeyword:EndToken
{
  return new sql.SqlCaseSearched({
    caseKeyword: caseKeyword,
    whenThenUnits: whenThenUnitsTail ? makeListMap(whenThenUnitsTail, 1, whenThenUnitsHead) : [whenThenUnitsHead],
    postWhenThenUnitSpaces: whenThenUnitsTail ? makeListMap(whenThenUnitsTail, 0) : [],
    elseKeyword: elseValue ? elseValue[1] : undefined,
    elseExpression: elseValue ? elseValue[3] : undefined,
    endKeyword: endKeyword,
    innerSpacing: {
      postCase: postCase,
      postWhenThen: elseValue ? elseValue[0] : '',
      postElse: elseValue ? elseValue[2] : '',
      preEnd: preEnd,
    }
  });
}

SimpleCaseExpression =
  caseKeyword:CaseToken
  postCase:_
  caseExpression:Expression
  postCaseExpression:_
  whenThenUnitsHead:WhenThenPair
  whenThenUnitsTail:(_ WhenThenPair)*
  elseValue:(_ ElseToken _ Expression)?
  preEnd:_
  endKeyword:EndToken
{
  return new sql.SqlCaseSimple({
    caseKeyword: caseKeyword,
    caseExpression: caseExpression,
    whenThenUnits: whenThenUnitsTail ? makeListMap(whenThenUnitsTail, 1, whenThenUnitsHead) : [whenThenUnitsHead],
    elseKeyword: elseValue ? elseValue[1] : undefined,
    elseExpression: elseValue ? elseValue[3] : undefined,
    endKeyword: endKeyword,
    postWhenThenUnits: whenThenUnitsTail ? makeListMap(whenThenUnitsTail, 0) : [],
    innerSpacing: {
      postCase: postCase,
      postCaseExpression: postCaseExpression,
      postWhenThen: elseValue ? elseValue[0] : '',
      postElse: elseValue ? elseValue[2] : '',
      preEnd: preEnd,
    }
  });
}

WhenThenPair = whenKeyword:WhenToken postWhen:_ whenExpression:Expression postWhenExpression:_ thenKeyword:ThenToken postThen:_ thenExpression:OrExpression
{
  return {
    whenKeyword: whenKeyword,
    postWhenSpace: postWhen,
    whenExpression: whenExpression,
    postWhenExpressionSpace: postWhenExpression,
    thenKeyword: thenKeyword,
    postThenSpace: postThen,
    thenExpression: thenExpression,
  };
}



// ------------------------------

Interval = intervalKeyword:IntervalToken postIntervalKeyword:_ intervalValue:BaseType postIntervalValue: _ unitKeyword:($(Unit _ ToToken _ Unit)/$(Unit '_' Unit)/Unit)
{
  return new sql.SqlInterval({
    intervalKeyword: intervalKeyword,
    intervalValue: intervalValue,
    unitKeyword: unitKeyword,
    innerSpacing: {
      postIntervalKeyword: postIntervalKeyword,
      postIntervalValue: postIntervalValue
    }
  });
}

Unit
  = 'DAY'i
  / 'HOUR'i
  / 'MINUTE'i
  / 'MONTH'i
  / 'QUARTER'i
  / 'WEEK'i
  / 'YEAR'i
  / 'SECOND'i

Timestamp = timestampKeyword: TimestampToken postTimestampKeyword: _ timestampValue: SqlLiteral
{
  return new sql.SqlTimestamp({
    timestampKeyword: timestampKeyword,
    timestampValue: timestampValue,
    innerSpacing: {
      postTimestampKeyword: postTimestampKeyword,
    }
  })
}

Function =
  functionName:UnquotedRefPart
  postName:_?
  OpenParen
  postLeftParen:_?
  decorator:(FunctionDecorator _)?
  argumentHead:Expression
  argumentTail:((Comma/From) Expression)*
  preRightParen:_?
  CloseParen
  filter:(_ Filter)?
{
  return new sql.SqlFunction({
    functionName: functionName.name,
    decorator: decorator ? decorator[0] : undefined,
    arguments: argumentTail ? makeListMap(argumentTail, 1, argumentHead) : [argumentHead],
    separators: makeListMap(argumentTail, 0),
    filterKeyword: filter ? filter[1].filterKeyword : undefined,
    whereKeyword: filter ? filter[1].whereKeyword : undefined,
    whereExpression: filter ? filter[1].whereExpression : undefined,
    innerSpacing: {
      postName: postName ? postName : '',
      postDecorator: decorator ? decorator[1] || '' : '',
      postLeftParen: postLeftParen ? postLeftParen : '',
      preRightParen: preRightParen ? preRightParen : '',
      preFilter: filter && filter[0] ? filter[0] : '',
      postFilterKeyword: filter ? filter[1].postFilterKeyword : '',
      postFilterLeftParen: filter ? filter[1].postFilterLeftParen : '',
      postWhereKeyword: filter ? filter[1].postWhereKeyword : '',
      preFilterRightParen: filter ? filter[1].preFilterRightParen : '',
    }
  });
}

Filter = filterKeyword:FilterToken postFilterKeyword:_? OpenParen postLeftParen:_? filterExpression:WhereClause preRightParen:_? CloseParen
{
  return {
    filterKeyword: filterKeyword,
    postFilterKeyword: postFilterKeyword || '',
    postFilterLeftParen: postLeftParen || '',
    whereKeyword: filterExpression.whereKeyword,
    postWhereKeyword: filterExpression.postWhereKeyword,
    whereExpression: filterExpression.whereExpression,
    preFilterRightParen: preRightParen || '',
  }
}

Comma = left:_? ',' right:_?
{
  return new sql.Separator({
    left: left || '',
    right: right || '',
    separator: ','
  });
}

From = left:_? from:FromToken right:_?
{
  return new sql.Separator({
    left: left || '',
    right: right || '',
    separator: from
  });
}

SqlInParens = OpenParen leftSpacing:_? ex:Sql rightSpacing:_? CloseParen
{
  return ex.addParens(leftSpacing, rightSpacing);
}

SqlLiteral = lit:(NullToken / TrueToken / FalseToken / Number / SingleQuotedString)
{
  return new sql.SqlLiteral(lit);
}

NullLiteral = v:NullToken
{
  return new sql.SqlLiteral(v);
}

/* Numbers */

Number "Number" = n:$(
  [+-]?
  ((Digits Fraction?) / Fraction)
  ('e'i [+-]? Digits)?
)
{
  return {
    value: parseFloat(n),
    stringValue: n
  };
}

Fraction = $('.' Digits)

Digits = $ Digit+

Digit = [0-9]

SingleQuotedString = ['] name:$([^']*) [']
{
  return {
    value: name,
    stringValue: name,
    quotes: "'"
  };
}

// ------------------------------

SqlRef = tableBits:(RefPart _? "." _?)? column:RefPart !"."
{
  return new sql.SqlRef({
    column: column.name,
    quotes: column.quotes,
    table: deepGet(tableBits, '0.name'),
    tableQuotes: deepGet(tableBits, '0.quotes'),
    innerSpacing: {
      preTableDot: deepGet(tableBits, '1'),
      postTableDot: deepGet(tableBits, '3'),
    }
  });
}
/ namespaceBits:(RefPart _? "." _?) tableBits:(RefPart _? "." _?) column:RefPart !"."
{
  return new sql.SqlRef({
    column: column.name,
    quotes: column.quotes,
    table: deepGet(tableBits, '0.name'),
    tableQuotes: deepGet(tableBits, '0.quotes'),
    namespace: deepGet(namespaceBits, '0.name'),
    namespaceQuotes: deepGet(namespaceBits, '0.quotes'),
    innerSpacing: {
      preTableDot: deepGet(tableBits, '1'),
      posTabletDot: deepGet(tableBits, '3'),
      preNamespaceDot: deepGet(namespaceBits, '1'),
      postNamespaceDot: deepGet(namespaceBits, '3'),
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

UnquotedRefPart = name:$([a-z_:*%/]i [a-z0-9_\-:*%/]i*)
{
  return {
    name: name,
    quotes: ''
  }
}

// -----------------------------------

Annotation = preAnnotation:___ '--:' postAnnotationSignifier: ___? key:$([a-z0-9_\-:*%/]i+) postKey:___? "=" postEquals:___? value:$([a-z0-9_\-:*%/]i+)
{
  return new sql.Annotation({
    innerSpacing: {
      preAnnotation:  preAnnotation,
      postAnnotationSignifier: postAnnotationSignifier,
      postKey: postKey,
      postEquals: postEquals,
      preAnnotation: preAnnotation
    },
    key: key,
    value: value
  });
}

IdentifierPart = [a-z_]i

_ =
  spacing:($(([ \t\n\r]* "--" !':' [^\n]* ([\n] [ \t\n\r]*)?)+)
/ $([ \t\n\r]+))?

__ "optional whitespace" = _ / ''

___ "pure whitespace" = spacing:$([ \t\n\r]*)

EndOfQuery = $(_ ';'? _)

OpenParen "(" = "("

CloseParen ")" = ")"

ComparisonOperator =
  '='
/ '<>'
/ '>='
/ '<='
/ '<'
/ '>'
/ LikeToken
/ InToken
/ '!='

FunctionDecorator =
  LeadingToken
/ BothToken
/ TrailingToken
/ DistinctToken

JoinType =
  'LEFT'i
/ 'RIGHT'i
/ 'INNER'i
/ $('FULL'i _ 'OUTER'i)
/ 'FULL'i

/* Tokens */

AllToken = $('ALL'i !IdentifierPart)
AndToken = $('AND'i !IdentifierPart)
AsToken = $('AS'i !IdentifierPart)
AscToken = $('ASC'i !IdentifierPart)
BetweenToken = $('BETWEEN'i !IdentifierPart)
BothToken = $('Both'i !IdentifierPart)
ByToken = $('BY'i !IdentifierPart)
CaseToken = $('CASE'i !IdentifierPart)
DescToken = $('DESC'i !IdentifierPart)
DistinctToken = $('DISTINCT'i !IdentifierPart)
ElseToken = $('ELSE'i !IdentifierPart)
EndToken = $('END'i !IdentifierPart)
ExplainToken = $('EXPLAIN'i !IdentifierPart  _ 'PLAN'i !IdentifierPart  _ 'FOR'i !IdentifierPart)
FalseToken = s:$('FALSE'i !IdentifierPart) { return { value: false, stringValue: s }; }
FilterToken= $('FILTER'i !IdentifierPart)
FromToken = $('FROM'i !IdentifierPart)
GroupByToken = $('GROUP'i !IdentifierPart  _ 'BY'i !IdentifierPart)
HavingToken = $('HAVING'i !IdentifierPart)
InToken = $('IN'i !IdentifierPart)
IntervalToken = $('INTERVAL'i !IdentifierPart)
IsNotToken = $('IS'i _ 'NOT'i !IdentifierPart)
IsToken = $('IS'i !IdentifierPart)
JoinToken = $('JOIN'i !IdentifierPart)
LeadingToken = $('LEADING'i !IdentifierPart)
LikeToken = $('LIKE'i !IdentifierPart)
LimitToken = $('LIMIT'i !IdentifierPart)
NotToken = $('NOT'i !IdentifierPart)
NullToken = s:$('NULL'i !IdentifierPart) { return { value: null, stringValue: s }; }
OnToken = $('ON'i !IdentifierPart)
OrToken = $('OR'i !IdentifierPart)
OrderToken = $('ORDER'i !IdentifierPart _ 'BY'i !IdentifierPart)
SelectToken = $('SELECT'i !IdentifierPart)
ThenToken = $('THEN'i !IdentifierPart)
TimestampToken = $('TIMESTAMP'i !IdentifierPart)
ToToken = $('TO'i !IdentifierPart)
TrailingToken = $('TRAILING'i !IdentifierPart)
TrueToken = s:$('TRUE'i !IdentifierPart) { return { value: true, stringValue: s }; }
UnionToken = $('UNION'i !IdentifierPart  _ 'All'i !IdentifierPart)
WhenToken = $('WHEN'i !IdentifierPart)
WhereToken = $('WHERE'i !IdentifierPart)
WithToken = $('WITH'i !IdentifierPart)

