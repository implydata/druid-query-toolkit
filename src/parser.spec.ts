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

import { sqlParserFactory } from './parser/druidsql';
import { FUNCTIONS } from './test-utils';

const parser = sqlParserFactory(FUNCTIONS);

describe('Parser', () => {
  describe('ref', () => {
    it('quotes', () => {
      const sql = `"page"`;

      expect(parser(sql)).toMatchInlineSnapshot(`
        SqlRef {
          "column": "page",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "\\"",
          "table": undefined,
          "tableQuotes": undefined,
          "type": "ref",
        }
      `);
    });

    it('without quotes', () => {
      const sql = `channel`;

      expect(parser(sql)).toMatchInlineSnapshot(`
        SqlRef {
          "column": "channel",
          "innerSpacing": Object {},
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "table": undefined,
          "tableQuotes": undefined,
          "type": "ref",
        }
      `);
    });

    it('without quotes + namespace', () => {
      const sql = `"lol" . channel`;

      expect(parser(sql)).toMatchInlineSnapshot(`
        SqlRef {
          "column": "channel",
          "innerSpacing": Object {
            "postTableDot": " ",
            "preTableDot": " ",
          },
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "table": "lol",
          "tableQuotes": "\\"",
          "type": "ref",
        }
      `);
    });

    it('without quotes + namespace + parens', () => {
      const sql = `(( "lol" . channel)   )`;

      expect(parser(sql)).toMatchInlineSnapshot(`
        SqlRef {
          "column": "channel",
          "innerSpacing": Object {
            "postTableDot": " ",
            "preTableDot": " ",
          },
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "parens": Array [
            Object {
              "leftSpacing": " ",
              "rightSpacing": "",
            },
            Object {
              "leftSpacing": "",
              "rightSpacing": "   ",
            },
          ],
          "quotes": "",
          "table": "lol",
          "tableQuotes": "\\"",
          "type": "ref",
        }
      `);
      expect(parser(sql).toRawString()).toMatchInlineSnapshot(`"\\"lol\\" . channel"`);
    });
  });

  describe('literal', () => {
    it('works with number', () => {
      const sql = `12345`;

      expect(parser(sql)).toMatchInlineSnapshot(`
        SqlLiteral {
          "innerSpacing": Object {},
          "quotes": "",
          "stringValue": "12345",
          "type": "literal",
          "value": 12345,
        }
      `);
    });

    it('works with string', () => {
      const sql = `'hello'`;

      expect(parser(sql)).toMatchInlineSnapshot(`
        SqlLiteral {
          "innerSpacing": Object {},
          "quotes": "'",
          "stringValue": "hello",
          "type": "literal",
          "value": "hello",
        }
      `);
    });
  });

  /*

  it('without quotes + namespace', () => {
    const sql = `"lol" . channel`;

    expect(parser(sql)).toMatchInlineSnapshot();
  });

   */
});
