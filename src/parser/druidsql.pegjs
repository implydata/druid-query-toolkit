/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

Start = Sql

// Rest of the work...

Sql = SqlQuery / SqlAlias

// ------------------------------

SqlQuery =
  preQuery:_?
  explainKeyword:(ExplainToken _)?
  withClause:(WithClause _)?
  select:SelectClause
  from:(_ FromClause)?
  join:(_ JoinClause)?
  where:(_ WhereClause)?
  groupBy:(_ GroupByClause)?
  having:(_ HavingClause)?
  orderBy:(_ OrderByClause)?
  limit:(_ LimitClause)?
  union:(_ UnionClause)?
  postQuery:EndOfQuery?
{
  var value = {};
  var innerSpacing = value.innerSpacing = {};

  innerSpacing.preQuery = preQuery;

  if (explainKeyword) {
    value.explainKeyword = explainKeyword[0];
    innerSpacing.postExplain = explainKeyword[1];
  }

  if (withClause) {
    value.withKeyword = withClause[0].withKeyword;
    innerSpacing.postWith = withClause[0].postWith;
    value.withParts = withClause[0].withParts;
    value.withSeparators = withClause[0].withSeparators;
    innerSpacing.postWithQuery = withClause[1];
  }

  value.selectKeyword = select.selectKeyword;
  innerSpacing.postSelect = select.postSelect;
  value.selectDecorator = select.selectDecorator;
  value.selectSeparators = select.selectSeparators;
  value.selectValues = select.selectValues;
  innerSpacing.postSelectDecorator = select.postSelectDecorator;

  if (from) {
    innerSpacing.preFrom = from[0];
    value.fromKeyword = from[1].fromKeyword;
    innerSpacing.postFrom = from[1].postFrom;
    value.tables = from[1].tables;
    value.tableSeparators = from[1].tableSeparators;
  }

  if (join) {
    innerSpacing.preJoin = join[0];
    value.joinType = join[1].joinType;
    innerSpacing.postJoinType = join[1].postJoinTypeSpacing;
    value.joinKeyword = join[1].joinKeyword;
    innerSpacing.postJoinKeyword = join[1].postJoinKeywordSpacing;
    value.joinTable = join[1].table;
    innerSpacing.preOnKeyword = join[1].preOnKeywordSpacing;
    value.onKeyword = join[1].onKeyword;
    value.onExpression = join[1].onExpression;
    innerSpacing.postOn = join[1].postOnSpacing;
  }

  if (where) {
    innerSpacing.preWhereKeyword = where[0];
    value.whereKeyword = where[1].whereKeyword;
    innerSpacing.postWhereKeyword = where[1].postWhereKeyword;
    value.whereExpression = where[1].whereExpression;
  }

  if (groupBy) {
    innerSpacing.preGroupByKeyword = groupBy[0];
    value.groupByKeyword = groupBy[1].groupByKeyword;
    innerSpacing.postGroupByKeyword = groupBy[1].postGroupByKeyword;
    value.groupByExpressions = groupBy[1].groupByExpressions;
    value.groupBySeparators = groupBy[1].groupBySeparators;
  }

  if (having) {
    innerSpacing.preHavingKeyword = having[0];
    value.havingKeyword = having[1].havingKeyword;
    innerSpacing.postHavingKeyword = having[1].postHavingKeyword;
    value.havingExpression = having[1].havingExpression;
  }

  if (orderBy) {
    innerSpacing.preOrderByKeyword = orderBy[0];
    value.orderByKeyword = orderBy[1].orderByKeyword;
    innerSpacing.postOrderByKeyword = orderBy[1].postOrderByKeyword;
    value.orderByParts = orderBy[1].orderByParts;
    value.orderBySeparators = orderBy[1].orderBySeparators;
  }

  if (limit) {
    innerSpacing.preLimitKeyword = limit[0];
    value.limitKeyword = limit[1].limitKeyword;
    innerSpacing.postLimitKeyword = limit[1].postLimitKeyword;
    value.limitValue = limit[1].limitValue;
  }

  if (union) {
    innerSpacing.preUnionKeyword = union[0];
    value.unionKeyword = union[1].unionKeyword;
    innerSpacing.postUnionKeyword = union[1].postUnionKeyword;
    value.unionQuery = union[1].unionQuery;
  }

  innerSpacing.postQuery = postQuery;

  return new sql.SqlQuery(value);
}

