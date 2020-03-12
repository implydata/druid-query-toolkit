Start = Sql

//

Sql = SqlQuery
  / Expression
  / SqlRef
  / SqlLiteral
  / SqlInParens

// ------------------------------

SqlQuery
  =
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
  postQueryAnnotation: Annotation*
  postQuery:EndOfQuery?
{
  return new sql.SqlQuery({
    explainKeyword: explainKeyword ? explainKeyword[0]: '',

    withKeyword: withClause ?  withClause[0].withKeyword : undefined,
    postWith: withClause ?  withClause[0].postWith : undefined,
    withUnits: withClause ?  withClause[0].withUnits : undefined,
    withSeparators: withClause ?  withClause[0].withSeparators : undefined,

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
    unionQuery: union ?  union[1].unionQuery : undefined,

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

WithClause
  =
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


WithUnit
  =
  withTableName:Expression
  postWithTable:_?
  columns: (WithColumns _)?
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

WithColumns = '(' postLeftParen:_? withColumnsHead:BaseType withColumnsTail:(Comma BaseType)* preRightParen:_? ')'
{
  return {
    postLeftParen: postLeftParen || '',
    withColumns: withColumnsHead ?  makeListMap(withColumnsTail, 1, withColumnsHead) : withColumnsHead,
    withSeparators: makeListMap(withColumnsTail, 1),
    preRightParen: preRightParen || ''
  }
}

SelectClause = selectKeyword:SelectToken postSelect:_ selectDecorator:((AllToken/DistinctToken) _)? selectValuesHead:(Alias/Expression) annotationsHead:Annotation?  selectValuesTail:(Comma (Alias/Expression) Annotation?)*
{
  return {
     selectKeyword: selectKeyword,
     postSelect: postSelect,
     selectDecorator: selectDecorator? selectDecorator[0] : '',
     postSelectDecorator: selectDecorator? selectDecorator[1] : '',
     selectValues: selectValuesTail ? makeListMap(selectValuesTail, 1, selectValuesHead) : [selectValuesHead],
     selectSeparators: makeListMap(selectValuesTail,0),
     selectAnnotations: selectValuesTail ?  makeListMap(selectValuesTail, 2, annotationsHead) : [annotationsHead],
  }
}

FromClause = fromKeyword:FromToken postFrom:_ tableHead:(Alias/SqlRef) tableTail:(Comma (Alias/SqlRef))*
{
  return {
    fromKeyword: fromKeyword,
    postFrom: postFrom,
    tables: tableTail ? makeListMap(tableTail, 1, tableHead): [tableHead],
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
    table: table,
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
    groupByExpressionSeparators: groupByExpressionTail ?  makeListMap(groupByExpressionTail, 0) : undefined,
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

OrderByPart = expression:Expression  direction:(_ ('ASC'/'DESC'i))?
{
  return {
    expression: expression,
    postExpression: direction ? direction[0] : '',
    direction: direction ? direction[1] : '',
  }
}

LimitClause = limitKeyword:LimitToken postLimitKeyword:_ limitValue: SqlLiteral
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
    innerSpacing : {
        postAs: postAs,
    }
  });
}


Expression = CaseExpression/OrExpression

OrExpression = head:AndExpression tail:(_ OrToken _ (AndExpression))*
  {
    if (!tail.length) return head
    return new sql.SqlMulti ({
      expressionType: 'OR',
      arguments: makeListMap(tail, 3, head),
      separators: makeSeparatorsList(tail).map(keyword =>{ return new sql.Separator(keyword)}),
    });
  }

AndExpression = head:NotExpression tail:(_ AndToken _ (NotExpression))*
  {
    if (!tail.length) return head
    return new sql.SqlMulti ({
      expressionType: 'AND',
      arguments: makeListMap(tail, 3, head),
      separators: makeSeparatorsList(tail).map(keyword =>{ return new sql.Separator(keyword)}),
    });
  }

NotExpression = keyword:NotToken postKeyword:_ argument:(NotExpression/OrExpression)
  {
    return new sql.SqlUnary ({
      keyword: keyword,
      innerSpacing : {
        postKeyword: postKeyword
      },
      argument: argument,
      expressionType: 'NOT'
    });
  }
  /ComparisonExpression

ComparisonExpression = head:AdditionExpression tail:((__ ComparisonOperator __ (ComparisonExpression/AdditionExpression))/(_ BetweenToken _ (AndExpression/ComparisonExpression)))*
  {
    if (!tail.length) return head
    return new sql.SqlMulti ({
      expressionType: 'Comparison',
      arguments: makeListMap(tail, 3, head),
      separators: makeSeparatorsList(tail).map(keyword =>{ return new sql.Separator(keyword)}),
    });
  }

AdditionExpression = head:SubtractionExpression tail:(__ '+' __ (SubtractionExpression))*
  {
    if (!tail.length) return head
    return new sql.SqlMulti ({
      expressionType: 'Additive',
      arguments: makeListMap(tail, 3, head),
      separators: makeSeparatorsList(tail).map(keyword =>{ return new sql.Separator(keyword)}),
    });
  }


SubtractionExpression = head:MultiplicationExpression tail:(__ '-' (!'-') __ (MultiplicationExpression))*
  {
    if (!tail.length) return head
    return new sql.SqlMulti ({
      expressionType: 'Additive',
      arguments: makeListMap(tail, 4, head),
      separators: makeEscapedSeparatorsList(tail).map(keyword =>{ return new sql.Separator(keyword)}),
    });
  }

MultiplicationExpression = head:DivisionExpression tail:(__ '*' __ (MultiplicationExpression/BaseType))*
  {
    if (!tail.length) return head
    return new sql.SqlMulti ({
      expressionType: 'Multiplicative',
      arguments: makeListMap(tail, 3, head),
      separators: makeSeparatorsList(tail).map(keyword =>{ return new sql.Separator(keyword)}),
    });
  }

DivisionExpression = head:ConcatExpression tail:(__ '/' __ (DivisionExpression/ConcatExpression))*
  {
    if (!tail.length) return head
      return new sql.SqlMulti ({
      expressionType: 'Multiplicative',
      arguments: makeListMap(tail, 3, head),
      separators: makeSeparatorsList(tail).map(keyword =>{ return new sql.Separator(keyword)}),
    });
  }

ConcatExpression = head:BaseType tail:(__ '||' __ (BaseType))*
  {
    if (!tail.length) return head
    return new sql.SqlMulti ({
      expressionType: 'Concat',
      arguments: makeListMap(tail, 3, head),
      separators: makeSeparatorsList(tail).map(keyword =>{ return new sql.Separator(keyword)}),
    });
  }

BaseType
  = Function
  / Interval
  / TimeStamp
  / SqlLiteral
  / SqlRef
  / SqlInParens

//--------------------------------------------------------------------------------------------------------------------------------------------------------

CaseExpression = SearchedCaseExpression/SimpleCaseExpression

SearchedCaseExpression
  = caseKeyword:CaseToken
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
      postWhenThenUnitSpaces: whenThenUnitsTail ?  makeListMap(whenThenUnitsTail, 0) : [],
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

SimpleCaseExpression
  =
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
      postWhenThenUnits: whenThenUnitsTail ?  makeListMap(whenThenUnitsTail, 0) : [],
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
      whenKeyword:whenKeyword,
      postWhenSpace:postWhen,
      whenExpression:whenExpression,
      postWhenExpressionSpace:postWhenExpression,
      thenKeyword:thenKeyword,
      postThenSpace:postThen,
      thenExpression:thenExpression,
    }
  }



