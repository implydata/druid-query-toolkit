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

Sql = SqlQuery / SqlAliasExpression

// ------------------------------

SqlQuery =
  preQuery:_?
  explainKeyword:(ExplainToken _)?
  withClause:(WithClause _)?
  select:SelectClause
  from:(_ FromClause)?
  where:(_ WhereClause)?
  groupBy:(_ GroupByClause)?
  having:(_ HavingClause)?
  orderBy:(_ OrderByClause)?
  limit:(_ LimitClause)?
  offset:(_ OffsetClause)?
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
    innerSpacing.postWithQuery = withClause[1];
  }

  value.selectKeyword = select.selectKeyword;
  innerSpacing.postSelect = select.postSelect;
  value.selectDecorator = select.selectDecorator;
  value.selectExpressions = select.selectExpressions;
  innerSpacing.postSelectDecorator = select.postSelectDecorator;

  if (from) {
    innerSpacing.preFrom = from[0];
    value.fromClause = from[1];
  }

  if (where) {
    innerSpacing.preWhere = where[0];
    value.whereClause = where[1];
  }

  if (groupBy) {
    innerSpacing.preGroupBy = groupBy[0];
    value.groupByClause = groupBy[1];
  }

  if (having) {
    innerSpacing.preHaving = having[0];
    value.havingClause = having[1];
  }

  if (orderBy) {
    innerSpacing.preOrderBy = orderBy[0];
    value.orderByClause = orderBy[1];
  }

  if (limit) {
    innerSpacing.preLimit = limit[0];
    value.limitClause = limit[1];
  }

  if (offset) {
    innerSpacing.preOffset = offset[0];
    value.offsetClause = offset[1];
  }

  if (union) {
    innerSpacing.preUnion = union[0];
    value.unionKeyword = union[1].unionKeyword;
    innerSpacing.postUnion = union[1].postUnion;
    value.unionQuery = union[1].unionQuery;
  }

  innerSpacing.postQuery = postQuery;

  return new sql.SqlQuery(value);
}

