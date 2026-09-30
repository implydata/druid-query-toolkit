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
  describe('parses', () => {
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

    it('works with null', () => {
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

    it('works with true', () => {
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

    it('works with false', () => {
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

    it('decimal literal', () => {
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
  });

  describe('does not parse', () => {
    it.each([`__l-1'hello'`, `_-l-1'hello'`])('invalid literal %s should not parse', sql => {
      expect(() => SqlExpression.parse(sql)).toThrow();
    });
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

  describe('.double', () => {
    it('works', () => {
      expect(String(SqlLiteral.double(0))).toEqual('0.0');
      expect(String(SqlLiteral.double(17))).toEqual('17.0');
      expect(String(SqlLiteral.double(17.23))).toEqual('17.23');
    });
  });

  describe('.maybe', () => {
    it('works', () => {
      expect(String(SqlLiteral.maybe(null))).toEqual('NULL');
      expect(String(SqlLiteral.maybe(() => 1))).toEqual('undefined');
    });
  });

  describe('.direct', () => {
    it('works', () => {
      expect(String(SqlLiteral.direct('VARCHAR'))).toEqual('VARCHAR');
      expect(String(SqlLiteral.direct('day'))).toEqual('day');
    });

    it('returns an existing literal as is', () => {
      const literal = SqlLiteral.create('x');

      expect(SqlLiteral.direct(literal)).toBe(literal);
    });
  });

  describe('.index', () => {
    it('turns a zero based index into a one based literal', () => {
      expect(String(SqlLiteral.index(0))).toEqual('1');
      expect(String(SqlLiteral.index(4))).toEqual('5');
    });
  });

  describe('.escapeLiteralString', () => {
    it('quotes and escapes a string', () => {
      expect(SqlLiteral.escapeLiteralString(`it's`)).toEqual(`'it''s'`);
      expect(SqlLiteral.escapeLiteralString(`a\u0001b`)).toEqual(`U&'a\\0001b'`);
    });
  });

  describe('.dateToTimestampValue', () => {
    it('drops the zero parts of the time', () => {
      expect(SqlLiteral.dateToTimestampValue(new Date('2020-01-02T00:00:00Z'))).toEqual(
        '2020-01-02',
      );
      expect(SqlLiteral.dateToTimestampValue(new Date('2020-01-02T03:04:00Z'))).toEqual(
        '2020-01-02 03:04:00',
      );
      expect(SqlLiteral.dateToTimestampValue(new Date('2020-01-02T00:00:00.123Z'))).toEqual(
        '2020-01-02 00:00:00.123',
      );
    });
  });

  describe('.isTrue', () => {
    it('is true only for the TRUE literal', () => {
      expect(SqlLiteral.isTrue(SqlExpression.parse('true'))).toEqual(true);
      expect(SqlLiteral.isTrue(SqlLiteral.FALSE)).toEqual(false);
      expect(SqlLiteral.isTrue(SqlLiteral.create('true'))).toEqual(false);
      expect(SqlLiteral.isTrue(SqlExpression.parse('x'))).toEqual(false);
    });
  });

  describe('._equalsLiteral', () => {
    it('checks for a literal with the given number value', () => {
      expect(SqlLiteral._equalsLiteral(SqlLiteral.create(3), 3)).toEqual(true);
      expect(SqlLiteral._equalsLiteral(SqlLiteral.create(3), 4)).toEqual(false);
      expect(SqlLiteral._equalsLiteral(SqlLiteral.create('3'), 3)).toEqual(false);
      expect(SqlLiteral._equalsLiteral(SqlExpression.parse('x'), 3)).toEqual(false);
    });
  });

  describe('#getEffectiveStringValue', () => {
    it('uses the parsed string value when there is one', () => {
      expect((SqlExpression.parse('1.50') as SqlLiteral).getEffectiveStringValue()).toEqual('1.50');
    });

    it('renders the value when there is no string value', () => {
      expect(SqlLiteral.NULL.getEffectiveStringValue()).toEqual('NULL');
      expect(SqlLiteral.TRUE.getEffectiveStringValue()).toEqual('TRUE');
      expect(SqlLiteral.FALSE.getEffectiveStringValue()).toEqual('FALSE');
      expect(SqlLiteral.create(`a'b`).getEffectiveStringValue()).toEqual(`'a''b'`);
      expect(SqlLiteral.create(new Date('2020-01-02Z')).getEffectiveStringValue()).toEqual(
        `'2020-01-02'`,
      );
      expect(SqlLiteral.create(BigInt(12)).getEffectiveStringValue()).toEqual('12');
    });
  });

  describe('#resetOwnKeywords', () => {
    it('normalizes the casing of NULL and booleans', () => {
      expect(SqlExpression.parse('null').resetOwnKeywords().toString()).toEqual('NULL');
      expect(SqlExpression.parse('True').resetOwnKeywords().toString()).toEqual('TRUE');
      expect(SqlExpression.parse('false').resetOwnKeywords().toString()).toEqual('FALSE');
    });

    it('resets the TIMESTAMP keyword but keeps other string values', () => {
      expect(SqlExpression.parse(`timestamp '2020-01-02'`).resetOwnKeywords().toString()).toEqual(
        `TIMESTAMP '2020-01-02'`,
      );
      expect(SqlExpression.parse('1.50').resetOwnKeywords().toString()).toEqual('1.50');
    });
  });

  describe('#isIndex', () => {
    it('is true for numbers only', () => {
      expect(SqlLiteral.create(2).isIndex()).toEqual(true);
      expect(SqlLiteral.create('2').isIndex()).toEqual(false);
    });
  });

  describe('#getIndexValue', () => {
    it('returns the zero based index', () => {
      expect(SqlLiteral.create(3).getIndexValue()).toEqual(2);
      expect(SqlLiteral.create(3.7).getIndexValue()).toEqual(2);
      expect(SqlLiteral.create('3').getIndexValue()).toEqual(-1);
    });
  });

  describe('#incrementIndex', () => {
    it('increments a numeric literal', () => {
      expect(String(SqlLiteral.create(3).incrementIndex())).toEqual('4');
      expect(String(SqlLiteral.create(3).incrementIndex(-2))).toEqual('1');
      expect(String((SqlExpression.parse('03') as SqlLiteral).incrementIndex())).toEqual('4');
    });

    it('leaves non numeric literals alone', () => {
      const literal = SqlLiteral.create('3');

      expect(literal.incrementIndex()).toBe(literal);
    });
  });

  describe('#prettyTrim', () => {
    it('trims long strings', () => {
      expect(String(SqlLiteral.create('hello world').prettyTrim(8))).toEqual(`'hello...'`);
      expect(String(SqlLiteral.create('hi').prettyTrim(8))).toEqual(`'hi'`);
    });

    it('leaves non string literals alone', () => {
      const literal = SqlLiteral.create(1234567890);

      expect(literal.prettyTrim(3)).toBe(literal);
    });
  });

  describe('#decomposeViaAnd', () => {
    it('drops TRUE and keeps everything else', () => {
      expect(SqlLiteral.TRUE.decomposeViaAnd()).toEqual([]);
      expect(SqlLiteral.FALSE.decomposeViaAnd()).toEqual([SqlLiteral.FALSE]);
    });
  });

  describe('#isInteger', () => {
    it('works', () => {
      expect(SqlLiteral.double(0).isInteger()).toEqual(false);
      expect(SqlLiteral.create(0).isInteger()).toEqual(true);
      expect(SqlLiteral.double(17).isInteger()).toEqual(false);
      expect(SqlLiteral.create(17).isInteger()).toEqual(true);
      expect(SqlLiteral.double(17.23).isInteger()).toEqual(false);
      expect(SqlLiteral.create(17.23).isInteger()).toEqual(false);
      expect((SqlExpression.parse('17.0') as SqlLiteral).isInteger()).toEqual(false);
      expect((SqlExpression.parse('17') as SqlLiteral).isInteger()).toEqual(true);
    });

    it('is true for bigints and false for non numbers', () => {
      expect(SqlLiteral.create(BigInt(5)).isInteger()).toEqual(true);
      expect(SqlLiteral.create('5').isInteger()).toEqual(false);
    });
  });

  describe('#isDate', () => {
    it('is true for dates only', () => {
      expect(SqlLiteral.create(new Date('2020-01-01Z')).isDate()).toEqual(true);
      expect(SqlLiteral.create('2020-01-01').isDate()).toEqual(false);
    });
  });

  describe('#getNumberValue', () => {
    it('returns numbers only', () => {
      expect(SqlLiteral.create(5).getNumberValue()).toEqual(5);
      expect(SqlLiteral.create(BigInt(5)).getNumberValue()).toBeUndefined();
    });
  });

  describe('#getNumberOrBigintValue', () => {
    it('returns numbers and bigints', () => {
      expect(SqlLiteral.create(5).getNumberOrBigintValue()).toEqual(5);
      expect(SqlLiteral.create(BigInt(5)).getNumberOrBigintValue()).toEqual(BigInt(5));
      expect(SqlLiteral.create('5').getNumberOrBigintValue()).toBeUndefined();
    });
  });

  describe('#getStringValue', () => {
    it('returns strings only', () => {
      expect(SqlLiteral.create('5').getStringValue()).toEqual('5');
      expect(SqlLiteral.create(5).getStringValue()).toBeUndefined();
    });
  });

  describe('#getDateValue', () => {
    it('returns dates only', () => {
      const date = new Date('2020-01-01Z');

      expect(SqlLiteral.create(date).getDateValue()).toBe(date);
      expect(SqlLiteral.create('2020-01-01').getDateValue()).toBeUndefined();
    });
  });
});