// ------------------------------

Interval=  intervalKeyword:IntervalToken postIntervalKeyword:_ intervalValue:BaseType postIntervalValue: _ unitKeyword:($(Unit _ 'TO'i _ Unit)/$(Unit '_' Unit)/Unit)
  {
    return new sql.SqlInterval({
      intervalKeyword:intervalKeyword,
      intervalValue:intervalValue,
      unitKeyword : unitKeyword,
      innerSpacing: {
        postIntervalKeyword: postIntervalKeyword,
        postIntervalValue:postIntervalValue
      }
    });
  }

Unit =
  'DAY'i
  /'HOUR'i
  /'MINUTE'i
  /'MONTH'i
  /'QUARTER'i
  /'WEEK'i
  /'YEAR'i
  /'SECOND'i

TimeStamp = timestampKeyword: TimestampToken postTimestampKeyword: _ timestampValue: SqlLiteral {
  return new sql.SqlTimestamp({
    timestampKeyword: timestampKeyword,
    timestampValue: timestampValue,
    innerSpacing: {
    postTimestampKeyword: postTimestampKeyword,
    }
  })
}

Function = functionName:Functions postName:_? OpenParen postLeftParen:_? decorator:(Decorator _)? argumentHead:(Expression) argumentTail:((Comma/From) (Expression))* preRightParen:_? CloseParen filter:(_ Filter)?
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

