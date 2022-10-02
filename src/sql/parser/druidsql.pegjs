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

Start = initial:_? thing:(SqlQuery / SqlAlias) final:_?
{
  if (initial) thing = thing.changeSpace('initial', initial);
  if (final) thing = thing.changeSpace('final', final);
  return thing;
}

// ------------------------------

SqlAlias = expression:Expression alias:((_ AsToken)? _ RefNameAlias)? columns:(_ SqlColumnList)?
{
  if (!alias) return expression;

  var value = { expression: expression };
  var spacing = value.spacing = {};
  var keywords = value.keywords = {};

  var as = alias[0];
  if (as) {
    spacing.preAs = as[0];
    keywords.as = as[1];
  } else {
    keywords.as = '';
  }

  if (columns) {
    spacing.preColumns = columns[0];
    value.columns = columns[1];
  }

  spacing.preAlias = alias[1];
  value.alias = alias[2];

  return new sql.SqlAlias(value);
}

SqlAliasExplicitAs = expression:Expression alias:(_ AsToken _ RefNameAlias)?
{
  if (!alias) return expression;

  return new sql.SqlAlias({
    expression: expression,
    alias: alias[3],
    spacing: {
      preAs: alias[0],
      preAlias: alias[2],
    },
    keywords: {
      as: alias[1],
    },
  });
}

// ------------------------------

SqlQuery =
  explainClause:(ExplainClause _)?
  insertClause:(InsertClause _)?
  replaceClause:(ReplaceClause _)?
  heart:(((WithClause _)? QueryHeart) / (WithClause _ OpenParen _ SqlQuery _ CloseParen))
  orderByClause:(_ OrderByClause)?
  limitClause:(_ LimitClause)?
  offsetClause:(_ OffsetClause)?
  partitionedByClause:(_ PartitionedByClause)?
  clusteredByClause:(_ ClusteredByClause)?
  union:(_ UnionClause)?
{
  var value = {};
  var keywords = value.keywords = {};
  var spacing = value.spacing = {};

  if (explainClause) {
    value.explainClause = explainClause[0];
    spacing.postExplainClause = explainClause[1];
  }

  if (insertClause && replaceClause) {
    error('Can not have both an INSERT and a REPLACE clause');
  }

  if (insertClause) {
    value.insertClause = insertClause[0];
    spacing.postInsertClause = insertClause[1];
  }

  if (replaceClause) {
    value.replaceClause = replaceClause[0];
    spacing.postReplaceClause = replaceClause[1];
  }

  var withQueryMode = heart.length === 7;
  if (withQueryMode) {
    value.withClause = heart[0];
    spacing.postWithClause = heart[1];
    value.query = heart[4].addParens(heart[3], heart[5]);
  } else {
    var withClause = heart[0];
    if (withClause) {
      value.withClause = withClause[0];
      spacing.postWithClause = withClause[1];
    }

    var subQuery = heart[1];
    Object.assign(value, subQuery.value);
    Object.assign(keywords, subQuery.keywords);
    Object.assign(spacing, subQuery.spacing);
  }

  if (partitionedByClause) {
    spacing.prePartitionedByClause = partitionedByClause[0];
    value.partitionedByClause = partitionedByClause[1];
  }

  if (clusteredByClause) {
    spacing.preClusteredByClause = clusteredByClause[0];
    value.clusteredByClause = clusteredByClause[1];
  }

  if (orderByClause) {
    spacing.preOrderByClause = orderByClause[0];
    value.orderByClause = orderByClause[1];
  }

  if (limitClause) {
    spacing.preLimitClause = limitClause[0];
    value.limitClause = limitClause[1];
  }

  if (offsetClause) {
    spacing.preOffsetClause = offsetClause[0];
    value.offsetClause = offsetClause[1];
  }

  if (union) {
    spacing.preUnion = union[0];
    keywords.union = union[1].unionKeyword;
    spacing.postUnion = union[1].postUnion;
    value.unionQuery = union[1].unionQuery;
  }

  return withQueryMode ? new sql.SqlWithQuery(value) : new sql.SqlQuery(value);
}


QueryHeart =
  select:SelectClause
  fromClause:(_ FromClause)?
  whereClause:(_ SqlWhereClause)?
  groupByClause:(_ GroupByClause)?
  havingClause:(_ HavingClause)?
{
  var value = {};
  var keywords = {};
  var spacing = {};

  keywords.select = select.selectKeyword;
  spacing.postSelect = select.postSelect;
  value.decorator = select.decorator;
  keywords.decorator = select.decoratorKeyword;
  spacing.postDecorator = select.postDecorator;
  value.selectExpressions = select.selectExpressions;

  if (fromClause) {
    spacing.preFromClause = fromClause[0];
    value.fromClause = fromClause[1];
  }

  if (whereClause) {
    spacing.preWhereClause = whereClause[0];
    value.whereClause = whereClause[1];
  }

  if (groupByClause) {
    spacing.preGroupByClause = groupByClause[0];
    value.groupByClause = groupByClause[1];
  }

  if (havingClause) {
    spacing.preHavingClause = havingClause[0];
    value.havingClause = havingClause[1];
  }

  return {
    value: value,
    keywords: keywords,
    spacing: spacing,
  };
}


