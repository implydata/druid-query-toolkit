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

import { parseSql } from '../..';
import { backAndForth } from '../../test-utils';

describe('SqlLiteral', () => {
  it('Works with Null', () => {
    const sql = `NULL`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlLiteral {
        "innerSpacing": Object {},
        "quotes": undefined,
        "stringValue": "NULL",
        "type": "literal",
        "value": null,
      }
    `);
  });

  it('Works with True', () => {
    const sql = `True`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlLiteral {
        "innerSpacing": Object {},
        "quotes": undefined,
        "stringValue": "True",
        "type": "literal",
        "value": true,
      }
    `);
  });

  it('Works with False', () => {
    const sql = `FalsE`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlLiteral {
        "innerSpacing": Object {},
        "quotes": undefined,
        "stringValue": "FalsE",
        "type": "literal",
        "value": false,
      }
    `);
  });

  it('string literal', () => {
    const sql = `'word'`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlLiteral {
        "innerSpacing": Object {},
        "quotes": "'",
        "stringValue": "word",
        "type": "literal",
        "value": "word",
      }
    `);
  });

  it('all sorts of number literals', () => {
    backAndForth('0');
    backAndForth('0.0');
    backAndForth('0.01');
    backAndForth('1');
    backAndForth('1.234');
    backAndForth('+1');
    backAndForth('-1');
    backAndForth('5e2');
    backAndForth('+5e+2');
    backAndForth('-5e2');
    backAndForth('-5e-2');
  });

  it('number literals', () => {
    const sql = `1`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlLiteral {
        "innerSpacing": Object {},
        "quotes": undefined,
        "stringValue": "1",
        "type": "literal",
        "value": 1,
      }
    `);
  });

  it('number literal with brackets', () => {
    const sql = `(1)`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlLiteral {
        "innerSpacing": Object {},
        "parens": Array [
          Object {
            "leftSpacing": "",
            "rightSpacing": "",
          },
        ],
        "quotes": undefined,
        "stringValue": "1",
        "type": "literal",
        "value": 1,
      }
    `);
  });

  it('string literal with brackets', () => {
    const sql = `('word')`;

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
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

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
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

    backAndForth(sql);

    expect(parseSql(sql)).toMatchInlineSnapshot(`
      SqlLiteral {
        "innerSpacing": Object {},
        "quotes": undefined,
        "stringValue": "1.01",
        "type": "literal",
        "value": 1.01,
      }
    `);
  });
});