Functions = Function:UnquotedRefPart
&{
  if (functions.includes(Function.name.toUpperCase())) {
    return true;
  }
}
{
  return Function;
}

Comma = left:_? ',' right:_?
{
  return new sql.Separator({
    left: left || '',
    right: right || '',
    separator: ','
  });
}

From = left:_? from:'FROM'i right:_?
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

SqlLiteral = lit:(Number / SingleQuotedString)
{
  return new sql.SqlLiteral(lit);
}
/ SqlInParens

Number = n:$([0-9]+)
{
 return {
      value: parseInt(n, 10),
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
/SqlInParens

RefPart = QuotedRefPart / UnquotedRefPart

QuotedRefPart = ["] name:$([^"]+) ["]
{
  return {
    name: name,
    quotes: '"'
  }
}

UnquotedRefPart = name:$([a-z_\-:*%/]i [a-z0-9_\-:*%/]i*)
{
  return {
    name: name,
    quotes: ''
  }
}

// -----------------------------------

Annotation = preAnnotation:___ '--:' postAnnotationSignifier: ___? key:$([a-z0-9_\-:*%/]i+) postKey:___? "=" postEquals:___? value:$([a-z0-9_\-:*%/]i+)
{ return new sql.Annotation(
  {
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
  spacing: ($(([ \t\n\r]* "--" !':' [^\n]* ([\n] [ \t\n\r]*)?)+)
  / $([ \t\n\r]+))?

___ "pure whitespace" = spacing: $([ \t\n\r]*)

__ "optional whitespace" = _ / ''

EndOfQuery = $(_ ';'? _)

OpenParen "("
 = "("

CloseParen ")"
 = ")"

ComparisonOperator
  ='='
  /'<>'
  /'>='
  /'<='
  /'<'
  /'>'
  /'LIKE'i
  /'IN'i
  /'!='

AdditiveOperator
  ='+'
  /'||'
  /'-'

MultiplicativeOperator
  ='*'
  /'/'

Decorator =
  'LEADING'i
  /'BOTH'i
  /'TRAILING'i
  /'DISTINCT'i

JoinType =
    'LEFT'i
    /'RIGHT'i
    /'INNER'i
    /$('FULL'i _ 'OUTER'i)
    /'FULL'i

OrToken = $('OR'i !IdentifierPart)
AndToken = $('AND'i !IdentifierPart)
NotToken = $('NOT'i !IdentifierPart)
BetweenToken = $('BETWEEN'i !IdentifierPart)
SelectToken = $('SELECT'i !IdentifierPart)
AllToken = $('ALL'i !IdentifierPart)
DistinctToken = $('DISTINCT'i !IdentifierPart)
FromToken = $('FROM'i !IdentifierPart)
WhereToken = $('WHERE'i !IdentifierPart)
GroupByToken = $('GROUP'i !IdentifierPart  _ 'BY'i !IdentifierPart)
ByToken = $('BY'i !IdentifierPart)
HavingToken = $('HAVING'i !IdentifierPart)
OrderToken = $('ORDER'i !IdentifierPart _ 'BY'i !IdentifierPart)
LimitToken = $('LIMIT'i !IdentifierPart)
UnionToken = $('UNION'i !IdentifierPart  _ 'All'i !IdentifierPart)
CaseToken = $('CASE'i !IdentifierPart)
WhenToken = $('WHEN'i !IdentifierPart)
ThenToken = $('THEN'i !IdentifierPart)
ElseToken = $('ELSE'i !IdentifierPart)
EndToken = $('END'i !IdentifierPart)
AsToken = $('AS'i !IdentifierPart)
ExplainToken = $('EXPLAIN'i !IdentifierPart  _ 'PLAN'i !IdentifierPart  _ 'FOR'i !IdentifierPart)
WithToken = $('WITH'i !IdentifierPart)
FilterToken= $('FILTER'i !IdentifierPart)
IntervalToken = $('INTERVAL'i !IdentifierPart)
TimestampToken = $('TIMESTAMP'i !IdentifierPart)
OnToken = $('ON'i !IdentifierPart)
JoinToken = $('JOIN'i !IdentifierPart)

