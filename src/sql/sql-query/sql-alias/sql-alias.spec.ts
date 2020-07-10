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

import { parseSql } from '../../..';
import { backAndForth } from '../../../test-utils';

describe('SqlAlias', () => {
  it('works in no alias case', () => {
    const sql = `SELECT city`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromClause": undefined,
        "groupByClause": undefined,
        "havingClause": undefined,
        "innerSpacing": Object {
          "postQuery": "",
          "postSelect": " ",
          "preQuery": "",
        },
        "limitClause": undefined,
        "offsetClause": undefined,
        "orderByClause": undefined,
        "selectDecorator": undefined,
        "selectExpressions": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlAlias {
              "alias": undefined,
              "asKeyword": undefined,
              "expression": SqlRef {
                "column": "city",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": false,
                "quotes": false,
                "table": undefined,
                "tableQuotes": false,
                "type": "ref",
              },
              "innerSpacing": Object {},
              "type": "alias",
            },
          ],
        },
        "selectKeyword": "SELECT",
        "type": "query",
        "unionKeyword": undefined,
        "unionQuery": undefined,
        "whereClause": undefined,
        "withKeyword": undefined,
        "withParts": undefined,
      }
    `);
  });

  it('works in basic case', () => {
    const sql = `SELECT city AS City`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromClause": undefined,
        "groupByClause": undefined,
        "havingClause": undefined,
        "innerSpacing": Object {
          "postQuery": "",
          "postSelect": " ",
          "preQuery": "",
        },
        "limitClause": undefined,
        "offsetClause": undefined,
        "orderByClause": undefined,
        "selectDecorator": undefined,
        "selectExpressions": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlAlias {
              "alias": SqlRef {
                "column": "City",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": false,
                "quotes": false,
                "table": undefined,
                "tableQuotes": false,
                "type": "ref",
              },
              "asKeyword": "AS",
              "expression": SqlRef {
                "column": "city",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": false,
                "quotes": false,
                "table": undefined,
                "tableQuotes": false,
                "type": "ref",
              },
              "innerSpacing": Object {
                "preAlias": " ",
                "preAs": " ",
              },
              "type": "alias",
            },
          ],
        },
        "selectKeyword": "SELECT",
        "type": "query",
        "unionKeyword": undefined,
        "unionQuery": undefined,
        "whereClause": undefined,
        "withKeyword": undefined,
        "withParts": undefined,
      }
    `);
  });

  it('works with table prefix', () => {
    const sql = `SELECT tbl.city  As   City`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromClause": undefined,
        "groupByClause": undefined,
        "havingClause": undefined,
        "innerSpacing": Object {
          "postQuery": "",
          "postSelect": " ",
          "preQuery": "",
        },
        "limitClause": undefined,
        "offsetClause": undefined,
        "orderByClause": undefined,
        "selectDecorator": undefined,
        "selectExpressions": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlAlias {
              "alias": SqlRef {
                "column": "City",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": false,
                "quotes": false,
                "table": undefined,
                "tableQuotes": false,
                "type": "ref",
              },
              "asKeyword": "As",
              "expression": SqlRef {
                "column": "city",
                "innerSpacing": Object {
                  "postTableDot": "",
                  "preTableDot": "",
                },
                "namespace": undefined,
                "namespaceQuotes": false,
                "quotes": false,
                "table": "tbl",
                "tableQuotes": false,
                "type": "ref",
              },
              "innerSpacing": Object {
                "preAlias": "   ",
                "preAs": "  ",
              },
              "type": "alias",
            },
          ],
        },
        "selectKeyword": "SELECT",
        "type": "query",
        "unionKeyword": undefined,
        "unionQuery": undefined,
        "whereClause": undefined,
        "withKeyword": undefined,
        "withParts": undefined,
      }
    `);
  });

  it('works without AS', () => {
    const sql = `SELECT tbl.city City`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "explainKeyword": undefined,
        "fromClause": undefined,
        "groupByClause": undefined,
        "havingClause": undefined,
        "innerSpacing": Object {
          "postQuery": "",
          "postSelect": " ",
          "preQuery": "",
        },
        "limitClause": undefined,
        "offsetClause": undefined,
        "orderByClause": undefined,
        "selectDecorator": undefined,
        "selectExpressions": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlAlias {
              "alias": SqlRef {
                "column": "City",
                "innerSpacing": Object {},
                "namespace": undefined,
                "namespaceQuotes": false,
                "quotes": false,
                "table": undefined,
                "tableQuotes": false,
                "type": "ref",
              },
              "asKeyword": undefined,
              "expression": SqlRef {
                "column": "city",
                "innerSpacing": Object {
                  "postTableDot": "",
                  "preTableDot": "",
                },
                "namespace": undefined,
                "namespaceQuotes": false,
                "quotes": false,
                "table": "tbl",
                "tableQuotes": false,
                "type": "ref",
              },
              "innerSpacing": Object {
                "preAlias": " ",
              },
              "type": "alias",
            },
          ],
        },
        "selectKeyword": "SELECT",
        "type": "query",
        "unionKeyword": undefined,
        "unionQuery": undefined,
        "whereClause": undefined,
        "withKeyword": undefined,
        "withParts": undefined,
      }
    `);
  });
});
