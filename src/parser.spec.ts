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

const parser = sqlParserFactory();

describe('Parser', () => {
  describe('ref', () => {
    it('quotes', () => {
      const sql = `"page"`;

      expect(parser(sql)).toMatchInlineSnapshot(`
        SqlRef {
          "innerSpacing": Object {},
          "name": "page",
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "\\"",
          "type": "ref",
        }
      `);
    });

    it('without quotes', () => {
      const sql = `channel`;

      expect(parser(sql)).toMatchInlineSnapshot(`
        SqlRef {
          "innerSpacing": Object {},
          "name": "channel",
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "",
          "type": "ref",
        }
      `);
    });

    it('without quotes + namespace', () => {
      const sql = `"lol" . channel`;

      expect(parser(sql)).toMatchInlineSnapshot(`
        SqlRef {
          "innerSpacing": Object {
            "postDot": " ",
            "preDot": " ",
          },
          "name": "channel",
          "namespace": "lol",
          "namespaceQuotes": "\\"",
          "quotes": "",
          "type": "ref",
        }
      `);
    });

    it('without quotes + namespace + parens', () => {
      const sql = `(( "lol" . channel)   )`;

      expect(parser(sql)).toMatchInlineSnapshot(`
        SqlRef {
          "innerSpacing": Object {
            "postDot": " ",
            "preDot": " ",
          },
          "name": undefined,
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
          "quotes": undefined,
          "type": "ref",
        }
      `);
    });
  });

  describe('literal', () => {
    it('works with number', () => {
      const sql = `12345`;

      expect(parser(sql)).toMatchInlineSnapshot(`
        SqlLiteral {
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