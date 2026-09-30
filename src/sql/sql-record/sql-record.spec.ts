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

import type { SqlValues } from '../..';
import { SqlColumn, SqlExpression, SqlLiteral, SqlQuery, SqlRecord } from '../..';
import { backAndForth } from '../../test-utils';

describe('SqlRecord', () => {
  describe('parses', () => {
    it.each([
      `(1, 2)`,
      `( a ,b )`,
      `ROW(1)`,
      `row ( 1 , 'x' )`,
      `x IN (1, 2, 3)`,
      `(a, b) IN ((1, 2), (3, 4))`,
      `VALUES ROW (1, 'x'), (2, 'y')`,
      `SELECT COUNT(*) FROM t GROUP BY GROUPING SETS (a, ( ))`,
    ])('parses: %s', sql => {
      backAndForth(sql);
    });

    it('parses a parenthesized list as a record', () => {
      const record = SqlExpression.parse(`( a ,b )`);
      expect(record).toBeInstanceOf(SqlRecord);
      expect(record).toMatchInlineSnapshot(`
        SqlRecord {
          "expressions": SeparatedArray {
            "separators": Array [
              Separator {
                "left": " ",
                "right": "",
                "separator": ",",
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
          "keywords": Object {
            "row": "",
          },
          "parens": undefined,
          "spacing": Object {
            "postExpressions": " ",
            "postLeftParen": " ",
          },
          "type": "record",
        }
      `);
    });

    it('parses a single value in parens as that value, not a record', () => {
      const ex = SqlExpression.parse(`( a )`);
      expect(ex).toBeInstanceOf(SqlColumn);
      expect(String(ex)).toEqual(`( a )`);
    });

    it('parses a single value with ROW as a record', () => {
      const values = SqlExpression.parse(`VALUES ROW (a)`) as SqlValues;
      const record = values.records.get(0)!;
      expect(record).toBeInstanceOf(SqlRecord);
      expect(record.keywords.row).toEqual('ROW');
      expect(record.spacing.postRow).toEqual(' ');
    });

    it('parses an empty grouping set', () => {
      const query = SqlQuery.parse(`SELECT COUNT(*) FROM t GROUP BY GROUPING SETS (a, ( ))`);
      const record = query.groupByClause!.expressions!.get(1) as SqlRecord;
      expect(record).toBeInstanceOf(SqlRecord);
      expect(record.expressions).toBeUndefined();
      expect(String(record)).toEqual(`( )`);
    });
  });

  describe('.create', () => {
    it('makes a record with no keyword for several values', () => {
      expect(String(SqlRecord.create([SqlLiteral.create(1), SqlColumn.create('x')]))).toEqual(
        `(1, "x")`,
      );
    });

    it('adds ROW for a single value so it is not read as parens', () => {
      expect(String(SqlRecord.create([SqlLiteral.create(1)]))).toEqual(`ROW(1)`);
    });

    it('makes an empty record', () => {
      expect(String(SqlRecord.create())).toEqual(`()`);
      expect(String(SqlRecord.create([]))).toEqual(`()`);
    });

    it('returns an existing record as is', () => {
      const record = SqlRecord.create([SqlLiteral.create(1)]);
      expect(SqlRecord.create(record)).toBe(record);
    });
  });

  describe('.createWithoutKeyword', () => {
    it('never adds ROW', () => {
      expect(String(SqlRecord.createWithoutKeyword([SqlLiteral.create(1)]))).toEqual(`(1)`);
      expect(
        String(SqlRecord.createWithoutKeyword([SqlLiteral.create(1), SqlLiteral.create(2)])),
      ).toEqual(`(1, 2)`);
      expect(String(SqlRecord.createWithoutKeyword())).toEqual(`()`);
    });

    it('returns an existing record as is', () => {
      const record = SqlRecord.create([SqlLiteral.create(1)]);
      expect(SqlRecord.createWithoutKeyword(record)).toBe(record);
    });
  });

  describe('#changeExpressions', () => {
    it('replaces the expressions and keeps the spacing', () => {
      const record = SqlExpression.parse(`( a ,b )`) as SqlRecord;
      expect(String(record.changeExpressions([SqlColumn.optionalQuotes('c')]))).toEqual(`( c )`);
    });

    it('removes the expressions when given nothing', () => {
      const record = SqlExpression.parse(`(a, b)`) as SqlRecord;
      expect(record.changeExpressions([]).expressions).toBeUndefined();
      expect(String(record.changeExpressions([]))).toEqual(`()`);
      expect(String(record.changeExpressions(undefined))).toEqual(`()`);
    });
  });

  describe('#_walkInner', () => {
    it('substitutes inner expressions', () => {
      const record = SqlExpression.parse(`(a, b)`);
      expect(
        String(
          record.walk(ex =>
            ex instanceof SqlColumn && ex.getName() === 'a' ? SqlColumn.optionalQuotes('z') : ex,
          ),
        ),
      ).toEqual(`(z, b)`);
    });

    it('returns the same record when nothing changes', () => {
      const record = SqlExpression.parse(`(a, b)`);
      expect(record.walk(ex => ex)).toBe(record);
      expect(SqlRecord.create().walk(ex => ex)).toEqual(SqlRecord.create());
    });

    it('visits every value in order', () => {
      const seen: string[] = [];
      SqlExpression.parse(`(a, 1, b)`).walkPostorder(ex => {
        seen.push(String(ex));
        return ex;
      });
      expect(seen).toEqual(['a', '1', 'b', '(a, 1, b)']);
    });

    it('stops when the substitutor returns nothing', () => {
      const seen: string[] = [];
      const record = SqlExpression.parse(`(a, b)`);
      const ret = record.walk(ex => {
        seen.push(String(ex));
        if (ex instanceof SqlColumn) return;
        return ex;
      });
      expect(seen).toEqual(['(a, b)', 'a']);
      expect(ret).toBe(record);
    });
  });

  describe('#clearOwnSeparators', () => {
    it('resets the separators to the default', () => {
      const record = SqlExpression.parse(`(a ,b  ,  c)`) as SqlRecord;
      expect(String(record.clearOwnSeparators())).toEqual(`(a, b, c)`);
    });

    it('returns an empty record as is', () => {
      const record = SqlRecord.create();
      expect(record.clearOwnSeparators()).toBe(record);
    });
  });

  describe('#prepend', () => {
    it('adds a value at the start', () => {
      const record = SqlExpression.parse(`(a, b)`) as SqlRecord;
      expect(String(record.prepend(1))).toEqual(`(1, a, b)`);
    });

    it('adds a value to an empty record', () => {
      expect(String(SqlRecord.createWithoutKeyword().prepend(SqlColumn.create('x')))).toEqual(
        `("x")`,
      );
    });
  });

  describe('#append', () => {
    it('adds a value at the end', () => {
      const record = SqlExpression.parse(`(a, b)`) as SqlRecord;
      expect(String(record.append('hi'))).toEqual(`(a, b, 'hi')`);
    });

    it('adds a value to an empty record', () => {
      expect(String(SqlRecord.createWithoutKeyword().append(2))).toEqual(`(2)`);
    });
  });

  describe('#unwrapIfSingleton', () => {
    it('turns a single value record into that value in parens, keeping the spacing', () => {
      const record = SqlRecord.createWithoutKeyword([SqlColumn.optionalQuotes('a')]).changeSpaces({
        postLeftParen: ' ',
        postExpressions: '  ',
      });
      const ex = record.unwrapIfSingleton();
      expect(ex).toBeInstanceOf(SqlColumn);
      expect(String(ex)).toEqual(`( a  )`);
    });

    it('keeps a record with ROW', () => {
      const record = SqlRecord.create([SqlLiteral.create(1)]);
      expect(record.unwrapIfSingleton()).toBe(record);
    });

    it('keeps a record with several or no values', () => {
      const record = SqlExpression.parse(`(a, b)`) as SqlRecord;
      expect(record.unwrapIfSingleton()).toBe(record);
      const empty = SqlRecord.createWithoutKeyword();
      expect(empty.unwrapIfSingleton()).toBe(empty);
    });
  });
});
