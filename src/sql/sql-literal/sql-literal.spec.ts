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

import { SqlExpression, SqlLiteral } from '../..';
import { backAndForth } from '../../test-utils';

describe('SqlLiteral', () => {
  it.each([
    `NULL`,
    `TRUE`,
    `FALSE`,
    `'lol'`,
    `U&'hello'`,
    `U&'hell''o'`,
    `U&'hell\\\\o'`,
    `_latin1'hello'`,
    `_UTF8'hello'`,
    `_UTF8'hell''o'`,
    `_l-1'hello'`,
    `_8l-1'hello'`,
    `'don''t do it'`,
    `17.0`,
    `123.34`,
    `1606832560494517248`,
  ])('does back and forth with %s', sql => {
    backAndForth(sql, SqlLiteral);
  });

  it.each([`__l-1'hello'`, `_-l-1'hello'`])('invalid literal %s should not parse', sql => {
    expect(() => SqlExpression.parse(sql)).toThrow();
  });

  it('Works with Null', () => {
    const sql = `NULL`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlLiteral {
        "keywords": Object {},
        "parens": undefined,
        "spacing": Object {},
        "stringValue": "NULL",
        "type": "literal",
        "value": null,
      }
    `);
  });

  it('Works with True', () => {
    const sql = `True`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlLiteral {
        "keywords": Object {},
        "parens": undefined,
        "spacing": Object {},
        "stringValue": "True",
        "type": "literal",
        "value": true,
      }
    `);
  });

  it('Works with False', () => {
    const sql = `FalsE`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlLiteral {
        "keywords": Object {},
        "parens": undefined,
        "spacing": Object {},
        "stringValue": "FalsE",
        "type": "literal",
        "value": false,
      }
    `);
  });

  it('string literal', () => {
    const sql = `'don''t go there'`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlLiteral {
        "keywords": Object {},
        "parens": undefined,
        "spacing": Object {},
        "stringValue": "'don''t go there'",
        "type": "literal",
        "value": "don't go there",
      }
    `);
  });

  it.each([
    '0',
    '0.0',
    '0.01',
    '.1',
    '1',
    '01',
    '1.234',
    '+1',
    '-1',
    '5e2',
    '+5e+2',
    '-5E2',
    '-5E02',
    '-5e-2',
  ])('number literal %s parses to correct value', num => {
    backAndForth(num);
    expect((SqlExpression.parse(num) as SqlLiteral).value).toEqual(parseFloat(num));
  });

  it('number literals', () => {
    const sql = `1`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlLiteral {
        "keywords": Object {},
        "parens": undefined,
        "spacing": Object {},
        "stringValue": "1",
        "type": "literal",
        "value": 1,
      }
    `);
  });

  it('number literal with brackets', () => {
    const sql = `(1)`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlLiteral {
        "keywords": Object {},
        "parens": Array [
          Object {
            "leftSpacing": "",
            "rightSpacing": "",
          },
        ],
        "spacing": Object {},
        "stringValue": "1",
        "type": "literal",
        "value": 1,
      }
    `);
  });

  it('string literal with brackets', () => {
    const sql = `('word')`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlLiteral {
        "keywords": Object {},
        "parens": Array [
          Object {
            "leftSpacing": "",
            "rightSpacing": "",
          },
        ],
        "spacing": Object {},
        "stringValue": "'word'",
        "type": "literal",
        "value": "word",
      }
    `);
  });

  it('empty string literal', () => {
    const sql = `''`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlLiteral {
        "keywords": Object {},
        "parens": undefined,
        "spacing": Object {},
        "stringValue": "''",
        "type": "literal",
        "value": "",
      }
    `);
  });

  it('Decimal literal', () => {
    const sql = `1.01`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlLiteral {
        "keywords": Object {},
        "parens": undefined,
        "spacing": Object {},
        "stringValue": "1.01",
        "type": "literal",
        "value": 1.01,
      }
    `);
  });

  it('works with number', () => {
    const sql = `12345`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlLiteral {
        "keywords": Object {},
        "parens": undefined,
        "spacing": Object {},
        "stringValue": "12345",
        "type": "literal",
        "value": 12345,
      }
    `);
  });

  it('works with bigint', () => {
    const sql = `1606832560494517248`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlLiteral {
        "keywords": Object {},
        "parens": undefined,
        "spacing": Object {},
        "stringValue": "1606832560494517248",
        "type": "literal",
        "value": 1606832560494517248n,
      }
    `);
  });

  it('works with string', () => {
    const sql = `'hello'`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlLiteral {
        "keywords": Object {},
        "parens": undefined,
        "spacing": Object {},
        "stringValue": "'hello'",
        "type": "literal",
        "value": "hello",
      }
    `);
  });

  it('works with unicode string 1', () => {
    const sql = `U&'f''o\\00F6\\\\'`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlLiteral {
        "keywords": Object {},
        "parens": undefined,
        "spacing": Object {},
        "stringValue": "U&'f''o\\\\00F6\\\\\\\\'",
        "type": "literal",
        "value": "f'oö\\\\",
      }
    `);
  });

  it('works with unicode string 2', () => {
    const sql = `u&'fo\\00F6\\00F6'`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlLiteral {
        "keywords": Object {},
        "parens": undefined,
        "spacing": Object {},
        "stringValue": "u&'fo\\\\00F6\\\\00F6'",
        "type": "literal",
        "value": "foöö",
      }
    `);
  });

  it('works with timestamp', () => {
    const sql = `TIMESTAMP '2020-02-25 00:00:00'`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlLiteral {
        "keywords": Object {
          "timestamp": "TIMESTAMP",
        },
        "parens": undefined,
        "spacing": Object {
          "postTimestamp": " ",
        },
        "stringValue": "'2020-02-25 00:00:00'",
        "type": "literal",
        "value": 2020-02-25T00:00:00.000Z,
      }
    `);
  });

  it('works with date', () => {
    const sql = `DATE '2020-02-25'`;

    backAndForth(sql);

    expect(SqlExpression.parse(sql)).toMatchInlineSnapshot(`
      SqlLiteral {
        "keywords": Object {
          "timestamp": "DATE",
        },
        "parens": undefined,
        "spacing": Object {
          "postTimestamp": " ",
        },
        "stringValue": "'2020-02-25'",
        "type": "literal",
        "value": 2020-02-25T00:00:00.000Z,
      }
    `);
  });

  describe('.create', () => {
    it('works with things that work', () => {
      expect(String(SqlLiteral.create(null))).toEqual('NULL');
      expect(String(SqlLiteral.create(false))).toEqual('FALSE');
      expect(String(SqlLiteral.create(true))).toEqual('TRUE');
      expect(String(SqlLiteral.create(1.2))).toEqual('1.2');
      expect(String(SqlLiteral.create(BigInt(1606832560494517248)))).toEqual('1606832560494517248');
      expect(String(SqlLiteral.create(`hello`))).toEqual(`'hello'`);
      expect(String(SqlLiteral.create(`he'o`))).toEqual(`'he''o'`);
      expect(String(SqlLiteral.create(`he\ufeffo`))).toEqual(`U&'he\\feffo'`);
      expect(String(SqlLiteral.create(new Date('2020-01-02Z')))).toEqual(`TIMESTAMP '2020-01-02'`);
      expect(String(SqlLiteral.create(new Date('2020-01-02T03:04:05Z')))).toEqual(
        `TIMESTAMP '2020-01-02 03:04:05'`,
      );
    });

    it(`doesn't work with things that don't`, () => {
      expect(() => SqlLiteral.create([1, 2, 3] as any)).toThrow('SqlLiteral invalid object input');

      expect(() => SqlLiteral.create({ lol: 1 } as any)).toThrow('SqlLiteral invalid object input');

      expect(() => SqlLiteral.create((() => 1) as any)).toThrow(
        'SqlLiteral invalid input of type function',
      );

      expect(() => SqlLiteral.create(Infinity)).toThrow(
        'SqlLiteral invalid numeric input Infinity',
      );
      expect(() => SqlLiteral.create(-Infinity)).toThrow(
        'SqlLiteral invalid numeric input -Infinity',
      );
    });
  });

  it('.double', () => {
    expect(String(SqlLiteral.double(0))).toEqual('0.0');
    expect(String(SqlLiteral.double(17))).toEqual('17.0');
    expect(String(SqlLiteral.double(17.23))).toEqual('17.23');
  });

  it('.direct', () => {
    expect(String(SqlLiteral.direct('VARCHAR'))).toEqual('VARCHAR');
    expect(String(SqlLiteral.direct('day'))).toEqual('day');
  });

  it('#isInteger', () => {
    expect(SqlLiteral.double(0).isInteger()).toEqual(false);
    expect(SqlLiteral.create(0).isInteger()).toEqual(true);
    expect(SqlLiteral.double(17).isInteger()).toEqual(false);
    expect(SqlLiteral.create(17).isInteger()).toEqual(true);
    expect(SqlLiteral.double(17.23).isInteger()).toEqual(false);
    expect(SqlLiteral.create(17.23).isInteger()).toEqual(false);
  });

  it('works with maybe', () => {
    expect(String(SqlLiteral.maybe(null))).toEqual('NULL');
    expect(String(SqlLiteral.maybe(() => 1))).toEqual('undefined');
  });
});
