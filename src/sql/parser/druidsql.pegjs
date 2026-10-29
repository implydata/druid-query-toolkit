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

Start = initial:_ thing:(TopLevelStatement / SqlAlias) final:_sc
{
  if (initial) thing = thing.changeSpace('initial', initial);
  if (final) thing = thing.changeSpace('final', final);
  return thing;
}

// PEG's ordered choice commits: once this alternative succeeds, Start never reconsiders it
// to try SqlAlias, even when the rest of Start then fails. So a query rule that matched only
// a prefix of the input would sink the whole parse instead of letting the expression reading
// have its turn. The lookahead makes this alternative succeed only when the query explains
// everything up to the end of the input, so the bodies that are also expressions fall
// through when something trails them: `VALUES (1) AS t` and `TABLE foo AS t` are aliased
// expressions, while a bare `VALUES (1)` is still a statement. A `;` after the query also
// commits, since no expression can go past it: `SELECT 1; SELECT 2` then fails after the `;`,
// which is where callers that split statements on the error location expect it.
TopLevelStatement = query:SqlQueryWithPossibleContext &(_sc !. / _ ";")
{
  return query;
}

StartSetStatementsOnly = spaceBefore:_ statements:(SqlSetStatement _sc)* rest:$(.*)
{
  let ret = {
    spaceBefore: spaceBefore,
    rest: rest
  }

  if (statements.length) {
    ret.contextStatements = new S.SeparatedArray(
      statements.map(function(x) { return x[0] }),
      statements.map(function(x) { return x[1] }).slice(0, statements.length - 1)
    );
    ret.spaceAfter = statements[statements.length - 1][1];
  }

  return ret;
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

GeneralFunctionArgument = SqlStar / SqlLabeledExpression / SqlAlias

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

SqlKeyValue = LongKeyValueForm / ShortKeyValueForm

LongKeyValueForm = keyToken:KeyToken postKey:_ key:Expression postKeyExpression:_ valueToken:ValueToken preValueExpression:_ value:Expression
{
  return new S.SqlKeyValue({
    key: key,
    value: value,
    spacing: {
      postKey: postKey,
      postKeyExpression: postKeyExpression,
      preValueExpression: preValueExpression
    },
    keywords: {
      key: keyToken,
      value: valueToken
    }
  });
}

// The key can not contain an unparenthesized colon access, so the first colon always separates the key from the value
ShortKeyValueForm = key:ShortKey postKeyExpression:_ ":" preValueExpression:_ value:Expression
{
  return new S.SqlKeyValue({
    key: key,
    value: value,
    short: true,
    spacing: {
      postKeyExpression: postKeyExpression,
      preValueExpression: preValueExpression
    }
  });
}

ShortKey = head:ShortKeyTerm tail:(_ '||' _ ShortKeyTerm)*
{
  return maybeMakeMulti('||', head, tail);
}

ShortKeyTerm = expression:BaseType casts:InfixCastTail*
{
  return makeInfixCasts(expression, casts);
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

SqlQueryWithPossibleContext = statements:(SqlSetStatement _sc)* query:SqlQueryStatement
{
  if (!statements.length) return query;

  // The SET statements go outside of the parentheses of a query that is only in parentheses
  if (query.hasParens()) query = new S.SqlParensQuery({ query: query });

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

SqlQueryStatement =
  explain:(ExplainPlanForToken _)?
  insertClause:(InsertClause _)?
  replaceClause:(ReplaceClause _)?
  body:QueryBody
  orderSuffix:QueryOrderSuffix
  tail:(QueryPipesTail / QueryUnionTail)
{
  var value = {};
  var keywords = value.keywords = {};
  var spacing = value.spacing = {};
  var pipes = tail.pipes;
  var ingestSuffix = tail.ingestSuffix;
  var union = tail.union;

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

  var hasOrderSuffix = Boolean(Object.keys(orderSuffix.value).length);

  // The pipe operators after `A UNION ALL B` apply to the whole union, but the union is parsed
  // from the right, so they end up on a pipes query around B. They get taken back out here.
  var unionPipesQuery;
  if (union && isBarePipesQuery(union[1].unionQuery)) {
    unionPipesQuery = union[1].unionQuery;
  }

  var ClassFn;
  if (pipes.length || unionPipesQuery) {
    // A WITH that is not in parentheses takes in the pipe operators too, so that they can use
    // its tables
    var rootBody = body;
    if (body.value.withClause && (body.ClassFn === S.SqlQuery || body.ClassFn === S.SqlWithQuery)) {
      value.withClause = body.value.withClause;
      spacing.postWithClause = body.spacing.postWithClause;
      rootBody = bodyWithoutWith(body);
    }

    // The body with its ORDER BY / LIMIT / OFFSET and UNION ALL forms the root query of the
    // pipeline, the rest of the statement wraps the whole pipeline
    var rootValue = Object.assign({}, rootBody.value, orderSuffix.value);
    var rootKeywords = rootValue.keywords = Object.assign({}, rootBody.keywords);
    var rootSpacing = rootValue.spacing = Object.assign({}, rootBody.spacing, orderSuffix.spacing);
    if (unionPipesQuery) {
      Object.assign(rootValue, ingestSuffix.value);
      Object.assign(rootSpacing, ingestSuffix.spacing);
      rootSpacing.preUnion = union[0];
      rootKeywords.union = union[1].unionKeyword;
      rootSpacing.postUnion = union[1].postUnion;
      rootValue.unionQuery = unionPipesQuery.query;

      value.pipeOperators = unionPipesQuery.pipeOperators;
      spacing.prePipes = unionPipesQuery.spacing.prePipes;
      ingestSuffix = {
        value: pickDefined(unionPipesQuery, ['partitionedByClause', 'clusteredByClause']),
        spacing: pickDefined(unionPipesQuery.spacing, ['prePartitionedByClause', 'preClusteredByClause'])
      };
    } else {
      value.pipeOperators = new S.SeparatedArray(
        pipes.map(function(x) { return x[1] }),
        pipes.slice(1).map(function(x) { return x[0] })
      );
      spacing.prePipes = pipes[0][0];
    }

    value.query = rootBody.ClassFn === S.SqlParensQuery && !hasOrderSuffix && !unionPipesQuery
      ? rootBody.value.query
      : new rootBody.ClassFn(rootValue);
    ClassFn = S.SqlPipesQuery;
  } else {
    // The body decides which class we build
    Object.assign(value, body.value);
    Object.assign(keywords, body.keywords);
    Object.assign(spacing, body.spacing);

    Object.assign(value, orderSuffix.value);
    Object.assign(spacing, orderSuffix.spacing);
    ClassFn = body.ClassFn;
  }

  Object.assign(value, ingestSuffix.value);
  Object.assign(spacing, ingestSuffix.spacing);

  if (union && !unionPipesQuery) {
    spacing.preUnion = union[0];
    keywords.union = union[1].unionKeyword;
    spacing.postUnion = union[1].postUnion;
    value.unionQuery = union[1].unionQuery;
  }

  // A query in parentheses only needs the SqlParensQuery around it to carry the clauses that
  // go outside of its parentheses
  if (
    ClassFn === S.SqlParensQuery &&
    !explain &&
    !insertClause &&
    !replaceClause &&
    !hasOrderSuffix &&
    !Object.keys(ingestSuffix.value).length &&
    !union
  ) {
    return value.query;
  }

  return new ClassFn(value);
}

// Each alternative is discriminated by its leading token, so the order only
// matters for keeping the common SELECT case first.
QueryBody =
  SelectBody
/ WithQueryBody
/ ValuesBody
/ TableBody
/ FromBody
/ ParensBody

SelectBody = withClause:(WithClause _)? heart:QueryHeart
{
  var value = {};
  var keywords = {};
  var spacing = {};

  if (withClause) {
    value.withClause = withClause[0];
    spacing.postWithClause = withClause[1];
  }

  Object.assign(value, heart.value);
  Object.assign(keywords, heart.keywords);
  Object.assign(spacing, heart.spacing);

  return { ClassFn: S.SqlQuery, value: value, keywords: keywords, spacing: spacing };
}

// A WITH before a SELECT is part of the SqlQuery (see SelectBody), before anything else it
// makes a SqlWithQuery: a query in parentheses, or a bare VALUES, TABLE or FROM
WithQueryBody =
  withClause:WithClause
  postWithClause:_
  query:(SqlQueryInParens / WithBareQuery)
{
  return {
    ClassFn: S.SqlWithQuery,
    value: {
      withClause: withClause,
      query: query
    },
    keywords: {},
    spacing: { postWithClause: postWithClause }
  };
}

WithBareQuery = body:(ValuesBody / TableBody / FromBody)
{
  return bodyToSql(body);
}

ValuesBody =
  values:ValuesToken
  postValues:_
  head:SqlRecord
  tail:(CommaSeparator SqlRecord)*
{
  return {
    ClassFn: S.SqlValues,
    value: { records: makeSeparatedArray(head, tail) },
    keywords: { values: values },
    spacing: { postValues: postValues }
  };
}

TableBody =
  tableKeyword:TableToken
  postTable:_
  table:SqlTable
{
  return {
    ClassFn: S.SqlTableQuery,
    value: { table: table },
    keywords: { table: tableKeyword },
    spacing: { postTable: postTable }
  };
}

// A FROM query takes a whole FROM clause, with aliases, joins and comma separated tables
FromBody = fromClause:FromClause
{
  return {
    ClassFn: S.SqlFromQuery,
    value: { fromClause: fromClause },
    keywords: {},
    spacing: {}
  };
}

// A query in parentheses followed by more of the statement, like `(FROM t) UNION ALL ...`
ParensBody = query:SqlQueryInParens
{
  return {
    ClassFn: S.SqlParensQuery,
    value: { query: query },
    keywords: {},
    spacing: {}
  };
}

// The query suffix clauses come in two parts so that pipe operators can go between them:
// ORDER BY / LIMIT / OFFSET belong to the query before any pipes, while PARTITIONED BY and
// CLUSTERED BY come after all of them. Both always succeed, and this is the single place the
// query suffix clauses are parsed.
QueryOrderSuffix =
  orderByClause:(_ OrderByClause)?
  limitClause:(_ LimitClause)?
  offsetClause:(_ OffsetClause)?
{
  var value = {};
  var spacing = {};

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

  return { value: value, spacing: spacing };
}

QueryIngestSuffix =
  partitionedByClause:(_ PartitionedByClause)?
  clusteredByClause:(_ ClusteredByClause)?
{
  var value = {};
  var spacing = {};

  if (partitionedByClause) {
    spacing.prePartitionedByClause = partitionedByClause[0];
    value.partitionedByClause = partitionedByClause[1];
  }

  if (clusteredByClause) {
    spacing.preClusteredByClause = clusteredByClause[0];
    value.clusteredByClause = clusteredByClause[1];
  }

  return { value: value, spacing: spacing };
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


// The two target forms take different trailers, and each rules the other out: an export
// function takes `AS <format>`, a table takes an optional column list. Requiring the AS is
// also what keeps `INSERT INTO t (a, b)` from parsing the column list as function
// arguments -- with no AS the function branch fails and SqlTable wins.
InsertTarget =
  table:GenericFunction preAs:_ as:AsToken preFormat:_ format:CsvToken
{
  return {
    table: table,
    format: format,
    keywords: { as: as },
    spacing: { preAs: preAs, preFormat: preFormat }
  };
}
/ table:SqlTable columns:(_ SqlColumnList)?
{
  var target = { table: table, keywords: {}, spacing: {} };

  if (columns) {
    target.columns = columns[1];
    target.spacing.preColumns = columns[0];
  }

  return target;
}

InsertClause =
  insert:InsertToken
  postInsert:__
  into:IntoToken
  postInto:__
  target:InsertTarget
{
  return new S.SqlInsertClause({
    table: target.table,
    columns: target.columns,
    format: target.format,
    keywords: Object.assign({
      insert: insert,
      into: into
    }, target.keywords),
    spacing: Object.assign({
      postInsert: postInsert,
      postInto: postInto
    }, target.spacing)
  });
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

SqlOrderByExpression =
  expression:Expression
  direction:(_ (AscToken / DescToken))?
  nulls:(_ (NullsFirstToken / NullsLastToken))?
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

  if (nulls) {
    spacing.preNulls = nulls[0];
    value.nulls = /first$/i.test(nulls[1]) ? 'FIRST' : 'LAST';
    keywords.nulls = nulls[1];
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

// Pipe operators come after the rest of the query, a UNION ALL included (see
// SqlQueryStatement), and only the ingest suffix can follow them
QueryPipesTail = pipes:(_ SqlPipeOperator)+ ingestSuffix:QueryIngestSuffix
{
  return { pipes: pipes, ingestSuffix: ingestSuffix, union: null };
}

QueryUnionTail = ingestSuffix:QueryIngestSuffix union:(_ UnionClause)?
{
  return { pipes: [], ingestSuffix: ingestSuffix, union: union };
}

UnionClause = unionKeyword:UnionAllToken postUnion:_ unionQuery:SqlQueryStatement
{
  return {
    unionKeyword: unionKeyword,
    postUnion: postUnion,
    unionQuery: unionQuery
  };
}

// ------------------------------

SqlPipeOperator = "|>" postPipe:_ pipeOperator:PipeOperatorBody
{
  return pipeOperator.changeSpace('postPipe', postPipe);
}

PipeOperatorBody =
  SelectPipeOperator
/ WherePipeOperator
/ AggregatePipeOperator
/ OrderByPipeOperator
/ LimitPipeOperator
/ UnionPipeOperator
/ ExtendPipeOperator
/ SetPipeOperator
/ DropPipeOperator
/ RenamePipeOperator
/ AsPipeOperator
/ DistinctPipeOperator
/ JoinPipeOperator

SelectPipeOperator = select:SelectClause
{
  var value = {
    selectExpressions: select.selectExpressions,
    keywords: { select: select.selectKeyword },
    spacing: { postSelect: select.postSelect }
  };

  if (select.decorator) {
    value.decorator = select.decorator;
    value.keywords.decorator = select.decoratorKeyword;
    value.spacing.postDecorator = select.postDecorator;
  }

  return new S.SqlSelectPipeOperator(value);
}

WherePipeOperator = whereClause:SqlWhereClause
{
  return new S.SqlWherePipeOperator({ whereClause: whereClause });
}

// `AGGREGATE GROUP BY x` has no aggregates, so the GROUP BY is tried first
AggregatePipeOperator =
  aggregate:AggregateToken
  postAggregate:_
  body:(PipeGroupByClause / (PipeAggregateItem (CommaSeparator PipeAggregateItem)* (_ PipeGroupByClause)?))
{
  var value = {
    keywords: { aggregate: aggregate },
    spacing: { postAggregate: postAggregate }
  };

  if (Array.isArray(body)) {
    value.expressions = makeSeparatedArray(body[0], body[1]);
    if (body[2]) {
      value.spacing.preGroupByClause = body[2][0];
      value.groupByClause = body[2][1];
    }
  } else {
    value.groupByClause = body;
  }

  return new S.SqlAggregatePipeOperator(value);
}

// An item of an AGGREGATE, in the aggregate list or in the GROUP BY: an expression with an
// optional alias and an optional order suffix, which sorts the output by it. ASC and DESC
// start the order suffix, so without an AS they are not taken as an alias.
PipeAggregateItem =
  expression:Expression
  alias:PipeAggregateItemAlias?
  suffix:(_ (AscToken / DescToken) (_ (NullsFirstToken / NullsLastToken))?)?
{
  var item = expression;

  if (alias) {
    var aliasValue = {
      expression: expression,
      alias: alias.alias,
      keywords: { as: alias.as || '' },
      spacing: { preAlias: alias.preAlias }
    };
    if (alias.as) aliasValue.spacing.preAs = alias.preAs;
    item = new S.SqlAlias(aliasValue);
  }

  if (suffix) {
    var value = {
      expression: item,
      direction: suffix[1].toUpperCase(),
      keywords: { direction: suffix[1] },
      spacing: { preDirection: suffix[0] }
    };
    if (suffix[2]) {
      value.spacing.preNulls = suffix[2][0];
      value.nulls = /first$/i.test(suffix[2][1]) ? 'FIRST' : 'LAST';
      value.keywords.nulls = suffix[2][1];
    }
    item = new S.SqlOrderByExpression(value);
  }

  return item;
}

PipeAggregateItemAlias =
  preAs:_ as:AsToken preAlias:_ alias:RefNameAlias
{
  return { preAs: preAs, as: as, preAlias: preAlias, alias: alias };
}
/ preAlias:_ !(AscToken / DescToken) alias:RefNameAlias
{
  return { preAlias: preAlias, alias: alias };
}

// Unlike in standard SQL the GROUP BY items of an AGGREGATE can have aliases and order suffixes.
// That form is only taken when some item has one, so everything else parses exactly like a
// standard GROUP BY.
PipeGroupByClause = PipeItemsGroupByClause / GroupByClause

PipeItemsGroupByClause =
  groupBy:GroupByToken
  postGroupBy:_
  head:PipeAggregateItem
  tail:(CommaSeparator PipeAggregateItem)*
  &{
    return [head].concat(tail.map(function(t) { return t[1]; })).some(function(ex) {
      return ex instanceof S.SqlAlias || ex instanceof S.SqlOrderByExpression;
    });
  }
{
  return new S.SqlGroupByClause({
    expressions: makeSeparatedArray(head, tail),
    spacing: {
      postGroupBy: postGroupBy
    },
    keywords: {
      groupBy: groupBy
    }
  });
}

OrderByPipeOperator = orderByClause:OrderByClause
{
  return new S.SqlOrderByPipeOperator({ orderByClause: orderByClause });
}

LimitPipeOperator = limitClause:LimitClause offsetClause:(_ OffsetClause)?
{
  var value = { limitClause: limitClause };
  if (offsetClause) {
    value.spacing = { preOffsetClause: offsetClause[0] };
    value.offsetClause = offsetClause[1];
  }
  return new S.SqlLimitPipeOperator(value);
}

ExtendPipeOperator =
  extend:ExtendToken
  postExtend:_
  head:SqlAlias
  tail:(CommaSeparator SqlAlias)*
{
  return new S.SqlExtendPipeOperator({
    expressions: makeSeparatedArray(head, tail),
    keywords: { extend: extend },
    spacing: { postExtend: postExtend }
  });
}

SetPipeOperator =
  set:SetToken
  postSet:_
  head:SqlColumnAssignment
  tail:(CommaSeparator SqlColumnAssignment)*
{
  return new S.SqlSetPipeOperator({
    assignments: makeSeparatedArray(head, tail),
    keywords: { set: set },
    spacing: { postSet: postSet }
  });
}

SqlColumnAssignment = column:SqlColumn preEquals:_ "=" postEquals:_ expression:Expression
{
  return new S.SqlColumnAssignment({
    column: column,
    expression: expression,
    spacing: {
      preEquals: preEquals,
      postEquals: postEquals
    }
  });
}

DropPipeOperator =
  drop:DropToken
  postDrop:_
  head:SqlColumn
  tail:(CommaSeparator SqlColumn)*
{
  return new S.SqlDropPipeOperator({
    columns: makeSeparatedArray(head, tail),
    keywords: { drop: drop },
    spacing: { postDrop: postDrop }
  });
}

UnionPipeOperator =
  union:UnionToken
  postUnion:_
  decorator:((AllToken / DistinctToken) _)?
  head:SqlQueryInParens
  tail:(CommaSeparator SqlQueryInParens)*
{
  var value = {
    queries: makeSeparatedArray(head, tail),
    keywords: { union: union },
    spacing: { postUnion: postUnion }
  };

  if (decorator) {
    value.decorator = decorator[0].toUpperCase();
    value.keywords.decorator = decorator[0];
    value.spacing.postDecorator = decorator[1];
  }

  return new S.SqlUnionPipeOperator(value);
}

RenamePipeOperator =
  rename:RenameToken
  postRename:_
  head:PipeRenameItem
  tail:(CommaSeparator PipeRenameItem)*
{
  return new S.SqlRenamePipeOperator({
    renames: makeSeparatedArray(head, tail),
    keywords: { rename: rename },
    spacing: { postRename: postRename }
  });
}

// A column and its new name, with or without an AS in between
PipeRenameItem = item:SqlAlias &{ return item instanceof S.SqlAlias && item.expression instanceof S.SqlColumn && !item.columns; }
{
  return item;
}

AsPipeOperator = as:AsToken postAs:_ alias:RefNameAlias
{
  return new S.SqlAsPipeOperator({
    alias: alias,
    keywords: { as: as },
    spacing: { postAs: postAs }
  });
}

DistinctPipeOperator = distinct:DistinctToken
{
  return new S.SqlDistinctPipeOperator({
    keywords: { distinct: distinct }
  });
}

JoinPipeOperator = joinPart:SqlJoinPart
{
  return new S.SqlJoinPipeOperator({ joinPart: joinPart });
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
  Concat (||)
  Infix cast (x::BIGINT)
  Colon access (v:a.b)
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

ConcatExpression = head:InfixCastExpression tail:(_ '||' _ InfixCastExpression)*
{
  return maybeMakeMulti('||', head, tail);
}

InfixCastExpression = expression:ColonAccessExpression casts:InfixCastTail*
{
  return makeInfixCasts(expression, casts);
}

InfixCastTail = preDoubleColon:_ "::" postDoubleColon:_ castType:SqlType
{
  return {
    castType: castType,
    preDoubleColon: preDoubleColon,
    postDoubleColon: postDoubleColon
  };
}

ColonAccessExpression = base:BaseType colon:(_ ":" _ ColonAccessFirstSegment ColonAccessSegment*)?
{
  if (!colon) return base;
  return new S.SqlColonAccess({
    base: base,
    segments: [colon[3]].concat(colon[4]),
    spacing: {
      preColon: colon[0],
      postColon: colon[2]
    }
  });
}

ColonAccessFirstSegment = ColonAccessBracketSegment / ColonAccessNameSegment

ColonAccessSegment =
  preDot:_ "." postDot:_ segment:ColonAccessNameSegment
{
  return Object.assign({ preDot: preDot, postDot: postDot }, segment);
}
/ preBracket:_ segment:ColonAccessBracketSegment
{
  return Object.assign({ preBracket: preBracket }, segment);
}

ColonAccessNameSegment = name:RefName
{
  return { name: name };
}

ColonAccessBracketSegment = "[" postLeftBracket:_ value:ColonAccessBracketValue preRightBracket:_ "]"
{
  return {
    value: value,
    postLeftBracket: postLeftBracket,
    preRightBracket: preRightBracket
  };
}

ColonAccessBracketValue =
  lit:(SingleQuotedString / UnicodeString)
{
  return new S.SqlLiteral(lit);
}
/ digits:Digits
{
  return new S.SqlLiteral({
    value: +digits,
    stringValue: digits
  });
}

BaseType =
  SqlPlaceholder
/ Interval
/ CaseExpression
/ Function
/ SqlValues
/ SqlTableQuery
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
/ JsonObjectFunction // Before GenericFunction, which would read JSON_OBJECT(k: v) as a call with a colon access argument
/ GenericFunction
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

JsonObjectFunction =
  functionName:JsonObjectToken
  preLeftParen:_
  OpenParen
  postLeftParen:_
  head:SqlKeyValue?
  tail:(CommaSeparator SqlKeyValue)*
  postArguments:_
  CloseParen
{
  var value = {
    functionName: makeFunctionName(functionName)
  };
  var spacing = value.spacing = {
    preLeftParen: preLeftParen,
    postLeftParen: postLeftParen
  };

  if (head) {
    value.args = makeSeparatedArray(head, tail);
    spacing.postArguments = postArguments;
  }

  return new S.SqlFunction(value);
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
  var lastSpaceName;

  if (windowName) {
    value.windowName = windowName[0];
    spacing.postWindowName = windowName[1];
    lastSpaceName = 'postWindowName';
  }

  if (partitionByClause) {
    value.partitionByClause = partitionByClause[0];
    spacing.postPartitionBy = partitionByClause[1];
    lastSpaceName = 'postPartitionBy';
  }

  if (orderByClause) {
    value.orderByClause = orderByClause[0];
    spacing.postOrderBy = orderByClause[1];
    lastSpaceName = 'postOrderBy';
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

    spacing.preRightParen = frame[3];
  } else if (lastSpaceName) {
    // The space after the last part is the space before the closing paren
    spacing.preRightParen = spacing[lastSpaceName];
    delete spacing[lastSpaceName];
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

// A statement can itself start with a query in parentheses (see ParensBody), which covers
// nested parentheses
SqlQueryInParens = OpenParen leftSpacing:_ ex:SqlQueryStatement rightSpacing:_ CloseParen
{
  return ex.addParens(leftSpacing, rightSpacing);
}

SqlTableQuery = body:TableBody { return bodyToSql(body); }

SqlValues = body:ValuesBody { return bodyToSql(body); }

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

SqlType = SqlTypeName (__ ArrayToken)?
{
  return S.SqlType.create(text());
}

SqlTypeName =
  IntervalToken __ IntervalQualifier
/ "DOUBLE"i __ "PRECISION"i !IdentifierPart
/ UnquotedRefNameFree _ OpenParen _ (SingleQuotedString / SqlTypePrecision) _ CloseParen // TYPE('COMPLEX<json>'), DECIMAL(5, 1)
/ UnquotedRefNameFree

SqlTypePrecision = Digits (_ "," _ Digits)?

// As in INTERVAL DAY, INTERVAL DAY(3) TO SECOND(6), or INTERVAL YEAR TO MONTH
IntervalQualifier = IntervalQualifierUnit (__ ToToken __ IntervalQualifierUnit)?

IntervalQualifierUnit = TimeUnit "S"i? !IdentifierPart (_ OpenParen _ SqlTypePrecision _ CloseParen)?

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
        postNamespace: b[0],
        postDot: b[2],
      },
      namespace: new S.SqlNamespace({
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

AggregateToken = $("AGGREGATE"i !IdentifierPart)
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
CsvToken = $("CSV"i !IdentifierPart)
CurrentRowToken = $("CURRENT"i __ "ROW"i !IdentifierPart)
CubeToken = $("CUBE"i !IdentifierPart)
DateToken = $("DATE"i !IdentifierPart)
DescToken = $("DESC"i !IdentifierPart)
DistinctToken = $("DISTINCT"i !IdentifierPart)
DropToken = $("DROP"i !IdentifierPart)
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
JsonObjectToken = $("JSON_OBJECT"i !IdentifierPart)
KeyToken = $("KEY"i !IdentifierPart)
ValueToken = $("VALUE"i !IdentifierPart)
LeadingToken = $("LEADING"i !IdentifierPart)
LikeToken = $("LIKE"i !IdentifierPart)
LimitToken = $("LIMIT"i !IdentifierPart)
NaturalToken = $("NATURAL"i !IdentifierPart)
NotToken = $("NOT"i !IdentifierPart)
NullToken = $("NULL"i !IdentifierPart) { return { value: null, stringValue: text() }; }
NullsFirstToken = $("NULLS"i __ "FIRST"i !IdentifierPart)
NullsLastToken = $("NULLS"i __ "LAST"i !IdentifierPart)
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
RenameToken = $("RENAME"i !IdentifierPart)
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
UnionToken = $("UNION"i !IdentifierPart)
UsingToken = $("USING"i !IdentifierPart)
ValuesToken = $("VALUES"i !IdentifierPart)
WhenToken = $("WHEN"i !IdentifierPart)
WhereToken = $("WHERE"i !IdentifierPart)
WithToken = $("WITH"i !IdentifierPart)
