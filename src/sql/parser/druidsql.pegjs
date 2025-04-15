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

Start = initial:_? thing:(SqlQueryWithPossibleContext / SqlAlias) final:_sc?
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

  return new S.SqlAlias(value);
}

GeneralFunctionArgument = SqlLabeledExpression / SqlAlias

SqlLabeledExpression = label:RefNameAlias preArrow:_ "=>" postArrow:_ expression:Expression
{
  return new S.SqlLabeledExpression({
    label: label,
    spacing: {
      preArrow: preArrow,
      postArrow: postArrow
    },
    expression: expression
  });
}

SqlExtendClause =
  extend:(ExtendToken _)?
  OpenParen
  postLeftParen:_
  head:SqlColumnDeclaration
  tail:(CommaSeparator SqlColumnDeclaration)*
  postColumnDeclarations:_
  CloseParen
{
  return new S.SqlExtendClause({
    keywords: {
      extend: extend ? extend[0] : ''
    },
    columnDeclarations: makeSeparatedArray(head, tail),
    spacing: {
      postExtend: extend ? extend[1] : undefined,
      postLeftParen: postLeftParen,
      postColumnDeclarations: postColumnDeclarations
    }
  });
}

SqlColumnDeclaration = column:RefName postColumn:_ columnType:SqlType
{
  return new S.SqlColumnDeclaration({
    column: column,
    spacing: {
      postColumn: postColumn
    },
    columnType: columnType
  })
}

// ------------------------------

SqlQueryWithPossibleContext = statements:(SqlSetStatement _sc)* query:SqlQuery
{
  if (!statements.length) return query;
  return query
    .changeContextStatements(new S.SeparatedArray(
      statements.map(function(x) { return x[0] }),
      statements.map(function(x) { return x[1] }).slice(0, statements.length - 1)
    ))
    .changeSpace('postSets', statements[statements.length - 1][1]);
}

SqlSetStatement = setKeyword:SetToken postSet:_ key:RefName postKey:_ "=" postEquals:_ value:SqlLiteral postValue:_ ";"
{
  return new S.SqlSetStatement({
    key: key,
    value: value,
    keywords: {
      set: setKeyword
    },
    spacing: {
      postSet: postSet,
      postKey: postKey,
      postValue: postValue
    }
  });
}