WithClause =
  withKeyword:WithToken
  postWith:_
  withPartsHead:SqlWithPart
  withPartsTail:(CommaSeparator SqlWithPart)*
{
  return {
    withKeyword: withKeyword,
    postWith: postWith,
    withParts: makeSeparatedArray(withPartsHead, withPartsTail),
  };
}


SqlWithPart =
  withTable:Expression
  postWithTable:_?
  columns:(WithColumns _)?
  asKeyword:AsToken
  postAs:_
  withQuery:SqlInParens
{
  var value = {
    withTable: withTable,
    asKeyword: asKeyword,
    withQuery: withQuery,
  };
  var innerSpacing = value.innerSpacing = {
    postWithTable: postWithTable,
    postAs: postAs,
  };
  if (columns) {
    innerSpacing.postLeftParen = columns[0].postLeftParen;
    value.withColumns = columns[0].withColumns;
    innerSpacing.preRightParen = columns[0].preRightParen;
    innerSpacing.postWithColumns = columns[1];
  }
  return new sql.SqlWithPart(value);
}

WithColumns = OpenParen postLeftParen:_? withColumnsHead:BaseType withColumnsTail:(CommaSeparator BaseType)* preRightParen:_? CloseParen
{
  return {
    postLeftParen: postLeftParen,
    withColumns: makeSeparatedArray(withColumnsHead, withColumnsTail),
    preRightParen: preRightParen
  };
}

SelectClause =
  selectKeyword:SelectToken
  postSelect:_
  selectDecorator:((AllToken / DistinctToken) _)?
  selectValuesHead:SqlAlias
  selectValuesTail:(CommaSeparator SqlAlias)*
{
  return {
    selectKeyword: selectKeyword,
    postSelect: postSelect,
    selectDecorator: selectDecorator ? selectDecorator[0] : '',
    postSelectDecorator: selectDecorator ? selectDecorator[1] : '',
    selectValues: makeSeparatedArray(selectValuesHead, selectValuesTail).map(SqlAlias.fromBase),
  };
}

FromClause = fromKeyword:FromToken postFrom:_ tableHead:SqlAlias tableTail:(CommaSeparator SqlAlias)*
{
  return {
    fromKeyword: fromKeyword,
    postFrom: postFrom,
    tables: makeSeparatedArray(tableHead, tableTail).map(table => SqlAlias.fromBase(table.upgrade())),
  };
}

JoinClause =
  joinType:JoinType
  postJoinTypeSpacing:_
  joinKeyword:JoinToken
  postJoinKeywordSpacing:_
  table:SqlAlias
  on:(_ OnToken _ Expression)?
{
  var ret = {
    joinType: joinType,
    postJoinTypeSpacing: postJoinTypeSpacing,
    joinKeyword: joinKeyword,
    postJoinKeywordSpacing: postJoinKeywordSpacing,
    table: SqlAlias.fromBase(table.upgrade())
  };
  if (on) {
    ret.preOnKeywordSpacing = on[0];
    ret.onKeyword = on[1];
    ret.postOnSpacing = on[2];
    ret.onExpression = on[3];
  }
  return ret;
}

WhereClause = whereKeyword:WhereToken postWhereKeyword:_ whereExpression:Expression
{
  return {
    whereKeyword: whereKeyword,
    postWhereKeyword: postWhereKeyword,
    whereExpression: whereExpression
  };
}

GroupByClause = groupByKeyword:GroupByToken postGroupByKeyword:_ groupByExpressionsHead:Expression groupByExpressionsTail:(CommaSeparator Expression)*
{
  return {
    groupByKeyword: groupByKeyword,
    postGroupByKeyword: postGroupByKeyword,
    groupByExpressions: makeSeparatedArray(groupByExpressionsHead, groupByExpressionsTail),
  };
}

HavingClause = havingKeyword:HavingToken postHavingKeyword:_ havingExpression:Expression
{
  return {
    havingKeyword: havingKeyword,
    postHavingKeyword: postHavingKeyword,
    havingExpression: havingExpression
  };
}

OrderByClause = orderByKeyword:OrderToken postOrderByKeyword:_ orderByPartsHead:SqlOrderByPart orderByPartsTail:(CommaSeparator SqlOrderByPart)*
{
  return {
    orderByKeyword: orderByKeyword,
    postOrderByKeyword: postOrderByKeyword,
    orderByParts: makeSeparatedArray(orderByPartsHead, orderByPartsTail),
  };
}

