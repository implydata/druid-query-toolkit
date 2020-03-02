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

import { sqlParserFactory } from '../../index';
import { FUNCTIONS } from '../../test-utils';

const parser = sqlParserFactory(FUNCTIONS);

describe('Queries with annotated comments post query', () => {
  it('single annotated comment comment', () => {
    const sql = `Select column, column1, column2 from table 
    order by column
    --: valueName = value`;

    expect(parser(sql)).toMatchInlineSnapshot(`
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
          "postLimitKeyword": "",
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
          "preLimitKeyword": "",
          "preOrderByKeyword": " 
          ",
          "preQuery": "",
          "preQueryAnnotatedComments": "
          ",
          "preUnionKeyword": "",
          "preWhereKeyword": "",
        },
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": "order by",
        "orderBySeparators": Array [],
        "orderByUnits": Array [
          Object {
            "direction": "",
            "expression": SqlRef {
              "innerSpacing": Object {},
              "name": "column",
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "type": "ref",
            },
            "postExpression": "",
          },
        ],
        "postQueryAnnotatedComments": Array [
          AnnotatedComment {
            "innerSpacing": Object {
              "postCommentSignifier": " ",
              "postEquals": " ",
              "postKey": " ",
              "postValue": null,
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
            "innerSpacing": Object {},
            "name": "column",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
          SqlRef {
            "innerSpacing": Object {},
            "name": "column1",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
          SqlRef {
            "innerSpacing": Object {},
            "name": "column2",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "table",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
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

    expect(parser(sql).toString()).toMatchInlineSnapshot(`
      "Select column, column1, column2 from table 
          order by column
          --: valueName = value"
    `);
  });

  it('single annotated comment', () => {
    const sql = `Select column, column1, column2 from table 
    order by column
    --: valueName = value`;

    expect(parser(sql)).toMatchInlineSnapshot(`
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
          "postLimitKeyword": "",
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
          "preLimitKeyword": "",
          "preOrderByKeyword": " 
          ",
          "preQuery": "",
          "preQueryAnnotatedComments": "
          ",
          "preUnionKeyword": "",
          "preWhereKeyword": "",
        },
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": "order by",
        "orderBySeparators": Array [],
        "orderByUnits": Array [
          Object {
            "direction": "",
            "expression": SqlRef {
              "innerSpacing": Object {},
              "name": "column",
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "type": "ref",
            },
            "postExpression": "",
          },
        ],
        "postQueryAnnotatedComments": Array [
          AnnotatedComment {
            "innerSpacing": Object {
              "postCommentSignifier": " ",
              "postEquals": " ",
              "postKey": " ",
              "postValue": null,
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
            "innerSpacing": Object {},
            "name": "column",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
          SqlRef {
            "innerSpacing": Object {},
            "name": "column1",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
          SqlRef {
            "innerSpacing": Object {},
            "name": "column2",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "table",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
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

    expect(parser(sql).toString()).toMatchInlineSnapshot(`
      "Select column, column1, column2 from table 
          order by column
          --: valueName = value"
    `);
  });

  it('single annotated comment no spacing', () => {
    const sql = `Select column, column1, column2 from table 
    order by column
    --: valueName = value
    --:valueName = value`;

    expect(parser(sql)).toMatchInlineSnapshot(`
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
          "postLimitKeyword": "",
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
          "preLimitKeyword": "",
          "preOrderByKeyword": " 
          ",
          "preQuery": "",
          "preQueryAnnotatedComments": "
          ",
          "preUnionKeyword": "",
          "preWhereKeyword": "",
        },
        "limitKeyword": undefined,
        "limitValue": undefined,
        "orderByKeyword": "order by",
        "orderBySeparators": Array [],
        "orderByUnits": Array [
          Object {
            "direction": "",
            "expression": SqlRef {
              "innerSpacing": Object {},
              "name": "column",
              "namespace": undefined,
              "namespaceQuotes": undefined,
              "quotes": "",
              "type": "ref",
            },
            "postExpression": "",
          },
        ],
        "postQueryAnnotatedComments": Array [
          AnnotatedComment {
            "innerSpacing": Object {
              "postCommentSignifier": " ",
              "postEquals": " ",
              "postKey": " ",
              "postValue": "
          ",
            },
            "key": "valueName",
            "value": "value",
          },
          AnnotatedComment {
            "innerSpacing": Object {
              "postCommentSignifier": null,
              "postEquals": " ",
              "postKey": " ",
              "postValue": null,
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
            "innerSpacing": Object {},
            "name": "column",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
          SqlRef {
            "innerSpacing": Object {},
            "name": "column1",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
          SqlRef {
            "innerSpacing": Object {},
            "name": "column2",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
            "type": "ref",
          },
        ],
        "tableSeparators": Array [],
        "tables": Array [
          SqlRef {
            "innerSpacing": Object {},
            "name": "table",
            "namespace": undefined,
            "namespaceQuotes": undefined,
            "quotes": "",
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

    expect(parser(sql).toString()).toMatchInlineSnapshot(`
      "Select column, column1, column2 from table 
          order by column
          --: valueName = value
          --:valueName = value"
    `);
  });
});