SqlQuery =
  explain:(ExplainPlanForToken _)?
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

  if (explain) {
    value.explain = true;
    keywords.explainPlanFor = explain[0];
    spacing.postExplainPlanFor = explain[1];
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

  if (partitionedByClause) {
    spacing.prePartitionedByClause = partitionedByClause[0];
    value.partitionedByClause = partitionedByClause[1];
  }

  if (clusteredByClause) {
    spacing.preClusteredByClause = clusteredByClause[0];
    value.clusteredByClause = clusteredByClause[1];
  }

  if (union) {
    spacing.preUnion = union[0];
    keywords.union = union[1].unionKeyword;
    spacing.postUnion = union[1].postUnion;
    value.unionQuery = union[1].unionQuery;
  }

  return withQueryMode ? new S.SqlWithQuery(value) : new S.SqlQuery(value);
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


InsertClause =
  insert:InsertToken
  postInsert:__
  into:IntoToken
  postInto:__
  table:(GenericFunction / SqlTable)
  columns:(_ SqlColumnList)?
  format:(_ AsToken _ CsvToken)?
{
  var value = {
    table: table,
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

  if (format) {
    value.spacing.preAs = format[0];
    value.keywords = format[1];
    value.spacing.preFormat = format[2];
    value.format = format[3];
  }

  return new S.SqlInsertClause(value);
}


ReplaceClause =
  replace:ReplaceToken
  postReplace:__
  into:IntoToken
  postInto:__
  table:SqlTable
  columns:(_ SqlColumnList)?
  preOverwrite:__
  overwrite:OverwriteToken
  postOverwrite:__
  allOrWhere:(AllToken / SqlWhereClause)
{
  var value = {
    table: table,
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

  return new S.SqlReplaceClause(value);
}


WithClause =
  withKeyword:WithToken
  postWith:_
  head:SqlWithPart
  tail:(CommaSeparator SqlWithPart)*
{
  return new S.SqlWithClause({
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
  return new S.SqlWithPart(value);
}


SqlColumnList = OpenParen postLeftParen:_? head:RefName tail:(CommaSeparator RefName)* preRightParen:_? CloseParen
{
  return new S.SqlColumnList({
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
  return new S.SqlFromClause({
    expressions: makeSeparatedArray(head, tail).map(function(ex) { return ex.convertToTable() }),
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
  natural:(NaturalToken _)?
  joinType:(JoinType _)?
  join:JoinToken
  postJoin:_
  table:SqlAlias
  joinCondition:((_ OnToken _ Expression) / (_ UsingToken _ SqlColumnList))?
{
  var value = {
    table: table.convertToTable(),
  };
  var spacing = value.spacing = {
    postJoin: postJoin,
  };
  var keywords = value.keywords = {
    join: join,
  };

  if (natural) {
    value.natural = true;
    keywords.natural = natural[0];
    spacing.postNatural = natural[1];
  }

  if (joinType) {
    var joinTypeUpper = joinType[0].toUpperCase();
    var m = joinTypeUpper.match(/^LEFT|RIGHT|FULL/);
    if (m) joinTypeUpper = m[0];
    value.joinType = joinTypeUpper;
    keywords.joinType = joinType[0];
    spacing.postJoinType = joinType[1];
  }

  if (joinCondition) {
    if(joinCondition[1].toUpperCase() === 'USING'){
      spacing.preUsing = joinCondition[0];
      keywords.using = joinCondition[1];
      spacing.postUsing = joinCondition[2];
      value.usingColumns = joinCondition[3];
    } else {
      spacing.preOn = joinCondition[0];
      keywords.on = joinCondition[1];
      spacing.postOn = joinCondition[2];
      value.onExpression = joinCondition[3];
    }
  }

  return new S.SqlJoinPart(value);
}

JoinType =
  $(("LEFT"i / "RIGHT"i / "FULL"i) (__ OuterToken)?)
/ "INNER"i
/ "CROSS"i

SqlWhereClause = where:WhereToken postWhere:_ expression:Expression
{
  return new S.SqlWhereClause({
    expression: expression,
    spacing: {
      postWhere: postWhere,
    },
    keywords: {
      where: where,
    },
  });
}

GroupByClause =
  groupBy:GroupByToken
  postGroupBy:_
  decorator:((RollupToken / CubeToken / GroupingSetsToken) _)?
  ex:((OpenParen _ (GroupByExpressionList _)? CloseParen) / GroupByExpressionList)
{
  var value = {
    spacing: {
      postGroupBy: postGroupBy
    },
    keywords: {
      groupBy: groupBy
    }
  };

  if (decorator) {
    var d = decorator[0].toUpperCase();
    value.decorator = d.startsWith('GROUPING') ? 'GROUPING SETS' : d;
    value.spacing.postDecorator = decorator[1];
    value.keywords.decorator = decorator[0];
  }

  if (Array.isArray(ex)) {
    var postLeftParen = ex[1];
    if (ex[2]) {
      value.innerParens = true;
      value.expressions = ex[2][0];
      value.spacing.postLeftParen = postLeftParen;
      value.spacing.postExpressions = ex[2][1];
    } else {
      // Here we have `GROUP BY ()` so `innerParens` will be implicitly true
      value.spacing.postLeftParen = postLeftParen;
    }
  } else {
    value.expressions = ex;
  }

  return new S.SqlGroupByClause(value);
}

GroupByExpressionList = head:GroupByExpression tail:(CommaSeparator GroupByExpression)*
{
  return makeSeparatedArray(head, tail);
}

GroupByExpression = SqlEmptyRecord / Expression

SqlEmptyRecord = OpenParen postLeftParen:_ CloseParen
{
  return new S.SqlRecord({
    keywords: { row: '' },
    spacing: {
      postLeftParen: postLeftParen,
    }
  });
}

HavingClause = having:HavingToken postHaving:_ expression:Expression
{
  return new S.SqlHavingClause({
    expression: expression,
    spacing: {
      postHaving: postHaving
    },
    keywords: {
      having: having
    }
  });
}

OrderByClause = orderBy:OrderByToken postOrderBy:_ head:SqlOrderByExpression tail:(CommaSeparator SqlOrderByExpression)*
{
  return new S.SqlOrderByClause({
    expressions: makeSeparatedArray(head, tail),
    spacing: {
      postOrderBy: postOrderBy
    },
    keywords: {
      orderBy: orderBy
    }
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

  return new S.SqlOrderByExpression(value);
}

LimitClause = limit:LimitToken postLimit:_ limitLiteral:SqlLiteral
{
  return new S.SqlLimitClause({
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
  return new S.SqlOffsetClause({
    offset: offsetLiteral,
    spacing: {
      postOffset: postOffset,
    },
    keywords: {
      offset: offset,
    },
  });
}

PartitionedByClause = partitionedBy:PartitionedByToken postPartitionedBy:_ ex:(TimeUnitLiteral / Expression / (AllToken (__ TimeToken)?))
{
  var value = {};
  var spacing = value.spacing = {
    postPartitionedBy: postPartitionedBy
  };
  var keywords = value.keywords = {
    partitionedBy: partitionedBy
  };

  if (Array.isArray(ex)) {
    var ex1 = ex[1];
    keywords.all = ex[0] + (ex1 ? ex1.join('') : '');
  } else {
    value.expression = ex;
  }

  return new S.SqlPartitionedByClause(value);
}

ClusteredByClause = clusteredBy:ClusteredByToken postClusteredBy:_ head:Expression tail:(CommaSeparator Expression)*
{
  return new S.SqlClusteredByClause({
    expressions: makeSeparatedArray(head, tail),
    spacing: {
      postClusteredBy: postClusteredBy
    },
    keywords: {
      clusteredBy: clusteredBy,
    }
  });
}

UnionClause = unionKeyword:UnionAllToken postUnion:_ unionQuery:SqlQuery
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
  return new S.SqlUnary({
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
  return new S.SqlComparison({
    lhs: lhs,
    op: opRhs.op,
    decorator: opRhs.decorator,
    rhs: opRhs.rhs,
    spacing: {
      preOp: opRhs.preOp ? opRhs.preOp : preOp,
      postOp: opRhs.postOp,
      postDecorator: opRhs.postDecorator
    },
    keywords: {
      op: opRhs.opKeyword,
      decorator: opRhs.decoratorKeyword,
    },
  });
}

ComparisonOpRhs =
  ComparisonOpRhsCompare
/ ComparisonOpRhsIs
/ ComparisonOpRhsIn
/ ComparisonOpRhsBetween
/ ComparisonOpRhsLike

ComparisonOpRhsCompare = op:ComparisonOperator postOp:_ rhs:(AdditionExpression / (ComparisonDecorator _ SqlQueryInParens))
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

ComparisonOpRhsIs = op:(IsToken $(__ NotToken)? $(__ DistinctToken __ FromToken)?) postOp:_ rhs:AdditionExpression
{
  return {
    op: 'IS' + (op[1] ? ' NOT' : '') + (op[2] ? ' DISTINCT FROM' : ''),
    opKeyword: op.map(o => o ? o : '').join(''),
    postOp: postOp,
    rhs: rhs
  };
}

ComparisonOpRhsIn = op:($(NotToken __)? InToken) postOp:_ rhs:(SqlQueryInParens / SqlRecord)
{
  return {
    op: op[0] ? 'NOT IN' : 'IN',
    opKeyword: op[0] ? op.join('') : op[1],
    postOp: postOp,
    rhs: rhs
  };
}

ComparisonOpRhsBetween = op:($(NotToken __)? BetweenToken) postOp:_ symmetricKeyword:(SymmetricToken _)? start:AdditionExpression preAnd:_ andKeyword:AndToken postAnd:_ end:AdditionExpression
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
    op: op[0] ? 'NOT BETWEEN' : 'BETWEEN',
    opKeyword: op[0] ? op.join('') : op[1],
    postOp: postOp,
    rhs: new S.SqlBetweenPart(value)
  };
}

ComparisonOpRhsLike = op:($(NotToken __)? LikeToken) postOp:_ like:AdditionExpression escape:(_ EscapeToken _ AdditionExpression)?
{
  return {
    op: op[0] ? 'NOT LIKE' : 'LIKE',
    opKeyword: op[0] ? op.join('') : op[1],
    postOp: postOp,
    rhs: escape ? new S.SqlLikePart({
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
  return new S.SqlUnary({
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
/ SqlColumn
/ SqlRecordOrExpressionInParens
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
  return new S.SqlCase({
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
  return new S.SqlWhenThenPart({
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
  unit:($(TimeUnit _ ToToken _ TimeUnit) / $(TimeUnit '_' TimeUnit) / $(TimeUnit 'S'i?))
{
  return new S.SqlInterval({
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
  return S.SqlLiteral.direct(unit);
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
  CastFunction
/ GenericFunction
/ CountStarFunction
/ ExtractFunction
/ TrimFunction
/ FloorCeilFunction
/ TimestampAddDiffFunction
/ PositionFunction
/ JsonValueReturningFunction
/ ArrayFunction
/ NakedFunction

GenericFunction =
  functionName:RefNameFunction
  namespaceExtra:(_ "." _ RefNameFunction)?
  preLeftParen:_
  OpenParen
  postLeftParen:_
  decorator:(FunctionDecorator _)?
  head:GeneralFunctionArgument?
  tail:(CommaSeparator GeneralFunctionArgument)*
  postArguments:_
  CloseParen
  filter:(_ FunctionFilter)?
  window:(_ OverToken _ WindowSpec)?
  extend:(_ SqlExtendClause)?
{
  var value = {};
  var spacing = value.spacing = {
    preLeftParen: preLeftParen,
    postLeftParen: postLeftParen,
  };
  var keywords = value.keywords = {};

  if (namespaceExtra) {
    value.namespace = new S.SqlNamespace({ refName: functionName });
    spacing.postNamespace = namespaceExtra[0];
    spacing.postDot = namespaceExtra[2];
    value.functionName = namespaceExtra[3];
  } else {
    value.functionName = functionName;
  }

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

  if (window) {
    spacing.preOver = window[0];
    keywords.over = window[1];
    spacing.postOver = window[2];
    value.windowSpec = window[3];
  }

  if (extend) {
    value.spacing.preExtend = extend[0];
    value.extendClause = extend[1];
  }

  return new S.SqlFunction(value);
}

NakedFunction = functionName:UnquotedRefNameFree &{ return S.SqlFunction.isNakedFunction(functionName) }
{
  return new S.SqlFunction({
    functionName: new S.RefName({ name: functionName, quotes: false }),
    specialParen: 'none'
  });
}

CountStarFunction =
  functionName:(CountToken / ('"' CountToken '"'))
  preLeftParen:_
  OpenParen
  postLeftParen:_
  "*"
  postArguments:_
  CloseParen
  filter:(_ FunctionFilter)?
  window:(_ OverToken _ WindowSpec)?
{
  var value = {
    functionName: makeFunctionName(functionName)
  };
  var spacing = value.spacing = {
    preLeftParen: preLeftParen,
    postLeftParen: postLeftParen,
  };
  var keywords = value.keywords = {};

  value.args = S.SeparatedArray.fromSingleValue(S.SqlStar.PLAIN);
  spacing.postArguments = postArguments;

  if (filter) {
    spacing.preFilter = filter[0];
    keywords.filter = filter[1].filterKeyword;
    spacing.postFilter = filter[1].postFilter;
    value.whereClause = filter[1].whereClause;
  }

  if (window) {
    spacing.preOver = window[0];
    keywords.over = window[1];
    spacing.postOver = window[2];
    value.windowSpec = window[3];
  }

  return new S.SqlFunction(value);
}

CastFunction =
  functionName:CastToken
  preLeftParen:_
  OpenParen
  postLeftParen:_
  expr:Expression
  separator:AsSeparator
  type:SqlType
  postArguments:_
  CloseParen
{
  return new S.SqlFunction({
    functionName: makeFunctionName(functionName),
    args: new S.SeparatedArray([expr, type], [separator]),
    spacing: {
      preLeftParen: preLeftParen,
      postLeftParen: postLeftParen,
      postArguments: postArguments,
    }
  });
}

JsonValueReturningFunction =
  functionName:JsonValueToken
  preLeftParen:_
  OpenParen
  postLeftParen:_
  expr:Expression
  commaSeparator:CommaSeparator
  path:Expression
  returningSeparator:ReturningSeparator
  type:SqlType
  postArguments:_
  CloseParen
{
  return new S.SqlFunction({
    functionName: makeFunctionName(functionName),
    args: new S.SeparatedArray([expr, path, type], [commaSeparator, returningSeparator]),
    spacing: {
      preLeftParen: preLeftParen,
      postLeftParen: postLeftParen,
      postArguments: postArguments,
    }
  });
}

ExtractFunction =
  functionName:(ExtractToken / ('"' ExtractToken '"'))
  preLeftParen:_
  OpenParen
  postLeftParen:_
  unit:TimeUnitExtra
  separator:FromSeparator
  expr:Expression
  postArguments:_
  CloseParen
{
  var unitLiteral = new S.SqlLiteral({
    value: unit.toUpperCase(),
    stringValue: unit,
  });
  return new S.SqlFunction({
    functionName: makeFunctionName(functionName),
    args: new S.SeparatedArray([unitLiteral, expr], [separator]),
    spacing: {
      preLeftParen: preLeftParen,
      postLeftParen: postLeftParen,
      postArguments: postArguments,
    }
  });
}

TrimFunction =
  functionName:(TrimToken / ('"' TrimToken '"'))
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
    functionName: makeFunctionName(functionName),
    args: from
      ? new S.SeparatedArray([expr, from[1]], [from[0]])
      : S.SeparatedArray.fromSingleValue(expr),
  };
  var spacing = value.spacing = {
    preLeftParen: preLeftParen,
    postLeftParen: postLeftParen,
    postArguments: postArguments,
  };
  var keywords = value.keywords = {};

  if (decorator) {
    value.decorator = decorator[0].toUpperCase();
    keywords.decorator = decorator[0];
    spacing.postDecorator = decorator[1];
  }

  return new S.SqlFunction(value);
}

FloorCeilFunction =
  functionName:((FloorToken / CeilToken) / ('"' (FloorToken / CeilToken) '"'))
  preLeftParen:_
  OpenParen
  postLeftParen:_
  expr:Expression
  separator:ToSeparator
  unit:TimeUnitLiteral
  postArguments:_
  CloseParen
{
  return new S.SqlFunction({
    functionName: makeFunctionName(functionName),
    args: new S.SeparatedArray([expr, unit], [separator]),
    spacing: {
      preLeftParen: preLeftParen,
      postLeftParen: postLeftParen,
      postArguments: postArguments,
    }
  });
}

TimestampAddDiffFunction =
  functionName:((TimestampaddToken / TimestampdiffToken) / ('"' (TimestampaddToken / TimestampdiffToken) '"'))
  preLeftParen:_
  OpenParen
  postLeftParen:_
  unit:TimeUnitLiteral
  tail:(CommaSeparator Expression)*
  postArguments:_
  CloseParen
{
  var value = {
    functionName: makeFunctionName(functionName)
  };
  var spacing = value.spacing = {
    preLeftParen: preLeftParen,
    postLeftParen: postLeftParen,
  };

  value.args = makeSeparatedArray(unit, tail);
  spacing.postArguments = postArguments;

  return new S.SqlFunction(value);
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
    ? new S.SeparatedArray([expr1, expr2, extra[1]], [inSeparator, extra[0]])
    : new S.SeparatedArray([expr1, expr2], [inSeparator])

  return new S.SqlFunction({
    functionName: makeFunctionName(functionName),
    args: args,
    spacing: {
      preLeftParen: preLeftParen,
      postLeftParen: postLeftParen,
      postArguments: postArguments,
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
    functionName: makeFunctionName(functionName),
    specialParen: 'square'
  };
  var spacing = value.spacing = {
    preLeftParen: preLeftParen,
    postLeftParen: postLeftParen,
  };

  if (head) {
    value.args = makeSeparatedArray(head, tail);
    spacing.postArguments = postArguments;
  }

  return new S.SqlFunction(value);
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

WindowSpec =
  OpenParen
  postLeftParen:_
  windowName:(RefName _)?
  partitionByClause:(PartitionByClause _)?
  orderByClause:(OrderByClause _)?
  frame:((RowsToken / RangeToken) _ (FrameBound / (BetweenToken _ FrameBound _ AndToken _ FrameBound)) _)?
  CloseParen
{
  var value = {};
  var spacing = value.spacing = {
    postLeftParen: postLeftParen
  };
  var keywords = value.keywords = {};

  if (windowName) {
    value.windowName = windowName[0];
    spacing.postWindowName = windowName[1];
  }

  if (partitionByClause) {
    value.partitionByClause = partitionByClause[0];
    spacing.postPartitionBy = partitionByClause[1];
  }

  if (orderByClause) {
    value.orderByClause = orderByClause[0];
    spacing.postOrderBy = orderByClause[1];
  }

  if (frame) {
    if (frame[0].toUpperCase() === 'ROWS') {
      value.frameType = 'rows';
      keywords.rows = frame[0];
    } else {
      value.frameType = 'range';
      keywords.range = frame[0];
    }

    spacing.postFrameType = frame[1];

    var b = frame[2];
    if (Array.isArray(b)) {
      keywords.between = b[0];
      spacing.postBetween = b[1];
      value.frameBound1 = b[2];
      spacing.preAnd = b[3];
      keywords.and = b[4];
      spacing.postAnd = b[5];
      value.frameBound2 = b[6];
    } else {
      value.frameBound1 = b;
    }

    spacing.postFrame = frame[3];
  }

  return new S.SqlWindowSpec(value);
}

PartitionByClause =
  partitionBy:PartitionByToken
  postPartitionBy:_
  ex:GroupByExpressionList
{
  return new S.SqlPartitionByClause({
    spacing: {
      postPartitionBy: postPartitionBy
    },
    keywords: {
      partitionBy: partitionBy
    },
    expressions: ex
  });
}

FrameBound = v:(CurrentRowToken / ((UnboundedToken / Digits) _ (PrecedingToken / FollowingToken)))
{
  if (Array.isArray(v)) {
    var n = parseInt(v[0], 10);
    var value = {
      boundValue: isNaN(n) ? 'unbounded' : n,
      keywords: {},
      spacing: {
        postBoundValue: v[1]
      }
    }

    if (isNaN(n)) {
      value.keywords.unbounded = v[0];
    }

    if (value.following = v[2].toUpperCase() === 'FOLLOWING') {
      value.keywords.following = v[2];
    } else {
      value.keywords.preceding = v[2];
    }

    return new S.SqlFrameBound(value);
  } else {
    return new S.SqlFrameBound({
      boundValue: 'currentRow',
      keywords: {
        currentRow: v
      }
    });
  }
}

CommaSeparator = left:_ ',' right:_
{
  return new S.Separator({
    left: left,
    separator: ',',
    right: right,
  });
}

AsSeparator = left:_ separator:AsToken right:_
{
  return new S.Separator({
    left: left,
    separator: separator,
    right: right,
  });
}

FromSeparator = left:_ separator:FromToken right:_
{
  return new S.Separator({
    left: left,
    separator: separator,
    right: right,
  });
}

ToSeparator = left:_ separator:ToToken right:_
{
  return new S.Separator({
    left: left,
    separator: separator,
    right: right,
  });
}

InSeparator = left:_ separator:InToken right:_
{
  return new S.Separator({
    left: left,
    separator: separator,
    right: right,
  });
}

ReturningSeparator = left:_ separator:ReturningToken right:_
{
  return new S.Separator({
    left: left,
    separator: separator,
    right: right,
  });
}

SqlRecordOrExpressionInParens = record:SqlRecord
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
  } else {
    value.keywords = { row: '' };
  }

  return new S.SqlRecord(value);
}

SqlQueryInParens = OpenParen leftSpacing:_ ex:(SqlQueryInParens / SqlQuery) rightSpacing:_ CloseParen
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

  return new S.SqlValues(value);
}

SqlPlaceholder = "?"
{
  return new S.SqlPlaceholder();
}

SqlLiteral = lit:(NullToken / TrueToken / FalseToken / Number / SingleQuotedString / UnicodeString / CharsetString / BinaryString / Timestamp)
{
  return new S.SqlLiteral(lit);
}

NullLiteral = v:NullToken
{
  return new S.SqlLiteral(v);
}

BooleanLiteral = v:(TrueToken / FalseToken)
{
  return new S.SqlLiteral(v);
}

SqlType = UnquotedRefNameFree (__ ArrayToken)? (OpenParen _ SingleQuotedString _ CloseParen)?
{
  return S.SqlType.create(text());
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

SqlColumn = a:RefName b:(_ "." _ RefName)? c:(_ "." _ RefName)?
{
  if (c) {
    return new S.SqlColumn({
      refName: c[3],
      spacing: {
        postTable: c[0],
        postDot: c[2],
      },
      table: new S.SqlTable({
        refName: b[3],
        spacing: {
          postNamespace: b[0],
          postDot: b[2],
        },
        namespace: new S.SqlNamespace({
          refName: a,
        })
      })
    });

  } else if (b) {
    return new S.SqlColumn({
      refName: b[3],
      spacing: {
        postTable: b[0],
        postDot: b[2],
      },
      table: new S.SqlTable({
        refName: a,
      })
    });

  } else {
    return new S.SqlColumn({
      refName: a,
    });
  }
}

SqlTable = a:RefName b:(_ "." _ RefName)?
{
  if (b) {
    return new S.SqlTable({
      refName: b[3],
      spacing: {
        postTable: b[0],
        postDot: b[2],
      },
      table: new S.SqlNamespace({
        refName: a,
      })
    });

  } else {
    return new S.SqlTable({
      refName: a,
    });
  }
}

RefName = QuotedRefName / UnicodeRefName / UnquotedRefName

RefNameAlias = QuotedRefName / UnquotedRefNameAlias

RefNameFunction = QuotedRefName / UnquotedRefNameFunction

QuotedRefName = '"' name:$(('""' / [^"])+) '"'
{
  return new S.RefName({
    name: name.replace(/""/g, '"'),
    quotes: true
  });
}

UnicodeRefName = "U&"i v:QuotedRefName
{
  return new S.RefName({
    name: v.name.replace(/\\(\\|(?:[0-9a-f]{4}))/gi, function(_, s) { return s === '\\' ? '\\' : String.fromCharCode(parseInt(s, 16)); }),
    quotes: true
  });
}

UnquotedRefName = name:UnquotedRefNameFree &{ return !S.RefName.isReservedKeyword(name) }
{
  return new S.RefName({
    name: text(),
    quotes: false
  });
}

UnquotedRefNameAlias = name:UnquotedRefNameFree &{ return !S.RefName.isReservedAlias(name) }
{
  return new S.RefName({
    name: text(),
    quotes: false
  });
}

UnquotedRefNameFunction = name:UnquotedRefNameFree &{ return !S.RefName.isReservedFunctionName(name) }
{
  return new S.RefName({
    name: text(),
    quotes: false
  });
}

UnquotedRefNameFree = $([a-z_]i [a-z0-9_]i*)

SqlStar = a:(RefName _ "." _)? b:(RefName _ "." _)? "*"
{
  if (!a) return S.SqlStar.PLAIN;

  var last = b || a;
  return new S.SqlStar({
    spacing: {
      postTable: last[1],
      postDot: last[3],
    },
    table: b ?
      new S.SqlTable({
        refName: b[0],
        spacing: {
          postNamespace: a[1],
          postDot: a[3],
        },
        namespace: new S.SqlNamespace({
          refName: a[0],
        })
      }) :
      new S.SqlTable({
        refName: a[0]
      })
  });
}

// -----------------------------------

IdentifierPart = [a-z_]i

_ "optional whitespace" = $(Space* ((SingleLineComment / MultiLineComment) Space*)* FinalSingleLineComment?)

__ "mandatory whitespace" = $(Space _)

___ "pure whitespace" = $(Space*)

_sc "possible semicolon" = $(SpaceOrSemicolon* ((SingleLineComment / MultiLineComment) SpaceOrSemicolon*)* FinalSingleLineComment?)

SingleLineComment = $("--" [^\n]* [\n])

FinalSingleLineComment = $("--" [^\n]*)

MultiLineComment = $("/*" (!"*/" .)* "*/")

Space = [ \t\n\r]

SpaceOrSemicolon = [ \t\n\r;]

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
CaseToken = $("CASE"i !IdentifierPart)
CastToken = $("CAST"i !IdentifierPart)
CeilToken = $("CEIL"i !IdentifierPart)
ClusteredByToken = $("CLUSTERED"i __ "BY"i !IdentifierPart)
CountToken = $("COUNT"i !IdentifierPart)
CsvToken = $("CSV"i !IdentifierPart)
CurrentRowToken = $("CURRENT"i __ "ROW"i !IdentifierPart)
CubeToken = $("CUBE"i !IdentifierPart)
DateToken = $("DATE"i !IdentifierPart)
DescToken = $("DESC"i !IdentifierPart)
DistinctToken = $("DISTINCT"i !IdentifierPart)
ElseToken = $("ELSE"i !IdentifierPart)
EndToken = $("END"i !IdentifierPart)
EscapeToken = $("ESCAPE"i !IdentifierPart)
ExplainPlanForToken = $("EXPLAIN"i __ "PLAN"i __ "FOR"i !IdentifierPart)
ExtendToken = $("EXTEND"i !IdentifierPart)
ExtractToken = $("EXTRACT"i !IdentifierPart)
FalseToken = $("FALSE"i !IdentifierPart) { return { value: false, stringValue: text() }; }
FilterToken= $("FILTER"i !IdentifierPart)
FloorToken = $("FLOOR"i !IdentifierPart)
FollowingToken = $("FOLLOWING"i !IdentifierPart)
FromToken = $("FROM"i !IdentifierPart)
GroupByToken = $("GROUP"i __ "BY"i !IdentifierPart)
GroupingSetsToken = $("GROUPING"i __ "SETS"i !IdentifierPart)
HavingToken = $("HAVING"i !IdentifierPart)
InToken = $("IN"i !IdentifierPart)
InsertToken = $("INSERT"i !IdentifierPart)
IntervalToken = $("INTERVAL"i !IdentifierPart)
IntoToken = $("INTO"i !IdentifierPart)
IsToken = $("IS"i !IdentifierPart)
JoinToken = $("JOIN"i !IdentifierPart)
JsonValueToken = $("JSON_VALUE"i !IdentifierPart)
LeadingToken = $("LEADING"i !IdentifierPart)
LikeToken = $("LIKE"i !IdentifierPart)
LimitToken = $("LIMIT"i !IdentifierPart)
NaturalToken = $("NATURAL"i !IdentifierPart)
NotToken = $("NOT"i !IdentifierPart)
NullToken = $("NULL"i !IdentifierPart) { return { value: null, stringValue: text() }; }
OffsetToken = $("OFFSET"i !IdentifierPart)
OnToken = $("ON"i !IdentifierPart)
OrToken = $("OR"i !IdentifierPart)
OrderByToken = $("ORDER"i __ "BY"i !IdentifierPart)
OuterToken = $("OUTER"i !IdentifierPart)
OverToken = $("OVER"i !IdentifierPart)
OverwriteToken = $("OVERWRITE"i !IdentifierPart)
PartitionedByToken = $("PARTITIONED"i __ "BY"i !IdentifierPart)
PartitionByToken = $("PARTITION"i __ "BY"i !IdentifierPart)
PositionToken = $("POSITION"i !IdentifierPart)
PrecedingToken = $("PRECEDING"i !IdentifierPart)
RangeToken = $("RANGE"i !IdentifierPart)
ReplaceToken = $("REPLACE"i !IdentifierPart)
ReturningToken = $("RETURNING"i !IdentifierPart)
RollupToken = $("ROLLUP"i !IdentifierPart)
RowToken = $("ROW"i !IdentifierPart)
RowsToken = $("ROWS"i !IdentifierPart)
SelectToken = $("SELECT"i !IdentifierPart)
SetToken = $("SET"i !IdentifierPart)
SomeToken = $("SOME"i !IdentifierPart)
SymmetricToken = $("SYMMETRIC"i !IdentifierPart)
TableToken = $("TABLE"i !IdentifierPart)
ThenToken = $("THEN"i !IdentifierPart)
TimeToken = $("TIME"i !IdentifierPart)
TimestampToken = $("TIMESTAMP"i !IdentifierPart)
TimestampaddToken = $("TIMESTAMPADD"i !IdentifierPart)
TimestampdiffToken = $("TIMESTAMPDIFF"i !IdentifierPart)
ToToken = $("TO"i !IdentifierPart)
TrailingToken = $("TRAILING"i !IdentifierPart)
TrimToken = $("TRIM"i !IdentifierPart)
TrueToken = $("TRUE"i !IdentifierPart) { return { value: true, stringValue: text() }; }
UnboundedToken = $("UNBOUNDED"i !IdentifierPart)
UnionAllToken = $("UNION"i !IdentifierPart __ AllToken)
UsingToken = $("USING"i !IdentifierPart)
ValuesToken = $("VALUES"i !IdentifierPart)
WhenToken = $("WHEN"i !IdentifierPart)
WhereToken = $("WHERE"i !IdentifierPart)
WithToken = $("WITH"i !IdentifierPart)