ExplainClause = explain:ExplainToken postExplain:__ plan:PlanToken postPlan:__ forToken:ForToken
{
  return new sql.SqlExplainClause({
    keywords: {
      explain: explain,
      plan: plan,
      'for': forToken
    },
    spacing: {
      postExplain: postExplain,
      postPlan: postPlan
    }
  });
}


InsertClause =
  insert:InsertToken
  postInsert:__
  into:IntoToken
  postInto:__
  table:SqlRef
  columns:(_ SqlColumnList)?
{
  var value = {
    table: table.convertToTableRef(),
    keywords: {
      insert: insert,
      into: into
    },
    spacing: {
      postInsert: postInsert,
      postInto: postInto
    }
  };

  if (columns) {
    value.spacing.preColumns = columns[0];
    value.columns = columns[1];
  }

  return new sql.SqlInsertClause(value);
}


ReplaceClause =
  replace:ReplaceToken
  postReplace:__
  into:IntoToken
  postInto:__ table:SqlRef
  columns:(_ SqlColumnList)?
  preOverwrite:__
  overwrite:OverwriteToken
  postOverwrite:__
  allOrWhere:(AllToken / SqlWhereClause)
{
  var value = {
    table: table.convertToTableRef(),
    keywords: {
      replace: replace,
      into: into,
      overwrite: overwrite
    },
    spacing: {
      postReplace: postReplace,
      postInto: postInto,
      preOverwrite: preOverwrite,
      postOverwrite: postOverwrite
    }
  };

  if (columns) {
    value.spacing.preColumns = columns[0];
    value.columns = columns[1];
  }

  if (typeof allOrWhere === 'string') {
    value.keywords.all = allOrWhere;
  } else {
    value.whereClause = allOrWhere;
  }

  return new sql.SqlReplaceClause(value);
}


WithClause =
  withKeyword:WithToken
  postWith:_
  head:SqlWithPart
  tail:(CommaSeparator SqlWithPart)*
{
  return new sql.SqlWithClause({
    withParts: makeSeparatedArray(head, tail),
    keywords: {
      'with': withKeyword
    },
    spacing: {
      postWith: postWith
    }
  });
}


SqlWithPart =
  table:RefName
  postTable:_?
  columns:(SqlColumnList _)?
  asKeyword:AsToken
  postAs:_
  query:SqlQueryInParens
{
  var value = {
    table: table,
    query: query,
  };
  var spacing = value.spacing = {
    postTable: postTable,
    postAs: postAs,
  };
  var keywords = value.keywords = {
    as: asKeyword,
  };
  if (columns) {
    value.columns = columns[0];
    spacing.postColumns = columns[1];
  }
  return new sql.SqlWithPart(value);
}


SqlColumnList = OpenParen postLeftParen:_? head:RefName tail:(CommaSeparator RefName)* preRightParen:_? CloseParen
{
  return new sql.SqlColumnList({
    columns: makeSeparatedArray(head, tail)
  }).addParens(postLeftParen, preRightParen);
}


SelectClause =
  selectKeyword:SelectToken
  postSelect:_
  decorator:((AllToken / DistinctToken) _)?
  head:SqlStarOrAliasExpression
  tail:(CommaSeparator SqlStarOrAliasExpression)*
{
  var ret = {
    selectKeyword: selectKeyword,
    postSelect: postSelect,
    selectExpressions: makeSeparatedArray(head, tail),
  };
  if (decorator) {
    ret.decorator = decorator[0].toUpperCase();
    ret.decoratorKeyword = decorator[0];
    ret.postDecorator = decorator[1];
  }
  return ret;
}

SqlStarOrAliasExpression = SqlStar / SqlAlias

FromClause = from:FromToken postFrom:_ head:SqlAlias tail:(CommaSeparator SqlAlias)* join:(_ JoinClauses)?
{
  return new sql.SqlFromClause({
    expressions: makeSeparatedArray(head, tail).map(function(ex) { return ex.convertToTableRef() }),
    joinParts: join ? join[1] : undefined,
    spacing: {
      postFrom: postFrom,
      preJoin: join ? join[0] : undefined,
    },
    keywords: {
      from: from,
    },
  });
}

JoinClauses = head:SqlJoinPart tail:(_ SqlJoinPart)*
{
  return makeSeparatedArray(head, tail);
}

