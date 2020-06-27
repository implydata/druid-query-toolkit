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

import { parseSql, parseSqlQuery } from '.';

describe('Parser', () => {
  it('throws on invalid input', () => {
    expect(() => parseSqlQuery('SELEC +')).toThrowError('Expected');
  });

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
            SqlRef {
              "column": "a",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": false,
              "quotes": false,
              "table": undefined,
              "tableQuotes": false,
              "type": "ref",
            },
            SqlRef {
              "column": "b",
              "innerSpacing": Object {},
              "namespace": undefined,
              "namespaceQuotes": false,
              "quotes": false,
              "table": undefined,
              "tableQuotes": false,
              "type": "ref",
            },
          ],
        },
        "expressionType": "or",
        "innerSpacing": Object {},
        "type": "multi",
      }
    `);
  });

  it('parse queries only', () => {
    expect(() => parseSqlQuery('a OR b')).toThrowErrorMatchingInlineSnapshot(
      `"Provided SQL expression was not a query"`,
    );
  });
});
