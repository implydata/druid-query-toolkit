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

import { parseSql } from '../../index';
import { backAndForth } from '../../test-utils';

describe('Queries with annotated comments post query', () => {
  it('single annotated comment', () => {
    const sql = `Select column --: valueName = value
    , column1 --: valueName = value
    , column2 
    from table 
    order by column`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": "",
        "fromKeyword": "from",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postExplain": "",
          "postFrom": " ",
          "postJoinKeyword": "",
          "postJoinTable": "",
          "postJoinType": "",
          "postLimitKeyword": "",
          "postOn": "",
          "postOrderByKeyword": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "postSelectValues": " 
          ",
          "postUnionKeyword": "",
          "postWith": "",
          "postWithQuery": "",
          "preGroupByKeyword": "",
          "preHavingKeyword": "",
          "preJoin": "",
          "preLimitKeyword": "",
          "preOrderByKeyword": " 
          ",
          "preQuery": "",
          "preUnionKeyword": "",
          "preWhereKeyword": "",
        },
        "joinKeyword": undefined,
        "joinTable": undefined,
        "joinType": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "onExpression": undefined,
        "onKeyword": undefined,
        "orderByKeyword": "order by",
        "orderBySeparators": Array [],
        "orderByUnits": Array [
          Object {
            "direction": "",
            "expression": SqlRef {
              "column": "column",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "table": undefined,
              "tableQuotes": undefined,
              "type": "ref",
            },
            "postExpression": "",
          },
        ],
        "postQueryAnnotation": Array [],
        "selectAnnotations": Array [
          Annotation {
            "innerSpacing": Object {
              "postAnnotationSignifier": " ",
              "postEquals": " ",
              "postKey": " ",
              "preAnnotation": " ",
            },
            "key": "valueName",
            "value": "value",
          },
          Annotation {
            "innerSpacing": Object {
              "postAnnotationSignifier": " ",
              "postEquals": " ",
              "postKey": " ",
              "preAnnotation": " ",
            },
            "key": "valueName",
            "value": "value",
          },
          null,
        ],
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [
          Separator {
            "left": "
          ",
            "right": " ",
            "separator": ",",
          },
          Separator {
            "left": "
          ",
            "right": " ",
            "separator": ",",
          },
        ],
        "selectValues": Array [
          SqlRef {
            "column": "column",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
          SqlRef {
            "column": "column1",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
          SqlRef {
            "column": "column2",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "column": undefined,
            "innerSpacing": Object {
              "postTable": "",
              "preTable": "",
            },
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": undefined,
            "table": "table",
            "tableQuotes": "",
            "type": "ref",
          },
        ],
        "type": "query",
        "unionKeyword": undefined,
        "unionQuery": undefined,
        "whereExpression": undefined,
        "whereKeyword": undefined,
        "withKeyword": undefined,
        "withSeparators": undefined,
        "withUnits": undefined,
      }
    `);
  });

  it('single annotated comment', () => {
    const sql = `Select column, column1, column2 from table
    order by column
    --: valueName = value`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": "",
        "fromKeyword": "from",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postExplain": "",
          "postFrom": " ",
          "postJoinKeyword": "",
          "postJoinTable": "",
          "postJoinType": "",
          "postLimitKeyword": "",
          "postOn": "",
          "postOrderByKeyword": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "postSelectValues": " ",
          "postUnionKeyword": "",
          "postWith": "",
          "postWithQuery": "",
          "preGroupByKeyword": "",
          "preHavingKeyword": "",
          "preJoin": "",
          "preLimitKeyword": "",
          "preOrderByKeyword": "
          ",
          "preQuery": "",
          "preUnionKeyword": "",
          "preWhereKeyword": "",
        },
        "joinKeyword": undefined,
        "joinTable": undefined,
        "joinType": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "onExpression": undefined,
        "onKeyword": undefined,
        "orderByKeyword": "order by",
        "orderBySeparators": Array [],
        "orderByUnits": Array [
          Object {
            "direction": "",
            "expression": SqlRef {
              "column": "column",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "table": undefined,
              "tableQuotes": undefined,
              "type": "ref",
            },
            "postExpression": "",
          },
        ],
        "postQueryAnnotation": Array [
          Annotation {
            "innerSpacing": Object {
              "postAnnotationSignifier": " ",
              "postEquals": " ",
              "postKey": " ",
              "preAnnotation": "
          ",
            },
            "key": "valueName",
            "value": "value",
          },
        ],
        "selectAnnotations": Array [
          null,
          null,
          null,
        ],
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [
          Separator {
            "left": "",
            "right": " ",
            "separator": ",",
          },
          Separator {
            "left": "",
            "right": " ",
            "separator": ",",
          },
        ],
        "selectValues": Array [
          SqlRef {
            "column": "column",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
          SqlRef {
            "column": "column1",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
          SqlRef {
            "column": "column2",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "column": undefined,
            "innerSpacing": Object {
              "postTable": "",
              "preTable": "",
            },
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": undefined,
            "table": "table",
            "tableQuotes": "",
            "type": "ref",
          },
        ],
        "type": "query",
        "unionKeyword": undefined,
        "unionQuery": undefined,
        "whereExpression": undefined,
        "whereKeyword": undefined,
        "withKeyword": undefined,
        "withSeparators": undefined,
        "withUnits": undefined,
      }
    `);
  });

  it('double annotated comment no spacing', () => {
    const sql = `Select column, column1, column2 from table
    order by column
    --: valueName = value
    --:valueName = value`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": "",
        "fromKeyword": "from",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postExplain": "",
          "postFrom": " ",
          "postJoinKeyword": "",
          "postJoinTable": "",
          "postJoinType": "",
          "postLimitKeyword": "",
          "postOn": "",
          "postOrderByKeyword": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "postSelectValues": " ",
          "postUnionKeyword": "",
          "postWith": "",
          "postWithQuery": "",
          "preGroupByKeyword": "",
          "preHavingKeyword": "",
          "preJoin": "",
          "preLimitKeyword": "",
          "preOrderByKeyword": "
          ",
          "preQuery": "",
          "preUnionKeyword": "",
          "preWhereKeyword": "",
        },
        "joinKeyword": undefined,
        "joinTable": undefined,
        "joinType": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "onExpression": undefined,
        "onKeyword": undefined,
        "orderByKeyword": "order by",
        "orderBySeparators": Array [],
        "orderByUnits": Array [
          Object {
            "direction": "",
            "expression": SqlRef {
              "column": "column",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "table": undefined,
              "tableQuotes": undefined,
              "type": "ref",
            },
            "postExpression": "",
          },
        ],
        "postQueryAnnotation": Array [
          Annotation {
            "innerSpacing": Object {
              "postAnnotationSignifier": " ",
              "postEquals": " ",
              "postKey": " ",
              "preAnnotation": "
          ",
            },
            "key": "valueName",
            "value": "value",
          },
          Annotation {
            "innerSpacing": Object {
              "postAnnotationSignifier": "",
              "postEquals": " ",
              "postKey": " ",
              "preAnnotation": "
          ",
            },
            "key": "valueName",
            "value": "value",
          },
        ],
        "selectAnnotations": Array [
          null,
          null,
          null,
        ],
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [
          Separator {
            "left": "",
            "right": " ",
            "separator": ",",
          },
          Separator {
            "left": "",
            "right": " ",
            "separator": ",",
          },
        ],
        "selectValues": Array [
          SqlRef {
            "column": "column",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
          SqlRef {
            "column": "column1",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
          SqlRef {
            "column": "column2",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "column": undefined,
            "innerSpacing": Object {
              "postTable": "",
              "preTable": "",
            },
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": undefined,
            "table": "table",
            "tableQuotes": "",
            "type": "ref",
          },
        ],
        "type": "query",
        "unionKeyword": undefined,
        "unionQuery": undefined,
        "whereExpression": undefined,
        "whereKeyword": undefined,
        "withKeyword": undefined,
        "withSeparators": undefined,
        "withUnits": undefined,
      }
    `);
  });
});

describe('Queries with annotated comments post select', () => {
  it('single annotated comment', () => {
    const sql = `Select column, column1, column2 --: valueName = value
    from table
    order by column`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": "",
        "fromKeyword": "from",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postExplain": "",
          "postFrom": " ",
          "postJoinKeyword": "",
          "postJoinTable": "",
          "postJoinType": "",
          "postLimitKeyword": "",
          "postOn": "",
          "postOrderByKeyword": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "postSelectValues": "
          ",
          "postUnionKeyword": "",
          "postWith": "",
          "postWithQuery": "",
          "preGroupByKeyword": "",
          "preHavingKeyword": "",
          "preJoin": "",
          "preLimitKeyword": "",
          "preOrderByKeyword": "
          ",
          "preQuery": "",
          "preUnionKeyword": "",
          "preWhereKeyword": "",
        },
        "joinKeyword": undefined,
        "joinTable": undefined,
        "joinType": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "onExpression": undefined,
        "onKeyword": undefined,
        "orderByKeyword": "order by",
        "orderBySeparators": Array [],
        "orderByUnits": Array [
          Object {
            "direction": "",
            "expression": SqlRef {
              "column": "column",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "table": undefined,
              "tableQuotes": undefined,
              "type": "ref",
            },
            "postExpression": "",
          },
        ],
        "postQueryAnnotation": Array [],
        "selectAnnotations": Array [
          null,
          null,
          Annotation {
            "innerSpacing": Object {
              "postAnnotationSignifier": " ",
              "postEquals": " ",
              "postKey": " ",
              "preAnnotation": " ",
            },
            "key": "valueName",
            "value": "value",
          },
        ],
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [
          Separator {
            "left": "",
            "right": " ",
            "separator": ",",
          },
          Separator {
            "left": "",
            "right": " ",
            "separator": ",",
          },
        ],
        "selectValues": Array [
          SqlRef {
            "column": "column",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
          SqlRef {
            "column": "column1",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
          SqlRef {
            "column": "column2",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "column": undefined,
            "innerSpacing": Object {
              "postTable": "",
              "preTable": "",
            },
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": undefined,
            "table": "table",
            "tableQuotes": "",
            "type": "ref",
          },
        ],
        "type": "query",
        "unionKeyword": undefined,
        "unionQuery": undefined,
        "whereExpression": undefined,
        "whereKeyword": undefined,
        "withKeyword": undefined,
        "withSeparators": undefined,
        "withUnits": undefined,
      }
    `);
  });
});

