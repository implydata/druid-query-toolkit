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

import { sane, SqlExpression } from '../..';
import { backAndForth } from '../../test-utils';

describe('SqlNamedExpression', () => {
  describe('parses', () => {
    it('works in no alias case', () => {
      const sql = sane`
        Foo(
          "a" => "lol",
          b => hello + 1
        )
      `;

      backAndForth(sql);

      expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
        SqlFunction {
          "args": SeparatedArray {
            "separators": Array [
              Separator {
                "left": "",
                "right": "
          ",
                "separator": ",",
              },
            ],
            "values": Array [
              SqlLabeledExpression {
                "expression": SqlColumn {
                  "keywords": Object {},
                  "parens": undefined,
                  "refName": RefName {
                    "name": "lol",
                    "quotes": true,
                  },
                  "spacing": Object {},
                  "table": undefined,
                  "type": "column",
                },
                "keywords": Object {},
                "label": RefName {
                  "name": "a",
                  "quotes": true,
                },
                "parens": undefined,
                "spacing": Object {
                  "postArrow": " ",
                  "preArrow": " ",
                },
                "type": "labeledExpression",
              },
              SqlLabeledExpression {
                "expression": SqlMulti {
                  "args": SeparatedArray {
                    "separators": Array [
                      Separator {
                        "left": " ",
                        "right": " ",
                        "separator": "+",
                      },
                    ],
                    "values": Array [
                      SqlColumn {
                        "keywords": Object {},
                        "parens": undefined,
                        "refName": RefName {
                          "name": "hello",
                          "quotes": false,
                        },
                        "spacing": Object {},
                        "table": undefined,
                        "type": "column",
                      },
                      SqlLiteral {
                        "keywords": Object {},
                        "parens": undefined,
                        "spacing": Object {},
                        "stringValue": "1",
                        "type": "literal",
                        "value": 1,
                      },
                    ],
                  },
                  "keywords": Object {},
                  "op": "+",
                  "parens": undefined,
                  "spacing": Object {},
                  "type": "multi",
                },
                "keywords": Object {},
                "label": RefName {
                  "name": "b",
                  "quotes": false,
                },
                "parens": undefined,
                "spacing": Object {
                  "postArrow": " ",
                  "preArrow": " ",
                },
                "type": "labeledExpression",
              },
            ],
          },
          "decorator": undefined,
          "extendClause": undefined,
          "functionName": RefName {
            "name": "Foo",
            "quotes": false,
          },
          "keywords": Object {},
          "namespace": undefined,
          "parens": undefined,
          "spacing": Object {
            "postArguments": "
        ",
            "postLeftParen": "
          ",
            "preLeftParen": "",
          },
          "specialParen": undefined,
          "type": "function",
          "whereClause": undefined,
          "windowSpec": undefined,
        }
      `);
    });
  });
});