SqlOrderByPart = expression:Expression direction:(_ (AscToken / DescToken))?
{
  var value = {
    expression: expression,
  };
  var innerSpacing = value.innerSpacing = {};

  if (direction) {
    innerSpacing.preDirection = direction[0];
    value.direction = direction[1];
  }

  return new sql.SqlOrderByPart(value);
}

LimitClause = limitKeyword:LimitToken postLimitKeyword:_ limitValue:SqlLiteral
{
  return {
    limitKeyword: limitKeyword,
    postLimitKeyword: postLimitKeyword,
    limitValue: limitValue
  };
}

UnionClause = unionKeyword:UnionToken postUnionKeyword:_ unionQuery:SqlQuery
{
  return {
    unionKeyword: unionKeyword,
    postUnionKeyword: postUnionKeyword,
    unionQuery: unionQuery
  };
}

// ------------------------------

SqlAlias = expression:Expression alias:((_ AsToken)? _ SqlRef)?
{
  if (!alias) {
    return expression;
  }

  var value = { expression: expression };
  var innerSpacing = value.innerSpacing = {};

  var as = alias[0];
  if (as) {
    innerSpacing.preAs = as[0];
    value.asKeyword = as[1];
  }

  innerSpacing.preAlias = alias[1];
  value.alias = alias[2];

  return new sql.SqlAlias(value);
}

/*
Expressions are defined below in acceding priority order

  Or (OR)
  And (AND)
  Not (NOT)
  Comparison (=, <=>, <, >, <=, >=, <>, !=, IS, LIKE, BETWEEN, IN)
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

ComparisonExpression = lhs:AdditionExpression preOp:_ opRhs:ComparisonOpRhs
{
  return new sql.SqlComparison({
    lhs: lhs,
    op: opRhs.op,
    notKeyword: opRhs.notKeyword,
    rhs: opRhs.rhs,
    innerSpacing: {
      preOp: opRhs.preOp ? opRhs.preOp : preOp,
      postOp: opRhs.postOp,
      not: opRhs.preOp ? preOp : opRhs.notSpacing
    }
  });
}
  / AdditionExpression

/*
  (_ (IsNotToken / IsToken) __ (NullLiteral / BooleanLiteral))
*/

ComparisonOpRhs = ComparisonOpRhsSimple / ComparisonOpRhsIs / ComparisonOpRhsIn / ComparisonOpRhsBetween / ComparisonOpRhsLike / ComparisonOpRhsNot

ComparisonOpRhsSimple = op:ComparisonOperator postOp:_ rhs:AdditionExpression
{
  return {
    op: op,
    postOp: postOp,
    rhs: rhs
  };
}

ComparisonOperator =
  '='
/ '!='
/ '<>'
/ '>='
/ '<='
/ '<'
/ '>'

ComparisonOpRhsIs = op:IsToken postOp:_ not:(NotToken _)? rhs:SqlLiteral
{
  return {
    op: op,
    postOp: postOp,
    rhs: rhs,
    notKeyword: not ? not[0] : undefined,
    notSpacing: not ? not[1] : undefined
  };
}

ComparisonOpRhsIn = op:InToken postOp:_ rhs:(SqlInArrayLiteral / SqlInParens)
{
  return {
    op: op,
    postOp: postOp,
    rhs: rhs
  };
}

ComparisonOpRhsBetween = op:BetweenToken postOp:_ start:BaseType preKeyword:_ keyword:AndToken postKeyword:_ end:BaseType
{
  return {
    op: op,
    postOp: postOp,
    rhs: {
      start,
      preKeyword,
      keyword,
      postKeyword,
      end
    }
  };
}

ComparisonOpRhsLike = op:(LikeToken / SimilarToToken) postOp:_ like:SqlLiteral escape:(_ EscapeToken _ SqlLiteral)?
{
  return {
    op: op,
    postOp: postOp,
    rhs: escape ? {
      like: like,
      preEscape: escape[0],
      escapeKeyword: escape[1],
      postEscape: escape[2],
      escape: escape[3]
    } : like
  };
}

ComparisonOpRhsNot = notKeyword:NotToken preOp:_ opRhs:(ComparisonOpRhsIn / ComparisonOpRhsBetween / ComparisonOpRhsLike)
{
  return Object.assign({}, opRhs, {
    notKeyword: notKeyword,
    preOp: preOp
  });
}

// -------------------------------

