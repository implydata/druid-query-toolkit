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

import { backAndForth } from '../../test-utils';
import { SqlExpression } from '../sql-expression';

describe('SqlStar', () => {
  describe('star expressions', () => {
    it.each([
      'SELECT *',
      `SELECT hello. *`,
      `SELECT "hello" . *`,
      `SELECT """hello""".*`,
      `SELECT "a""b".*`,
      `SELECT a . b . *`,
      `SELECT "a""b".c.*`,
    ])('correctly parses: %s', sql => {
      backAndForth(sql);
    });
  });

  it('without quotes + namespace', () => {
    const sql = `SELECT hello . "world" . *`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlQuery {
        "clusteredByClause": undefined,
        "contextStatements": undefined,
        "decorator": undefined,
        "explain": undefined,
        "fromClause": undefined,
        "groupByClause": undefined,
        "havingClause": undefined,
        "insertClause": undefined,
        "keywords": Object {
          "select": "SELECT",
        },
        "limitClause": undefined,
        "offsetClause": undefined,
        "orderByClause": undefined,
        "parens": undefined,
        "partitionedByClause": undefined,
        "replaceClause": undefined,
        "selectExpressions": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlStar {
              "keywords": Object {},
              "parens": undefined,
              "spacing": Object {
                "postDot": " ",
                "postTable": " ",
              },
              "table": SqlTable {
                "keywords": Object {},
                "namespace": SqlNamespace {
                  "keywords": Object {},
                  "parens": undefined,
                  "refName": RefName {
                    "name": "hello",
                    "quotes": false,
                  },
                  "spacing": Object {},
                  "type": "namespace",
                },
                "parens": undefined,
                "refName": RefName {
                  "name": "world",
                  "quotes": true,
                },
                "spacing": Object {
                  "postDot": " ",
                  "postNamespace": " ",
                },
                "type": "table",
              },
              "type": "star",
            },
          ],
        },
        "spacing": Object {
          "postSelect": " ",
        },
        "type": "query",
        "unionQuery": undefined,
        "whereClause": undefined,
        "withClause": undefined,
      }
    `);
  });
});