WithClause =
  withKeyword:WithToken
  postWith:_
  head:SqlWithPart
  tail:(CommaSeparator SqlWithPart)*
{
  return {
    withKeyword: withKeyword,
    postWith: postWith,
    withParts: makeSeparatedArray(head, tail),
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

WithColumns = OpenParen postLeftParen:_? head:BaseType tail:(CommaSeparator BaseType)* preRightParen:_? CloseParen
{
  return {
    postLeftParen: postLeftParen,
    withColumns: makeSeparatedArray(head, tail),
    preRightParen: preRightParen
  };
}

SelectClause =
  selectKeyword:SelectToken
  postSelect:_
  selectDecorator:((AllToken / DistinctToken) _)?
  head:SqlAliasExpression
  tail:(CommaSeparator SqlAliasExpression)*
{
  return {
    selectKeyword: selectKeyword,
    postSelect: postSelect,
    selectDecorator: selectDecorator ? selectDecorator[0] : undefined,
    postSelectDecorator: selectDecorator ? selectDecorator[1] : undefined,
    selectExpressions: makeSeparatedArray(head, tail).map(SqlAlias.fromBase),
  };
}

FromClause = keyword:FromToken postKeyword:_ head:SqlAlias tail:(CommaSeparator SqlAlias)* join:(_ JoinClauses)?
{
  return new sql.SqlFromClause({
    keyword: keyword,
    expressions: makeSeparatedArray(head, tail).map(function(table) {
      return SqlAlias.fromBaseAndUpgrade(table);
    }),
    joinParts: join ? join[1] : undefined,
    innerSpacing: {
      postKeyword: postKeyword,
      preJoin: join ? join[0] : undefined,
    },
  });
}

JoinClauses = head:SqlJoinPart tail:(_ SqlJoinPart)*
{
  return makeSeparatedArray(head, tail);
}

SqlJoinPart =
  joinType:JoinType
  postJoinType:_
  joinKeyword:JoinToken
  postJoinKeyword:_
  table:SqlAlias
  on:(_ OnToken _ Expression)?
{
  var value = {
    joinType: joinType,
    joinKeyword: joinKeyword,
    table: SqlAlias.fromBaseAndUpgrade(table),
  };
  var innerSpacing = value.innerSpacing = {
    postJoinType: postJoinType,
    postJoinKeyword: postJoinKeyword,
  };

  if (on) {
    innerSpacing.preOn = on[0];
    value.onKeyword = on[1];
    innerSpacing.postOn = on[2];
    value.onExpression = on[3];
  }
  return new sql.SqlJoinPart(value);
}

WhereClause = keyword:WhereToken postKeyword:_ expression:Expression
{
  return new sql.SqlWhereClause({
    keyword: keyword,
    expression: expression,
    innerSpacing: {
      postKeyword: postKeyword,
    }
  });
}

GroupByClause = keyword:GroupByToken postKeyword:_ expressions:(ExpressionList / "()")
{
  return new sql.SqlGroupByClause({
    keyword: keyword,
    expressions: expressions === '()' ? null : expressions,
    innerSpacing: {
      postKeyword: postKeyword,
    }
  });
}

ExpressionList = head:Expression tail:(CommaSeparator Expression)*
{
  return makeSeparatedArray(head, tail);
}

HavingClause = keyword:HavingToken postKeyword:_ expression:Expression
{
  return new sql.SqlHavingClause({
    keyword: keyword,
    expression: expression,
    innerSpacing: {
      postKeyword: postKeyword,
    }
  });
}

OrderByClause = keyword:OrderToken postKeyword:_ head:SqlOrderByExpression tail:(CommaSeparator SqlOrderByExpression)*
{
  return new sql.SqlOrderByClause({
    keyword: keyword,
    expressions: makeSeparatedArray(head, tail),
    innerSpacing: {
      postKeyword: postKeyword,
    },
  });
}

SqlOrderByExpression = expression:Expression direction:(_ (AscToken / DescToken))?
{
  var value = {
    expression: expression,
  };
  var innerSpacing = value.innerSpacing = {};

  if (direction) {
    innerSpacing.preDirection = direction[0];
    value.direction = direction[1];
  }

  return new sql.SqlOrderByExpression(value);
}

LimitClause = keyword:LimitToken postKeyword:_ limit:SqlLiteral
{
  return new sql.SqlLimitClause({
    keyword: keyword,
    limit: limit,
    innerSpacing: {
      postKeyword: postKeyword,
    },
  });
}

OffsetClause = keyword:OffsetToken postKeyword:_ offset:SqlLiteral
{
  return new sql.SqlOffsetClause({
    keyword: keyword,
    offset: offset,
    innerSpacing: {
      postKeyword: postKeyword,
    },
  });
}

UnionClause = unionKeyword:UnionToken postUnion:_ unionQuery:SqlQuery
{
  return {
    unionKeyword: unionKeyword,
    postUnion: postUnion,
    unionQuery: unionQuery
  };
}

// ------------------------------

SqlAlias = expression:(Expression / SqlInParens) alias:((_ AsToken)? _ SqlRef)?
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

SqlAliasExpression = expression:Expression alias:((_ AsToken)? _ SqlRef)?
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

Expression = OrExpression

OrExpression = head:AndExpression tail:(_ OrToken _ AndExpression)*
{
  return maybeMakeMulti('or', head, tail);
}

AndExpression = head:NotExpression tail:(_ AndToken _ NotExpression)*
{
  return maybeMakeMulti('and', head, tail);
}

NotExpression = keyword:NotToken postKeyword:_ arg:NotExpression
{
  return new sql.SqlUnary({
    keyword: keyword,
    innerSpacing: {
      postKeyword: postKeyword
    },
    arg: arg
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

ComparisonOpRhsBetween = op:BetweenToken postOp:_ start:BaseType preAnd:_ andKeyword:AndToken postAnd:_ end:BaseType
{
  return {
    op: op,
    postOp: postOp,
    rhs: new sql.SqlBetweenAndUnit({
      start: start,
      andKeyword: andKeyword,
      end: end,
      innerSpacing: {
        preAnd: preAnd,
        postAnd: postAnd,
      }
    })
  };
}

ComparisonOpRhsLike = op:(LikeToken / SimilarToToken) postOp:_ like:SqlLiteral escape:(_ EscapeToken _ SqlLiteral)?
{
  return {
    op: op,
    postOp: postOp,
    rhs: escape ? new sql.SqlLikeEscapeUnit({
      like: like,
      escapeKeyword: escape[1],
      escape: escape[3],
      innerSpacing: {
        preEscape: escape[0],
        postEscape: escape[2],
      }
    }) : like
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
  return maybeMakeMulti('+', head, tail);
}

SubtractionExpression = head:MultiplicationExpression tail:(_ $('-' !'-') _ MultiplicationExpression)*
{
  return maybeMakeMulti('-', head, tail);
}

MultiplicationExpression = head:DivisionExpression tail:(_ '*' _ DivisionExpression)*
{
  return maybeMakeMulti('*', head, tail);
}

DivisionExpression = head:UnaryExpression tail:(_ '/' _ UnaryExpression)*
{
  return maybeMakeMulti('/', head, tail);
}

// !Number is to make sure that -3 parses as a number and not as -(3)
UnaryExpression = keyword:[+-] postKeyword:_ !Number arg:ConcatExpression
{
  return new sql.SqlUnary({
    keyword: keyword,
    arg: arg,
    innerSpacing: {
      postKeyword: postKeyword
    }
  });
}
  / ConcatExpression

ConcatExpression = head:BaseType tail:(_ '||' _ BaseType)*
{
  return maybeMakeMulti('||', head, tail);
}

BaseType =
  SqlPlaceholder
/ Interval
/ CaseExpression
/ Function
/ SqlLiteral
/ SqlRef
/ SqlInParens

//--------------------------------------------------------------------------------------------------------------------------------------------------------

CaseExpression =
  caseKeyword:CaseToken
  postCase:_
  caseExpression:(Expression _)?
  head:WhenThenPair
  tail:(_ WhenThenPair)*
  elseValue:(_ ElseToken _ Expression)?
  preEnd:_
  endKeyword:EndToken
{
  return new sql.SqlCase({
    caseKeyword: caseKeyword,
    caseExpression: caseExpression ? caseExpression[0] : undefined,
    whenThenParts: makeSeparatedArray(head, tail),
    elseKeyword: elseValue ? elseValue[1] : undefined,
    elseExpression: elseValue ? elseValue[3] : undefined,
    endKeyword: endKeyword,
    innerSpacing: {
      postCase: postCase,
      postCaseExpression: caseExpression ? caseExpression[1] : undefined,
      preElse: elseValue ? elseValue[0] : undefined,
      postElse: elseValue ? elseValue[2] : undefined,
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
  keyword:IntervalToken
  postIntervalKeyword:_
  intervalValue:BaseType
  postIntervalValue:_
  unitKeyword:($(TimeUnit _ ToToken _ TimeUnit) / $(TimeUnit '_' TimeUnit) / TimeUnit)
{
  return new sql.SqlInterval({
    keyword: keyword,
    intervalValue: intervalValue,
    unitKeyword: unitKeyword,
    innerSpacing: {
      postIntervalKeyword: postIntervalKeyword,
      postIntervalValue: postIntervalValue
    }
  });
}

TimeUnit =
  'SECOND'i
/ 'MINUTE'i
/ 'HOUR'i
/ 'DAY'i
/ 'WEEK'i
/ 'MONTH'i
/ 'QUARTER'i
/ 'YEAR'i

TimeUnitExtra =
  TimeUnit
/ 'EPOCH'i
/ 'MICROSECOND'i
/ 'MILLISECOND'i
/ 'DOW'i
/ 'ISODOW'i
/ 'DOY'i
/ 'ISOYEAR'i
/ 'DECADE'i
/ 'CENTURY'i
/ 'MILLENNIUM'i

Function =
  GenericFunction
/ CastFunction
/ ExtractFunction
/ TrimFunction
/ FloorCeilFunction
/ TimestampAddDiffFunction
/ PositionFunction
/ ArrayFunction
/ NakedFunction

GenericFunction =
  functionName:UnquotedRefPartFree
  preLeftParen:_
  OpenParen
  postLeftParen:_
  decorator:(FunctionDecorator _)?
  head:Expression?
  tail:(CommaSeparator Expression)*
  postArguments:_
  CloseParen
  filter:(_ FunctionFilter)?
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

  if (head) {
    value.args = makeSeparatedArray(head, tail);
    innerSpacing.postArguments = postArguments;
  }

  if (filter) {
    innerSpacing.preFilter = filter[0];
    value.filterKeyword = filter[1].filterKeyword;
    innerSpacing.postFilter = filter[1].postFilter;
    value.whereClause = filter[1].whereClause;
  }

  return new sql.SqlFunction(value);
}

NakedFunction = functionName:UnquotedRefPartFree &{ return SqlBase.isNakedFunction(functionName) }
{
  return new sql.SqlFunction({
    functionName: functionName,
    specialParen: 'none',
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
    args: new sql.SeparatedArray([expr, typeLiteral], [separator]),
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
  unit:TimeUnitExtra
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
    args: new sql.SeparatedArray([unitLiteral, expr], [separator]),
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
    args: new sql.SeparatedArray([expr1, expr2], [separator]),
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
  unit:TimeUnit
  postArguments:_
  CloseParen
{
  var unitLiteral = new sql.SqlLiteral({
    value: unit.toUpperCase(),
    stringValue: unit,
  });
  return new sql.SqlFunction({
    functionName: functionName,
    args: new sql.SeparatedArray([expr, unitLiteral], [separator]),
    innerSpacing: {
      preLeftParen: preLeftParen,
      postLeftParen: postLeftParen,
      postArguments: postArguments,
    },
  });
}

TimestampAddDiffFunction =
  functionName:(TimestampaddToken / TimestampdiffToken)
  preLeftParen:_
  OpenParen
  postLeftParen:_
  unit:TimeUnit
  tail:(CommaSeparator Expression)*
  postArguments:_
  CloseParen
{
  var value = {
    functionName: functionName,
  };
  var innerSpacing = value.innerSpacing = {
    preLeftParen: preLeftParen,
    postLeftParen: postLeftParen,
  };

  var head = new sql.SqlLiteral({
    value: unit.toUpperCase(),
    stringValue: unit,
  });

  value.args = makeSeparatedArray(head, tail);
  innerSpacing.postArguments = postArguments;

  return new sql.SqlFunction(value);
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
    args: args,
    innerSpacing: {
      preLeftParen: preLeftParen,
      postLeftParen: postLeftParen,
      postArguments: postArguments,
    },
  });
}

ArrayFunction =
  functionName:ArrayToken
  preLeftParen:_
  '['
  postLeftParen:_
  head:Expression?
  tail:(CommaSeparator Expression)*
  postArguments:_
  ']'
{
  var value = {
    functionName: functionName,
    specialParen: 'square',
  };
  var innerSpacing = value.innerSpacing = {
    preLeftParen: preLeftParen,
    postLeftParen: postLeftParen,
  };

  if (head) {
    value.args = makeSeparatedArray(head, tail);
    innerSpacing.postArguments = postArguments;
  }

  return new sql.SqlFunction(value);
}

FunctionFilter = filterKeyword:FilterToken postFilter:_ OpenParen postLeftParen:_ whereClause:WhereClause preRightParen:_ CloseParen
{
  return {
    filterKeyword: filterKeyword,
    postFilter: postFilter,
    whereClause: whereClause.addParens(postLeftParen, preRightParen),
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

SqlPlaceholder = "?"
{
  return new sql.SqlPlaceholder();
}

SqlLiteral = lit:(NullToken / TrueToken / FalseToken / Number / SingleQuotedString / UnicodeString / CharsetString/ BinaryString / Timestamp)
{
  return new sql.SqlLiteral(lit);
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

CharsetString = "_" [a-z0-9]i [a-z0-9_-]i* "'" v:$([^']*) "'"
{
  return {
    value: v, // ToDo: fix this
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

Timestamp = keyword:(TimestampToken / DateToken) postKeyword:_ v:SingleQuotedString
{
  return {
    keyword: keyword,
    innerSpacing: {
      postKeyword: postKeyword
    },
    value: new Date(v.value.replace(' ', 'T') + 'Z'),
    stringValue: v.stringValue
  };
}

/* Array */

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

SqlRef = a:RefPart b:(_ "." _ RefPart)? c:(_ "." _ RefPart)?
{
  if (c) {
    return new sql.SqlRef({
      column: c[3].name,
      quotes: c[3].quotes,
      table: b[3].name,
      tableQuotes: b[3].quotes,
      namespace: a.name,
      namespaceQuotes: a.quotes,
      innerSpacing: {
        preTableDot: c[0],
        postTableDot: c[2],
        preNamespaceDot: b[0],
        postNamespaceDot: b[2],
      }
    });

  } else if (b) {
    return new sql.SqlRef({
      column: b[3].name,
      quotes: b[3].quotes,
      table: a.name,
      tableQuotes: a.quotes,
      innerSpacing: {
        preTableDot: b[0],
        postTableDot: b[2],
      }
    });

  } else {
    return new sql.SqlRef({
      column: a.name,
      quotes: a.quotes,
    });
  }
}

RefPart = QuotedRefPart / UnquotedRefPart / Star

QuotedRefPart = ["] name:$([^"]+) ["]
{
  return {
    name: name,
    quotes: true
  };
}

UnquotedRefPart = name:UnquotedRefPartFree !{ return SqlBase.isReservedKeyword(name) }
{
  return {
    name: text(),
    quotes: false
  };
}

UnquotedRefPartFree = $([a-z_]i [a-z0-9_]i*)

Star = '*'
{
  return {
    name: '*',
    quotes: false
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
DateToken = $('DATE'i !IdentifierPart)
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
OffsetToken = $('OFFSET'i !IdentifierPart)
OnToken = $('ON'i !IdentifierPart)
OrToken = $('OR'i !IdentifierPart)
OrderToken = $('ORDER'i !IdentifierPart __ ByToken)
PositionToken = $('POSITION'i !IdentifierPart)
SelectToken = $('SELECT'i !IdentifierPart)
SimilarToToken = $('SIMILAR'i !IdentifierPart __ ToToken)
ThenToken = $('THEN'i !IdentifierPart)
TimestampToken = $('TIMESTAMP'i !IdentifierPart)
TimestampaddToken = $('TIMESTAMPADD'i !IdentifierPart)
TimestampdiffToken = $('TIMESTAMPDIFF'i !IdentifierPart)
ToToken = $('TO'i !IdentifierPart)
TrailingToken = $('TRAILING'i !IdentifierPart)
TrimToken = $('TRIM'i !IdentifierPart)
TrueToken = $('TRUE'i !IdentifierPart) { return { value: true, stringValue: text() }; }
UnionToken = $('UNION'i !IdentifierPart __ AllToken)
WhenToken = $('WHEN'i !IdentifierPart)
WhereToken = $('WHERE'i !IdentifierPart)
WithToken = $('WITH'i !IdentifierPart)
