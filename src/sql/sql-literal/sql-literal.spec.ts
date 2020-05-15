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

import { sqlParserFactory } from '../..';
import { FUNCTIONS } from '../../test-utils';

const parser = sqlParserFactory(FUNCTIONS);

describe('literal', () => {
  it('string literal', () => {
    const sql = `'word'`;

    expect(parser(sql).toString()).toMatchInlineSnapshot(`"'word'"`);
    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlLiteral {
        "innerSpacing": Object {},
        "quotes": "'",
        "stringValue": "word",
        "type": "literal",
        "value": "word",
      }
    `);
  });

  it('number literal', () => {
    const sql = `1`;

    expect(parser(sql).toString()).toMatchInlineSnapshot(`"1"`);
    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlLiteral {
        "innerSpacing": Object {},
        "quotes": "",
        "stringValue": "1",
        "type": "literal",
        "value": 1,
      }
    `);
  });

  it('number literal with brackets', () => {
    const sql = `(1)`;

    expect(parser(sql).toString()).toMatchInlineSnapshot(`"(1)"`);
    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlLiteral {
        "innerSpacing": Object {},
        "parens": Array [
          Object {
            "leftSpacing": "",
            "rightSpacing": "",
          },
        ],
        "quotes": "",
        "stringValue": "1",
        "type": "literal",
        "value": 1,
      }
    `);
  });
  it('string literal with brackets', () => {
    const sql = `('word')`;

    expect(parser(sql).toString()).toMatchInlineSnapshot(`"('word')"`);
    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlLiteral {
        "innerSpacing": Object {},
        "parens": Array [
          Object {
            "leftSpacing": "",
            "rightSpacing": "",
          },
        ],
        "quotes": "'",
        "stringValue": "word",
        "type": "literal",
        "value": "word",
      }
    `);
  });
  it('empty literal', () => {
    const sql = `''`;

    expect(parser(sql).toString()).toMatchInlineSnapshot(`"''"`);
    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlLiteral {
        "innerSpacing": Object {},
        "quotes": "'",
        "stringValue": "",
        "type": "literal",
        "value": "",
      }
    `);
  });

  it('Decimal literal', () => {
    const sql = `1.01`;

    expect(parser(sql).toString()).toMatchInlineSnapshot(`"1.01"`);
    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlLiteral {
        "innerSpacing": Object {},
        "quotes": "",
        "stringValue": "1.01",
        "type": "literal",
        "value": 1.01,
      }
    `);
  });
  it(' Null', () => {
    const sql = `NULL`;

    expect(parser(sql).toString()).toMatchInlineSnapshot(`"NULL"`);
    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlLiteral {
        "innerSpacing": Object {},
        "quotes": "",
        "stringValue": "NULL",
        "type": "literal",
        "value": "NULL",
      }
    `);
  });
});
