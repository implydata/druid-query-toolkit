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

import { sane } from '../../utils';

import { SqlSetStatement } from './sql-set-statement';

describe('SqlSetStatement', () => {
  it('parses nothing with an error', () => {
    expect(() =>
      SqlSetStatement.parseStatementsOnly(sane`
         -- Comment
         sdfsdf
         dsfdsf
         sdfsdf
      `),
    ).toThrow();
  });

  it('parses single statement', () => {
    expect(
      SqlSetStatement.parseStatementsOnly(sane`
        -- Comment
        Set Hello = 1;
        sdfsdf
        dsfdsf
        sdfsdf
      `),
    ).toMatchInlineSnapshot(`
      Object {
        "after": "
      sdfsdf
      dsfdsf
      sdfsdf",
        "before": "-- Comment
      ",
        "statements": SeparatedArray {
          "separators": Array [],
          "values": Array [
            SqlSetStatement {
              "key": RefName {
                "name": "Hello",
                "quotes": false,
              },
              "keywords": Object {
                "set": "Set",
              },
              "parens": undefined,
              "spacing": Object {
                "postKey": " ",
                "postSet": " ",
                "postValue": "",
              },
              "type": "setStatement",
              "value": SqlLiteral {
                "keywords": Object {},
                "parens": undefined,
                "spacing": Object {},
                "stringValue": "1",
                "type": "literal",
                "value": 1,
              },
            },
          ],
        },
      }
    `);
  });

  it('parses multiple statements', () => {
    expect(
      SqlSetStatement.parseStatementsOnly(sane`
        -- Comment
        Set Hello = 1;
        SET "moon" = 'lol';

        SELECT * FROM tbl
        sdfsdf
        dsfdsf
        sdfsdf
      `),
    ).toMatchInlineSnapshot(`
      Object {
        "after": "

      SELECT * FROM tbl
      sdfsdf
      dsfdsf
      sdfsdf",
        "before": "-- Comment
      ",
        "statements": SeparatedArray {
          "separators": Array [
            "
      ",
          ],
          "values": Array [
            SqlSetStatement {
              "key": RefName {
                "name": "Hello",
                "quotes": false,
              },
              "keywords": Object {
                "set": "Set",
              },
              "parens": undefined,
              "spacing": Object {
                "postKey": " ",
                "postSet": " ",
                "postValue": "",
              },
              "type": "setStatement",
              "value": SqlLiteral {
                "keywords": Object {},
                "parens": undefined,
                "spacing": Object {},
                "stringValue": "1",
                "type": "literal",
                "value": 1,
              },
            },
            SqlSetStatement {
              "key": RefName {
                "name": "moon",
                "quotes": true,
              },
              "keywords": Object {
                "set": "SET",
              },
              "parens": undefined,
              "spacing": Object {
                "postKey": " ",
                "postSet": " ",
                "postValue": "",
              },
              "type": "setStatement",
              "value": SqlLiteral {
                "keywords": Object {},
                "parens": undefined,
                "spacing": Object {},
                "stringValue": "'lol'",
                "type": "literal",
                "value": "lol",
              },
            },
          ],
        },
      }
    `);
  });
});