SqlJoinPart =
  joinType:(JoinType _)?
  join:JoinToken
  postJoin:_
  table:SqlAlias
  on:(_ OnToken _ Expression)?
{
  var value = {
    table: table.convertToTableRef(),
  };
  var spacing = value.spacing = {
    postJoin: postJoin,
  };
  var keywords = value.keywords = {
    join: join,
  };

  if (joinType) {
    var joinTypeUpper = joinType[0].toUpperCase();
    var m = joinTypeUpper.match(/^LEFT|RIGHT|FULL/);
    if (m) joinTypeUpper = m[0];
    value.joinType = joinTypeUpper;
    keywords.joinType = joinType[0];
    spacing.postJoinType = joinType[1];
  }

  if (on) {
    spacing.preOn = on[0];
    keywords.on = on[1];
    spacing.postOn = on[2];
    value.onExpression = on[3];
  }
  return new sql.SqlJoinPart(value);
}

JoinType =
  $(("LEFT"i / "RIGHT"i / "FULL"i) (__ OuterToken)?)
/ "INNER"i
/ "CROSS"i

SqlWhereClause = where:WhereToken postWhere:_ expression:Expression
{
  return new sql.SqlWhereClause({
    expression: expression,
    spacing: {
      postWhere: postWhere,
    },
    keywords: {
      where: where,
    },
  });
}

GroupByClause = group:GroupToken postGroup:__ by:ByToken postBy:_ expressions:(ExpressionList / "()")
{
  return new sql.SqlGroupByClause({
    expressions: expressions === '()' ? null : expressions,
    spacing: {
      postGroup: postGroup,
      postBy: postBy,
    },
    keywords: {
      group: group,
      by: by,
    },
  });
}

ExpressionList = head:Expression tail:(CommaSeparator Expression)*
{
  return makeSeparatedArray(head, tail);
}

HavingClause = having:HavingToken postHaving:_ expression:Expression
{
  return new sql.SqlHavingClause({
    expression: expression,
    spacing: {
      postHaving: postHaving,
    },
    keywords: {
      having: having,
    },
  });
}

OrderByClause = order:OrderToken postOrder:__ by:ByToken postBy:_ head:SqlOrderByExpression tail:(CommaSeparator SqlOrderByExpression)*
{
  return new sql.SqlOrderByClause({
    expressions: makeSeparatedArray(head, tail),
    spacing: {
      postOrder: postOrder,
      postBy: postBy,
    },
    keywords: {
      order: order,
      by: by,
    },
  });
}

SqlOrderByExpression = expression:Expression direction:(_ (AscToken / DescToken))?
{
  var value = {
    expression: expression,
  };
  var spacing = value.spacing = {};
  var keywords = value.keywords = {};

  if (direction) {
    spacing.preDirection = direction[0];
    value.direction = direction[1].toUpperCase();
    keywords.direction = direction[1];
  }

  return new sql.SqlOrderByExpression(value);
}

LimitClause = limit:LimitToken postLimit:_ limitLiteral:SqlLiteral
{
  return new sql.SqlLimitClause({
    limit: limitLiteral,
    spacing: {
      postLimit: postLimit,
    },
    keywords: {
      limit: limit,
    },
  });
}

OffsetClause = offset:OffsetToken postOffset:_ offsetLiteral:SqlLiteral
{
  return new sql.SqlOffsetClause({
    offset: offsetLiteral,
    spacing: {
      postOffset: postOffset,
    },
    keywords: {
      offset: offset,
    },
  });
}

PartitionedByClause = partitioned:PartitionedToken postPartitioned:__ by:ByToken postBy:_ ex:(TimeUnitLiteral / Expression / (AllToken (__ TimeToken)?))
{
  var value = {};
  var spacing = value.spacing = {
    postPartitioned: postPartitioned,
    postBy: postBy,
  };
  var keywords = value.keywords = {
    partitioned: partitioned,
    by: by,
  };

  if (Array.isArray(ex)) {
    keywords.all = ex[0];

    var timeKeyword = ex[1];
    if (timeKeyword) {
      spacing.preTime = timeKeyword[0];
      keywords.time = timeKeyword[1];
    }
  } else {
    value.expression = ex;
  }

  return new sql.SqlPartitionedByClause(value);
}