describe('Queries with annotated comments post select and post query', () => {
  it('single annotated comment', () => {
    const sql = `Select column, column1, column2 --: valueName = value 
    from table
    order by column
    --: valueName = value`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": "",
        "fromKeyword": "from",
        "groupByExpression": undefined,
        "groupByExpressionSeparators": undefined,
        "groupByKeyword": undefined,
        "havingExpression": undefined,
        "havingKeyword": undefined,
        "innerSpacing": Object {
          "postExplain": "",
          "postFrom": " ",
          "postJoinKeyword": "",
          "postJoinTable": "",
          "postJoinType": "",
          "postLimitKeyword": "",
          "postOn": "",
          "postOrderByKeyword": " ",
          "postQuery": "",
          "postSelect": " ",
          "postSelectDecorator": "",
          "postSelectValues": " 
          ",
          "postUnionKeyword": "",
          "postWith": "",
          "postWithQuery": "",
          "preGroupByKeyword": "",
          "preHavingKeyword": "",
          "preJoin": "",
          "preLimitKeyword": "",
          "preOrderByKeyword": "
          ",
          "preQuery": "",
          "preUnionKeyword": "",
          "preWhereKeyword": "",
        },
        "joinKeyword": undefined,
        "joinTable": undefined,
        "joinType": undefined,
        "limitKeyword": undefined,
        "limitValue": undefined,
        "onExpression": undefined,
        "onKeyword": undefined,
        "orderByKeyword": "order by",
        "orderBySeparators": Array [],
        "orderByUnits": Array [
          Object {
            "direction": "",
            "expression": SqlRef {
              "column": "column",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "table": undefined,
              "tableQuotes": undefined,
              "type": "ref",
            },
            "postExpression": "",
          },
        ],
        "postQueryAnnotation": Array [
          Annotation {
            "innerSpacing": Object {
              "postAnnotationSignifier": " ",
              "postEquals": " ",
              "postKey": " ",
              "preAnnotation": "
          ",
            },
            "key": "valueName",
            "value": "value",
          },
        ],
        "selectAnnotations": Array [
          null,
          null,
          Annotation {
            "innerSpacing": Object {
              "postAnnotationSignifier": " ",
              "postEquals": " ",
              "postKey": " ",
              "preAnnotation": " ",
            },
            "key": "valueName",
            "value": "value",
          },
        ],
        "selectDecorator": "",
        "selectKeyword": "Select",
        "selectSeparators": Array [
          Separator {
            "left": "",
            "right": " ",
            "separator": ",",
          },
          Separator {
            "left": "",
            "right": " ",
            "separator": ",",
          },
        ],
        "selectValues": Array [
          SqlRef {
            "column": "column",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
          SqlRef {
            "column": "column1",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
          SqlRef {
            "column": "column2",
            "innerSpacing": Object {},
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "table": undefined,
            "tableQuotes": undefined,
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "column": undefined,
            "innerSpacing": Object {
              "postTable": "",
              "preTable": "",
            },
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": undefined,
            "table": "table",
            "tableQuotes": "",
            "type": "ref",
          },
        ],
        "type": "query",
        "unionKeyword": undefined,
        "unionQuery": undefined,
        "whereExpression": undefined,
        "whereKeyword": undefined,
        "withKeyword": undefined,
        "withSeparators": undefined,
        "withUnits": undefined,
      }
    `);
  });
});