AdditionExpression = head:SubtractionExpression tail:(_ '+' _ SubtractionExpression)*
{
  return maybeMakeMulti('Additive', head, tail);
}

SubtractionExpression = head:MultiplicationExpression tail:(_ $('-' !'-') _ MultiplicationExpression)*
{
  return maybeMakeMulti('Additive', head, tail);
}

MultiplicationExpression = head:DivisionExpression tail:(_ '*' _ DivisionExpression)*
{
  return maybeMakeMulti('Multiplicative', head, tail);
}

DivisionExpression = head:UnaryExpression tail:(_ '/' _ UnaryExpression)*
{
  return maybeMakeMulti('Multiplicative', head, tail);
}

// !Number is to make sure that -3 parses as a number and not as -(3)
UnaryExpression = keyword:[+-] postKeyword:_ !Number argument:ConcatExpression
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

ConcatExpression = head:BaseType tail:(_ '||' _ BaseType)*
{
  return maybeMakeMulti('Concat', head, tail);
}

BaseType =
  Function
/ CastFunction
/ ExtractFunction
/ TrimFunction
/ FloorCeilFunction
/ PositionFunction
/ Interval
/ SqlLiteral
/ SqlRef
/ SpecialFunction
/ SqlInParens

//--------------------------------------------------------------------------------------------------------------------------------------------------------

CaseExpression = SearchedCaseExpression / SimpleCaseExpression