ClusteredByClause = clustered:ClusteredToken postClustered:__ by:ByToken postBy:_ head:Expression tail:(CommaSeparator Expression)*
{
  return new sql.SqlClusteredByClause({
    expressions: makeSeparatedArray(head, tail),
    spacing: {
      postClustered: postClustered,
      postBy: postBy,
    },
    keywords: {
      clustered: clustered,
      by: by,
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
  return maybeMakeMulti('OR', head, tail);
}

AndExpression = head:NotExpression tail:(_ AndToken _ NotExpression)*
{
  return maybeMakeMulti('AND', head, tail);
}

NotExpression = op:NotToken postOp:_ argument:NotExpression
{
  return new sql.SqlUnary({
    op: op.toUpperCase(),
    argument: argument,
    spacing: {
      postOp: postOp
    },
    keywords: {
      op: op,
    },
  });
}
  / ComparisonExpression

ComparisonExpression = lhs:AdditionExpression rhs:(_ ComparisonOpRhs)?
{
  if (!rhs) return lhs;
  var preOp = rhs[0];
  var opRhs = rhs[1];
  return new sql.SqlComparison({
    lhs: lhs,
    op: opRhs.op,
    decorator: opRhs.decorator,
    rhs: opRhs.rhs,
    negated: Boolean(opRhs.notKeyword),
    spacing: {
      preOp: opRhs.preOp ? opRhs.preOp : preOp,
      postOp: opRhs.postOp,
      not: opRhs.preOp ? preOp : opRhs.notSpacing,
      postDecorator: opRhs.postDecorator
    },
    keywords: {
      op: opRhs.opKeyword,
      not: opRhs.notKeyword,
      decorator: opRhs.decoratorKeyword,
    },
  });
}

ComparisonOpRhs = ComparisonOpRhsSimple / ComparisonOpRhsIs / ComparisonOpRhsIn / ComparisonOpRhsBetween / ComparisonOpRhsLike / ComparisonOpRhsNot

ComparisonOpRhsSimple = op:ComparisonOperator postOp:_ rhs:(AdditionExpression / (ComparisonDecorator _ SqlQueryInParens))
{
  const ret = {
    op: op === '!=' ? '<>' : op,
    opKeyword: op,
    postOp: postOp,
  };
  if (Array.isArray(rhs)) {
    var decorator = rhs[0];
    var decoratorUpper = decorator.toUpperCase();
    ret.decorator = decoratorUpper === 'SOME' ? 'ANY' : decoratorUpper;
    ret.decoratorKeyword = decorator;
    ret.postDecorator = rhs[1];
    ret.rhs = rhs[2];
  } else {
    ret.rhs = rhs;
  }
  return ret;
}

ComparisonOperator =
  '='
/ '<>'
/ '!='
/ '>='
/ '<='
/ '<'
/ '>'

ComparisonDecorator = AnyToken / AllToken / SomeToken

ComparisonOpRhsIs = op:IsToken postOp:_ not:(NotToken _)? rhs:SqlLiteral
{
  return {
    op: op.toUpperCase(),
    opKeyword: op,
    postOp: postOp,
    rhs: rhs,
    notKeyword: not ? not[0] : undefined,
    notSpacing: not ? not[1] : undefined
  };
}

ComparisonOpRhsIn = op:InToken postOp:_ rhs:(SqlRecordMaybe / SqlQueryInParens)
{
  return {
    op: op.toUpperCase(),
    opKeyword: op,
    postOp: postOp,
    rhs: rhs
  };
}

ComparisonOpRhsBetween = op:BetweenToken postOp:_ symmetricKeyword:(SymmetricToken _)? start:AdditionExpression preAnd:_ andKeyword:AndToken postAnd:_ end:AdditionExpression
{
  var value = {
    start: start,
    end: end,
    spacing: {
      preAnd: preAnd,
      postAnd: postAnd,
    },
    keywords: {
      and: andKeyword,
    }
  }

  if (symmetricKeyword) {
    value.symmetric = true;
    value.keywords.symmetric = symmetricKeyword[0];
    value.spacing.postSymmetric = symmetricKeyword[1];
  }

  return {
    op: op.toUpperCase(),
    opKeyword: op,
    postOp: postOp,
    rhs: new sql.SqlBetweenPart(value)
  };
}

ComparisonOpRhsLike = op:(LikeToken / SimilarToToken) postOp:_ like:AdditionExpression escape:(_ EscapeToken _ AdditionExpression)?
{
  return {
    op: op.toUpperCase(),
    opKeyword: op,
    postOp: postOp,
    rhs: escape ? new sql.SqlLikePart({
      like: like,
      escape: escape[3],
      spacing: {
        preEscape: escape[0],
        postEscape: escape[2],
      },
      keywords: {
        escape: escape[1],
      },
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
UnaryExpression = op:[+-] postOp:_ !Number argument:ConcatExpression
{
  return new sql.SqlUnary({
    op: op,
    argument: argument,
    spacing: {
      postOp: postOp
    },
    keywords: {
      op: op,
    },
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
/ SqlValues
/ SqlLiteral
/ SqlRef
/ SqlRecordMaybe
/ SqlQueryInParens

//--------------------------------------------------------------------------------------------------------------------------------------------------------

CaseExpression =
  caseToken:CaseToken
  postCase:_
  caseExpression:(Expression _)?
  head:SqlWhenThenPart
  tail:(_ SqlWhenThenPart)*
  elseValue:(_ ElseToken _ Expression)?
  preEnd:_
  end:EndToken
{
  return new sql.SqlCase({
    caseExpression: caseExpression ? caseExpression[0] : undefined,
    whenThenParts: makeSeparatedArray(head, tail),
    elseExpression: elseValue ? elseValue[3] : undefined,
    spacing: {
      postCase: postCase,
      postCaseExpression: caseExpression ? caseExpression[1] : undefined,
      preElse: elseValue ? elseValue[0] : undefined,
      postElse: elseValue ? elseValue[2] : undefined,
      preEnd: preEnd,
    },
    keywords: {
      'case': caseToken,
      'else': elseValue ? elseValue[1] : undefined,
      end: end,
    },
  });
}

SqlWhenThenPart =
  when:WhenToken
  postWhen:_
  whenHead:Expression
  whenTail:(CommaSeparator Expression)*
  postWhenExpressions:_
  then:ThenToken
  postThen:_
  thenExpression:Expression
{
  return new sql.SqlWhenThenPart({
    whenExpressions: makeSeparatedArray(whenHead, whenTail),
    thenExpression: thenExpression,
    spacing: {
      postWhen: postWhen,
      postWhenExpressions: postWhenExpressions,
      postThen: postThen,
    },
    keywords: {
      when: when,
      then: then,
    },
  });
}


// ------------------------------

Interval =
  interval:IntervalToken
  postInterval:_
  intervalValue:BaseType
  postIntervalValue:_
  unit:($(TimeUnit _ ToToken _ TimeUnit) / $(TimeUnit '_' TimeUnit) / TimeUnit)
{
  return new sql.SqlInterval({
    intervalValue: intervalValue,
    unit: unit,
    spacing: {
      postInterval: postInterval,
      postIntervalValue: postIntervalValue
    },
    keywords: {
      interval: interval,
    }
  });
}

TimeUnitLiteral = unit:TimeUnit
{
  return sql.SqlLiteral.direct(unit);
}

TimeUnit =
  "SECOND"i
/ "MINUTE"i
/ "HOUR"i
/ "DAY"i
/ "WEEK"i
/ "MONTH"i
/ "QUARTER"i
/ "YEAR"i

TimeUnitExtra =
  TimeUnit
/ "EPOCH"i
/ "MICROSECOND"i
/ "MILLISECOND"i
/ "DOW"i
/ "ISODOW"i
/ "DOY"i
/ "ISOYEAR"i
/ "DECADE"i
/ "CENTURY"i
/ "MILLENNIUM"i

Function =
  GenericFunction
/ CountFunction
/ CastFunction
/ ExtractFunction
/ TrimFunction
/ FloorCeilFunction
/ TimestampAddDiffFunction
/ PositionFunction
/ ArrayFunction
/ NakedFunction

GenericFunction =
  functionName:UnquotedRefNameFree &{ return sql.SqlFunction.isValidFunctionName(functionName) }
  preLeftParen:_
  OpenParen
  postLeftParen:_
  decorator:(FunctionDecorator _)?
  head:SqlAliasExplicitAs?
  tail:(CommaSeparator SqlAliasExplicitAs)*
  postArguments:_
  CloseParen
  filter:(_ FunctionFilter)?
{
  var value = {
    functionName: functionName.toUpperCase(),
  };
  var spacing = value.spacing = {
    preLeftParen: preLeftParen,
    postLeftParen: postLeftParen,
  };
  var keywords = value.keywords = {
    functionName: functionName,
  };

  if (decorator) {
    value.decorator = decorator[0].toUpperCase();
    keywords.decorator = decorator[0];
    spacing.postDecorator = decorator[1];
  }

  if (head) {
    value.args = makeSeparatedArray(head, tail);
    spacing.postArguments = postArguments;
  }

  if (filter) {
    spacing.preFilter = filter[0];
    keywords.filter = filter[1].filterKeyword;
    spacing.postFilter = filter[1].postFilter;
    value.whereClause = filter[1].whereClause;
  }

  return new sql.SqlFunction(value);
}

NakedFunction = functionName:UnquotedRefNameFree &{ return sql.SqlFunction.isNakedFunction(functionName) }
{
  return new sql.SqlFunction({
    functionName: functionName.toUpperCase(),
    specialParen: 'none',
    keywords: {
      functionName: functionName,
    }
  });
}

CountFunction =
  functionName:CountToken
  preLeftParen:_
  OpenParen
  postLeftParen:_
  decorator:(FunctionDecorator _)?
  arg:(Expression / "*")
  postArguments:_
  CloseParen
  filter:(_ FunctionFilter)?
{
  var value = {
    functionName: functionName.toUpperCase(),
  };
  var spacing = value.spacing = {
    preLeftParen: preLeftParen,
    postLeftParen: postLeftParen,
  };
  var keywords = value.keywords = {
    functionName: functionName,
  };

  if (decorator) {
    value.decorator = decorator[0].toUpperCase();
    keywords.decorator = decorator[0];
    spacing.postDecorator = decorator[1];
  }

  value.args = sql.SeparatedArray.fromSingleValue(arg === '*' ? sql.SqlStar.PLAIN : arg);
  spacing.postArguments = postArguments;

  if (filter) {
    spacing.preFilter = filter[0];
    keywords.filter = filter[1].filterKeyword;
    spacing.postFilter = filter[1].postFilter;
    value.whereClause = filter[1].whereClause;
  }

  return new sql.SqlFunction(value);
}

CastFunction =
  functionName:CastToken
  preLeftParen:_
  OpenParen
  postLeftParen:_
  expr:Expression
  separator:AsSeparator
  type:UnquotedRefNameFree
  postArguments:_
  CloseParen
{
  var typeLiteral = new sql.SqlLiteral({
    value: type,
    stringValue: type,
  });
  return new sql.SqlFunction({
    functionName: functionName.toUpperCase(),
    args: new sql.SeparatedArray([expr, typeLiteral], [separator]),
    spacing: {
      preLeftParen: preLeftParen,
      postLeftParen: postLeftParen,
      postArguments: postArguments,
    },
    keywords: {
      functionName: functionName,
    }
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
    functionName: functionName.toUpperCase(),
    args: new sql.SeparatedArray([unitLiteral, expr], [separator]),
    spacing: {
      preLeftParen: preLeftParen,
      postLeftParen: postLeftParen,
      postArguments: postArguments,
    },
    keywords: {
      functionName: functionName,
    }
  });
}

TrimFunction =
  functionName:TrimToken
  preLeftParen:_
  OpenParen
  postLeftParen:_
  decorator:($((LeadingToken / BothToken / TrailingToken) (_ FromToken)?) _)?
  expr:Expression
  from:(FromSeparator Expression)?
  postArguments:_
  CloseParen
{
  var value = {
    functionName: functionName.toUpperCase(),
    args: from
      ? new sql.SeparatedArray([expr, from[1]], [from[0]])
      : sql.SeparatedArray.fromSingleValue(expr),
  };
  var spacing = value.spacing = {
    preLeftParen: preLeftParen,
    postLeftParen: postLeftParen,
    postArguments: postArguments,
  };
  var keywords = value.keywords = {
    functionName: functionName,
  };

  if (decorator) {
    value.decorator = decorator[0].toUpperCase();
    keywords.decorator = decorator[0];
    spacing.postDecorator = decorator[1];
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
  unit:TimeUnitLiteral
  postArguments:_
  CloseParen
{
  return new sql.SqlFunction({
    functionName: functionName.toUpperCase(),
    args: new sql.SeparatedArray([expr, unit], [separator]),
    spacing: {
      preLeftParen: preLeftParen,
      postLeftParen: postLeftParen,
      postArguments: postArguments,
    },
    keywords: {
      functionName: functionName,
    }
  });
}

TimestampAddDiffFunction =
  functionName:(TimestampaddToken / TimestampdiffToken)
  preLeftParen:_
  OpenParen
  postLeftParen:_
  unit:TimeUnitLiteral
  tail:(CommaSeparator Expression)*
  postArguments:_
  CloseParen
{
  var value = {
    functionName: functionName.toUpperCase(),
    keywords: {
      functionName: functionName,
    }
  };
  var spacing = value.spacing = {
    preLeftParen: preLeftParen,
    postLeftParen: postLeftParen,
  };

  value.args = makeSeparatedArray(unit, tail);
  spacing.postArguments = postArguments;

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
    functionName: functionName.toUpperCase(),
    args: args,
    spacing: {
      preLeftParen: preLeftParen,
      postLeftParen: postLeftParen,
      postArguments: postArguments,
    },
    keywords: {
      functionName: functionName,
    }
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
    functionName: functionName.toUpperCase(),
    specialParen: 'square',
    keywords: {
      functionName: functionName,
    }
  };
  var spacing = value.spacing = {
    preLeftParen: preLeftParen,
    postLeftParen: postLeftParen,
  };

  if (head) {
    value.args = makeSeparatedArray(head, tail);
    spacing.postArguments = postArguments;
  }

  return new sql.SqlFunction(value);
}

FunctionDecorator = DistinctToken / AllToken;

FunctionFilter = filterKeyword:FilterToken postFilter:_ OpenParen postLeftParen:_ whereClause:SqlWhereClause preRightParen:_ CloseParen
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

SqlRecordMaybe = record:SqlRecord
{
  return record.unwrapIfSingleton();
}

SqlRecord = row:(RowToken _)? OpenParen postLeftParen:_ head:Expression tail:(CommaSeparator Expression)* postExpressions:_ CloseParen
{
  var value = {
    expressions: makeSeparatedArray(head, tail),
    spacing: {
      postLeftParen: postLeftParen,
      postExpressions: postExpressions
    }
  }

  if (row) {
    value.keywords = { row: row[0] };
    value.spacing.postRow = row[1];
  }

  return new sql.SqlRecord(value);
}

SqlQueryInParens = OpenParen leftSpacing:_ ex:SqlQuery rightSpacing:_ CloseParen
{
  return ex.addParens(leftSpacing, rightSpacing);
}

SqlValues =
  values:ValuesToken
  postValues:_
  head:SqlRecord
  tail:(CommaSeparator SqlRecord)*
  orderByClause:(_ OrderByClause)?
  limitClause:(_ LimitClause)?
  offsetClause:(_ OffsetClause)?
{
  var value = {
    records: makeSeparatedArray(head, tail),
    keywords: {
      values: values
    }
  };
  var spacing = value.spacing = {
    postValues: postValues
  };

  if (orderByClause) {
    spacing.preOrderByClause = orderByClause[0];
    value.orderByClause = orderByClause[1];
  }

  if (limitClause) {
    spacing.preLimitClause = limitClause[0];
    value.limitClause = limitClause[1];
  }

  if (offsetClause) {
    spacing.preOffsetClause = offsetClause[0];
    value.offsetClause = offsetClause[1];
  }

  return new sql.SqlValues(value);
}

SqlPlaceholder = "?"
{
  return new sql.SqlPlaceholder();
}

SqlLiteral = lit:(NullToken / TrueToken / FalseToken / Number / SingleQuotedString / UnicodeString / CharsetString / BinaryString / Timestamp)
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
  var str = text();
  return {
    value: str.length > 15 && str.indexOf('.') === -1 ? BigInt(str) : +str,
    stringValue: str
  };
}

Fraction = $('.' Digits)

Digits = $ Digit+

Digit = [0-9]

/* Strings */

SingleQuotedString = "'" v:$(("''" / [^'])*) "'"
{
  return {
    value: v.replace(/''/g, "'"),
    stringValue: text()
  };
}

UnicodeString = "U&"i v:SingleQuotedString
{
  return {
    value: v.value.replace(/\\(\\|(?:[0-9a-f]{4}))/gi, function(_, s) { return s === '\\' ? '\\' : String.fromCharCode(parseInt(s, 16)); }),
    stringValue: text()
  };
}

CharsetString = "_" [a-z0-9]i [a-z0-9_-]i* v:SingleQuotedString
{
  return {
    value: v.value, // ToDo: fix this
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

Timestamp = timestamp:(TimestampToken / DateToken) postTimestamp:_ v:SingleQuotedString
{
  return {
    spacing: {
      postTimestamp: postTimestamp,
    },
    keywords: {
      timestamp: timestamp,
    },
    value: new Date(v.value.replace(' ', 'T') + 'Z'),
    stringValue: v.stringValue
  };
}

/* Array */

ArrayEntries = head:ArrayEntry tail:(CommaSeparator ArrayEntry)*
{
  return makeListMap(tail, 1, head);
}

ArrayEntry = Number / SingleQuotedString / UnicodeString / BinaryString

// ------------------------------

SqlRef = a:RefName b:(_ "." _ RefName)? c:(_ "." _ RefName)?
{
  if (c) {
    return new sql.SqlRef({
      columnRefName: c[3],
      tableRefName: b[3],
      namespaceRefName: a,
      spacing: {
        preTableDot: c[0],
        postTableDot: c[2],
        preNamespaceDot: b[0],
        postNamespaceDot: b[2],
      }
    });

  } else if (b) {
    return new sql.SqlRef({
      columnRefName: b[3],
      tableRefName: a,
      spacing: {
        preTableDot: b[0],
        postTableDot: b[2],
      }
    });

  } else {
    return new sql.SqlRef({
      columnRefName: a,
    });
  }
}

RefName = QuotedRefName / UnicodeRefName / UnquotedRefName

RefNameAlias = QuotedRefName / UnquotedRefNameAlias

QuotedRefName = '"' name:$(('""' / [^"])+) '"'
{
  return new sql.RefName({
    name: name.replace(/""/g, '"'),
    quotes: true
  });
}

UnicodeRefName = "U&"i v:QuotedRefName
{
  return new sql.RefName({
    name: v.name.replace(/\\(\\|(?:[0-9a-f]{4}))/gi, function(_, s) { return s === '\\' ? '\\' : String.fromCharCode(parseInt(s, 16)); }),
    quotes: true
  });
}

UnquotedRefName = name:UnquotedRefNameFree &{ return !sql.RefName.isReservedKeyword(name) }
{
  return new sql.RefName({
    name: text(),
    quotes: false
  });
}

UnquotedRefNameAlias = name:UnquotedRefNameFree &{ return !sql.RefName.isReservedKeyword(name) && !sql.RefName.isReservedAlias(name) }
{
  return new sql.RefName({
    name: text(),
    quotes: false
  });
}

UnquotedRefNameFree = $([a-z_]i [a-z0-9_]i*)

SqlStar = namespace:(RefName _ "." _)? table:(RefName _ "." _)? "*"
{
  var value = {};
  var spacing = value.spacing = {};

  if (namespace) {
    value.namespaceRefName = namespace[0];
    spacing.preNamespaceDot = namespace[1];
    spacing.postNamespaceDot = namespace[3];
  }

  if (table) {
    value.tableRefName = table[0];
    spacing.preTableDot = table[1];
    spacing.postTableDot = table[3];
  }

  return new sql.SqlStar(value);
}

// -----------------------------------

IdentifierPart = [a-z_]i

_ "optional whitespace" = $(Space* ((SingleLineComment / MultiLineComment) Space*)* FinalSingleLineComment?)

__ "mandatory whitespace" = $(Space _)

___ "pure whitespace" = $(Space*)

SingleLineComment = $("--" [^\n]* [\n])

FinalSingleLineComment = $("--" [^\n]*)

MultiLineComment = $("/*" (!"*/" .)* "*/")

Space = [ \t\n\r]

OpenParen "(" = "("

CloseParen ")" = ")"

/* Tokens */

AllToken = $("ALL"i !IdentifierPart)
AndToken = $("AND"i !IdentifierPart)
AnyToken = $("ANY"i !IdentifierPart)
ArrayToken = $("ARRAY"i !IdentifierPart)
AsToken = $("AS"i !IdentifierPart)
AscToken = $("ASC"i !IdentifierPart)
BetweenToken = $("BETWEEN"i !IdentifierPart)
BothToken = $("BOTH"i !IdentifierPart)
ByToken = $("BY"i !IdentifierPart)
CaseToken = $("CASE"i !IdentifierPart)
CastToken = $("CAST"i !IdentifierPart)
CeilToken = $("CEIL"i !IdentifierPart)
ClusteredToken = $("CLUSTERED"i !IdentifierPart)
CountToken = $("COUNT"i !IdentifierPart)
DateToken = $("DATE"i !IdentifierPart)
DescToken = $("DESC"i !IdentifierPart)
DistinctToken = $("DISTINCT"i !IdentifierPart)
ElseToken = $("ELSE"i !IdentifierPart)
EndToken = $("END"i !IdentifierPart)
EscapeToken = $("ESCAPE"i !IdentifierPart)
ExplainToken = $("EXPLAIN"i !IdentifierPart)
ExtractToken = $("EXTRACT"i !IdentifierPart)
FalseToken = $("FALSE"i !IdentifierPart) { return { value: false, stringValue: text() }; }
FilterToken= $("FILTER"i !IdentifierPart)
FloorToken = $("FLOOR"i !IdentifierPart)
ForToken = $("FOR"i !IdentifierPart)
FromToken = $("FROM"i !IdentifierPart)
GroupToken = $("GROUP"i !IdentifierPart)
HavingToken = $("HAVING"i !IdentifierPart)
InToken = $("IN"i !IdentifierPart)
InsertToken = $("INSERT"i !IdentifierPart)
IntervalToken = $("INTERVAL"i !IdentifierPart)
IntoToken = $("INTO"i !IdentifierPart)
IsToken = $("IS"i !IdentifierPart)
JoinToken = $("JOIN"i !IdentifierPart)
LeadingToken = $("LEADING"i !IdentifierPart)
LikeToken = $("LIKE"i !IdentifierPart)
LimitToken = $("LIMIT"i !IdentifierPart)
NotToken = $("NOT"i !IdentifierPart)
NullToken = $("NULL"i !IdentifierPart) { return { value: null, stringValue: text() }; }
OffsetToken = $("OFFSET"i !IdentifierPart)
OnToken = $("ON"i !IdentifierPart)
OrToken = $("OR"i !IdentifierPart)
OrderToken = $("ORDER"i !IdentifierPart)
OuterToken = $("OUTER"i !IdentifierPart)
OverwriteToken = $("OVERWRITE"i !IdentifierPart)
PartitionedToken = $("PARTITIONED"i !IdentifierPart)
PlanToken = $("PLAN"i !IdentifierPart)
PositionToken = $("POSITION"i !IdentifierPart)
ReplaceToken = $("REPLACE"i !IdentifierPart)
RowToken = $("ROW"i !IdentifierPart)
SelectToken = $("SELECT"i !IdentifierPart)
SimilarToToken = $("SIMILAR"i !IdentifierPart __ ToToken)
SomeToken = $("SOME"i !IdentifierPart)
SymmetricToken = $("SYMMETRIC"i !IdentifierPart)
ThenToken = $("THEN"i !IdentifierPart)
TimeToken = $("TIME"i !IdentifierPart)
TimestampToken = $("TIMESTAMP"i !IdentifierPart)
TimestampaddToken = $("TIMESTAMPADD"i !IdentifierPart)
TimestampdiffToken = $("TIMESTAMPDIFF"i !IdentifierPart)
ToToken = $("TO"i !IdentifierPart)
TrailingToken = $("TRAILING"i !IdentifierPart)
TrimToken = $("TRIM"i !IdentifierPart)
TrueToken = $("TRUE"i !IdentifierPart) { return { value: true, stringValue: text() }; }
UnionToken = $("UNION"i !IdentifierPart __ AllToken)
ValuesToken = $("VALUES"i !IdentifierPart)
WhenToken = $("WHEN"i !IdentifierPart)
WhereToken = $("WHERE"i !IdentifierPart)
WithToken = $("WITH"i !IdentifierPart)
