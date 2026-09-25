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

import { SqlAlias } from '..';

import { parse as parseSql } from '.';

describe('Parser', () => {
  it('throws on invalid input', () => {
    expect(() => parseSql('SELEC +')).toThrowError('Expected');
  });

  // The statement rule can consume a leading VALUES / TABLE, so it only commits when it
  // explains the whole input; otherwise these fall back to being read as expressions.
  it.each([`VALUES (1) AS t`, `TABLE foo AS t`, `VALUES (1) AS t (x)`])(
    'reads %s as an expression, not a statement',
    sql => {
      expect(parseSql(sql)).toBeInstanceOf(SqlAlias);
      expect(String(parseSql(sql))).toEqual(sql);
    },
  );

  it('parse anything', () => {
    expect(parseSql('a OR b')).toMatchInlineSnapshot(`
      SqlMulti {
        "args": SeparatedArray {
          "separators": Array [
            Separator {
              "left": " ",
              "right": " ",
              "separator": "OR",
            },
          ],
          "values": Array [
            SqlColumn {
              "keywords": Object {},
              "parens": undefined,
              "refName": RefName {
                "name": "a",
                "quotes": false,
              },
              "spacing": Object {},
              "table": undefined,
              "type": "column",
            },
            SqlColumn {
              "keywords": Object {},
              "parens": undefined,
              "refName": RefName {
                "name": "b",
                "quotes": false,
              },
              "spacing": Object {},
              "table": undefined,
              "type": "column",
            },
          ],
        },
        "keywords": Object {},
        "op": "OR",
        "parens": undefined,
        "spacing": Object {},
        "type": "multi",
      }
    `);
  });
});