SearchedCaseExpression =
  caseKeyword:CaseToken
  postCase:_
  whenThenPartsHead:WhenThenPair
  whenThenPartsTail:(_ WhenThenPair)*
  elseValue:(_ ElseToken _ Expression)?
  preEnd:_
  endKeyword:EndToken
{
  return new sql.SqlCaseSearched({
    caseKeyword: caseKeyword,
    whenThenParts: makeSeparatedArray(whenThenPartsHead, whenThenPartsTail),
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
  whenThenPartsHead:WhenThenPair
  whenThenPartsTail:(_ WhenThenPair)*
  elseValue:(_ ElseToken _ Expression)?
  preEnd:_
  endKeyword:EndToken
{
  return new sql.SqlCaseSimple({
    caseKeyword: caseKeyword,
    caseExpression: caseExpression,
    whenThenParts: makeSeparatedArray(whenThenPartsHead, whenThenPartsTail),
    elseKeyword: elseValue ? elseValue[1] : undefined,
    elseExpression: elseValue ? elseValue[3] : undefined,
    endKeyword: endKeyword,
    postWhenThenParts: whenThenPartsTail ? makeListMap(whenThenPartsTail, 0) : [],
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
  return new sql.SqlWhenThenPart({
    whenKeyword: whenKeyword,
    whenExpression: whenExpression,
    thenKeyword: thenKeyword,
    thenExpression: thenExpression,
    innerSpacing: {
      postWhen: postWhen,
      postWhenExpression: postWhenExpression,
      postThen: postThen,
    }
  });
}



// ------------------------------

Interval =
  intervalKeyword:IntervalToken
  postIntervalKeyword:_
  intervalValue:BaseType
  postIntervalValue:_
  unitKeyword:($(Unit _ ToToken _ Unit) / $(Unit '_' Unit) / Unit)
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

Unit =
  'SECOND'i
/ 'MINUTE'i
/ 'HOUR'i
/ 'DAY'i
/ 'WEEK'i
/ 'MONTH'i
/ 'QUARTER'i
/ 'YEAR'i

Function =
  functionName:UnquotedRefPartFree
  preLeftParen:_
  OpenParen
  postLeftParen:_
  decorator:(FunctionDecorator _)?
  argumentsHead:Expression?
  argumentsTail:(CommaSeparator Expression)*
  postArguments:_
  CloseParen
  filter:(_ Filter)?
{
  var value = {
    functionName: functionName,
  };
  var innerSpacing = value.innerSpacing = {
    preLeftParen: preLeftParen,
    postLeftParen: postLeftParen,
  };

  if (decorator) {
    value.decorator = decorator[0];
    innerSpacing.postDecorator = decorator[1];
  }

  if (argumentsHead) {
    value.arguments = makeSeparatedArray(argumentsHead, argumentsTail);
    innerSpacing.postArguments = postArguments;
  }

  if (filter) {
    innerSpacing.preFilter = filter[0];
    value.filterKeyword = filter[1].filterKeyword;
    innerSpacing.postFilterKeyword = filter[1].postFilterKeyword;
    innerSpacing.postFilterLeftParen = filter[1].postFilterLeftParen;
    value.whereKeyword = filter[1].whereKeyword;
    innerSpacing.postWhereKeyword = filter[1].postWhereKeyword;
    value.whereExpression = filter[1].whereExpression;
    innerSpacing.preFilterRightParen = filter[1].preFilterRightParen;
  }

  return new sql.SqlFunction(value);
}

SpecialFunction = functionName:UnquotedRefPartFree &{ return SqlBase.isSpecialFunction(functionName) }
{
  return new sql.SqlFunction({
    functionName: functionName,
    special: true,
  });
}

CastFunction =
  functionName:CastToken
  preLeftParen:_
  OpenParen
  postLeftParen:_
  expr:Expression
  separator:AsSeparator
  type:UnquotedRefPartFree
  postArguments:_
  CloseParen
{
  var typeLiteral = new sql.SqlLiteral({
    value: type,
    stringValue: type,
  });
  return new sql.SqlFunction({
    functionName: functionName,
    arguments: new sql.SeparatedArray([expr, typeLiteral], [separator]),
    innerSpacing: {
      preLeftParen: preLeftParen,
      postLeftParen: postLeftParen,
      postArguments: postArguments,
    },
  });
}

ExtractFunction =
  functionName:ExtractToken
  preLeftParen:_
  OpenParen
  postLeftParen:_
  unit:Unit
  separator:FromSeparator
  expr:Expression
  postArguments:_
  CloseParen
{
  var unitLiteral = new sql.SqlLiteral({
    value: unit.toUpperCase(),
    stringValue: unit,
  });
  return new sql.SqlFunction({
    functionName: functionName,
    arguments: new sql.SeparatedArray([unitLiteral, expr], [separator]),
    innerSpacing: {
      preLeftParen: preLeftParen,
      postLeftParen: postLeftParen,
      postArguments: postArguments,
    },
  });
}

TrimFunction =
  functionName:TrimToken
  preLeftParen:_
  OpenParen
  postLeftParen:_
  decorator:(TrimDecoratorLead _)?
  expr1:Expression
  separator:FromSeparator
  expr2:Expression
  postArguments:_
  CloseParen
{
  var value = {
    functionName: functionName,
    arguments: new sql.SeparatedArray([expr1, expr2], [separator]),
  };
  var innerSpacing = value.innerSpacing = {
    preLeftParen: preLeftParen,
    postLeftParen: postLeftParen,
    postArguments: postArguments,
  };

  if (decorator) {
    value.decorator = decorator[0];
    innerSpacing.postDecorator = decorator[1];
  }

  return new sql.SqlFunction(value);
}

FloorCeilFunction =
  functionName:(FloorToken / CeilToken)
  preLeftParen:_
  OpenParen
  postLeftParen:_
  expr:Expression
  separator:ToSeparator
  unit:Unit
  postArguments:_
  CloseParen
{
  var unitLiteral = new sql.SqlLiteral({
    value: unit.toUpperCase(),
    stringValue: unit,
  });
  return new sql.SqlFunction({
    functionName: functionName,
    arguments: new sql.SeparatedArray([expr, unitLiteral], [separator]),
    innerSpacing: {
      preLeftParen: preLeftParen,
      postLeftParen: postLeftParen,
      postArguments: postArguments,
    },
  });
}

PositionFunction =
  functionName:PositionToken
  preLeftParen:_
  OpenParen
  postLeftParen:_
  expr1:Expression
  inSeparator:InSeparator
  expr2:Expression
  extra:(FromSeparator Expression)?
  postArguments:_
  CloseParen
{
  var args = extra
    ? new sql.SeparatedArray([expr1, expr2, extra[1]], [inSeparator, extra[0]])
    : new sql.SeparatedArray([expr1, expr2], [inSeparator])

  return new sql.SqlFunction({
    functionName: functionName,
    arguments: args,
    innerSpacing: {
      preLeftParen: preLeftParen,
      postLeftParen: postLeftParen,
      postArguments: postArguments,
    },
  });
}

Filter = filterKeyword:FilterToken postFilterKeyword:_ OpenParen postLeftParen:_ filterExpression:WhereClause preRightParen:_ CloseParen
{
  return {
    filterKeyword: filterKeyword,
    postFilterKeyword: postFilterKeyword,
    postFilterLeftParen: postLeftParen,
    whereKeyword: filterExpression.whereKeyword,
    postWhereKeyword: filterExpression.postWhereKeyword,
    whereExpression: filterExpression.whereExpression,
    preFilterRightParen: preRightParen,
  };
}

CommaSeparator = left:_ ',' right:_
{
  return new sql.Separator({
    left: left,
    separator: ',',
    right: right,
  });
}

AsSeparator = left:_ separator:AsToken right:_
{
  return new sql.Separator({
    left: left,
    separator: separator,
    right: right,
  });
}

FromSeparator = left:_ separator:FromToken right:_
{
  return new sql.Separator({
    left: left,
    separator: separator,
    right: right,
  });
}

ToSeparator = left:_ separator:ToToken right:_
{
  return new sql.Separator({
    left: left,
    separator: separator,
    right: right,
  });
}

InSeparator = left:_ separator:InToken right:_
{
  return new sql.Separator({
    left: left,
    separator: separator,
    right: right,
  });
}

SqlInParens = OpenParen leftSpacing:_ ex:Sql rightSpacing:_ CloseParen
{
  return ex.addParens(leftSpacing, rightSpacing);
}

SqlLiteral = lit:(DynamicPlaceholder / NullToken / TrueToken / FalseToken / Number / SingleQuotedString / UnicodeString / BinaryString / Timestamp / Array)
{
  return new sql.SqlLiteral(lit);
}

DynamicPlaceholder = "?"
{
  return {
    value: "?",
    stringValue: "?"
  };
}

NullLiteral = v:NullToken
{
  return new sql.SqlLiteral(v);
}

BooleanLiteral = v:(TrueToken / FalseToken)
{
  return new sql.SqlLiteral(v);
}

/* Numbers */

Number "Number" =
  [+-]?
  ((Digits Fraction?) / Fraction)
  ('e'i [+-]? Digits)?
{
  var n = text();
  return {
    value: parseFloat(n),
    stringValue: n
  };
}

Fraction = $('.' Digits)

Digits = $ Digit+

Digit = [0-9]

/* Strings */

SingleQuotedString = "'" v:$([^']*) "'"
{
  return {
    value: v,
    stringValue: text()
  };
}

UnicodeString = "U&'"i v:$([^']*) "'"
{
  return {
    value: v.replace(/\\[0-9a-f]{4}/gi, function(s) { return String.fromCharCode(parseInt(s.substr(1), 16)); }),
    stringValue: text()
  };
}

BinaryString = "X'"i v:$([0-9A-F]i*) "'"
{
  return {
    value: v, // ToDo: fix this
    stringValue: text()
  };
}

/* Timestamp */

Timestamp = keyword:TimestampToken postKeyword:_ v:SingleQuotedString
{
  return {
    keyword: keyword,
    innerSpacing: {
      postKeyword: postKeyword
    },
    value: v.value,
    stringValue: v.stringValue
  };
}

/* Array */

Array = keyword:ArrayToken postKeyword:_ v:ArrayBody
{
 return {
   keyword: keyword,
   innerSpacing: {
     postKeyword: postKeyword
   },
   value: v.value,
   stringValue: v.stringValue
 };
}

ArrayBody = '[' _ vs:ArrayEntries? _ ']'
{
  var values = (vs || []).map(function(d) {
    return d.value;
  });

  return {
    value: values,
    stringValue: text()
  };
}

SqlInArrayLiteral = '(' _ vs:ArrayEntries? _ ')'
{
  var values = (vs || []).map(function(d) {
    return d.value;
  });

  return new sql.SqlLiteral({
    value: values,
    stringValue: text()
  });
}

ArrayEntries = head:ArrayEntry tail:(CommaSeparator ArrayEntry)*
{
  return makeListMap(tail, 1, head);
}

ArrayEntry = Number / SingleQuotedString / UnicodeString / BinaryString

// ------------------------------

SqlRef = tableBits:(RefPart _ "." _)? column:RefPart !"."
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
/ namespaceBits:(RefPart _ "." _) tableBits:(RefPart _ "." _) column:RefPart !"."
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

RefPart = QuotedRefPart / UnquotedRefPart / Star

QuotedRefPart = ["] name:$([^"]+) ["]
{
  return {
    name: name,
    quotes: '"'
  };
}

UnquotedRefPart = name:UnquotedRefPartFree !{ return SqlBase.isReservedKeyword(name) }
{
  return {
    name: text(),
    quotes: ''
  };
}

UnquotedRefPartFree = $([a-z_]i [a-z0-9_]i*)

Star = '*'
{
  return {
    name: '*',
    quotes: ''
  };
}

// -----------------------------------

IdentifierPart = [a-z_]i

_ "optional whitespace" = $(Space* ("--" [^\n]* ([\n] Space*)?)*)

__ "mandatory whitespace" = $(Space+ ("--" [^\n]* ([\n] Space*)?)*)

___ "pure whitespace" = $(Space*)

Space = [ \t\n\r]

EndOfQuery = $(_ ';'? _)

OpenParen "(" = "("

CloseParen ")" = ")"

FunctionDecorator =
  DistinctToken
/ $(TrimDecoratorLead (_ FromToken)?)

TrimDecoratorLead =
  LeadingToken
/ BothToken
/ TrailingToken

JoinType =
  'LEFT'i
/ 'RIGHT'i
/ 'INNER'i
/ $('FULL'i _ 'OUTER'i)
/ 'FULL'i
/ 'CROSS'i

/* Tokens */

AllToken = $('ALL'i !IdentifierPart)
AndToken = $('AND'i !IdentifierPart)
ArrayToken = $('ARRAY'i !IdentifierPart)
AsToken = $('AS'i !IdentifierPart)
AscToken = $('ASC'i !IdentifierPart)
BetweenToken = $('BETWEEN'i !IdentifierPart (__ 'SYMMETRIC'i !IdentifierPart)?)
BothToken = $('BOTH'i !IdentifierPart)
ByToken = $('BY'i !IdentifierPart)
CaseToken = $('CASE'i !IdentifierPart)
CastToken = $('CAST'i !IdentifierPart)
CeilToken = $('CEIL'i !IdentifierPart)
DescToken = $('DESC'i !IdentifierPart)
DistinctToken = $('DISTINCT'i !IdentifierPart)
ElseToken = $('ELSE'i !IdentifierPart)
EndToken = $('END'i !IdentifierPart)
EscapeToken = $('ESCAPE'i !IdentifierPart)
ExplainToken = $('EXPLAIN'i !IdentifierPart __ 'PLAN'i !IdentifierPart __ 'FOR'i !IdentifierPart)
ExtractToken = $('EXTRACT'i !IdentifierPart)
FalseToken = $('FALSE'i !IdentifierPart) { return { value: false, stringValue: text() }; }
FilterToken= $('FILTER'i !IdentifierPart)
FloorToken = $('FLOOR'i !IdentifierPart)
FromToken = $('FROM'i !IdentifierPart)
GroupByToken = $('GROUP'i !IdentifierPart _ ByToken)
HavingToken = $('HAVING'i !IdentifierPart)
InToken = $('IN'i !IdentifierPart)
IntervalToken = $('INTERVAL'i !IdentifierPart)
IsNotToken = $('IS'i __ NotToken)
IsToken = $('IS'i !IdentifierPart)
JoinToken = $('JOIN'i !IdentifierPart)
LeadingToken = $('LEADING'i !IdentifierPart)
LikeToken = $('LIKE'i !IdentifierPart)
LimitToken = $('LIMIT'i !IdentifierPart)
NotToken = $('NOT'i !IdentifierPart)
NullToken = $('NULL'i !IdentifierPart) { return { value: null, stringValue: text() }; }
OnToken = $('ON'i !IdentifierPart)
OrToken = $('OR'i !IdentifierPart)
OrderToken = $('ORDER'i !IdentifierPart __ ByToken)
PositionToken = $('POSITION'i !IdentifierPart)
SelectToken = $('SELECT'i !IdentifierPart)
SimilarToToken = $('SIMILAR'i !IdentifierPart __ ToToken)
ThenToken = $('THEN'i !IdentifierPart)
TimestampToken = $('TIMESTAMP'i !IdentifierPart)
ToToken = $('TO'i !IdentifierPart)
TrailingToken = $('TRAILING'i !IdentifierPart)
TrimToken = $('TRIM'i !IdentifierPart)
TrueToken = $('TRUE'i !IdentifierPart) { return { value: true, stringValue: text() }; }
UnionToken = $('UNION'i !IdentifierPart __ AllToken)
WhenToken = $('WHEN'i !IdentifierPart)
WhereToken = $('WHERE'i !IdentifierPart)
WithToken = $('WITH'i !IdentifierPart)
