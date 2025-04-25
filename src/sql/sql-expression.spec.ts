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

import { RefName, SqlBase, SqlColumn, SqlExpression, SqlLiteral } from '..';
import { backAndForth, backAndForthPrettify, mapString } from '../test-utils';

describe('SqlExpression', () => {
  it.each([
    '1',
    '1 + 1',
    `CONCAT('a', 'b')`,
    `(Select 1)`,
    `(TIMESTAMP '2019-08-27 18:00:00'<=(t."__time") AND (t."__time")<TIMESTAMP '2019-08-28 00:00:00')`,
    `COALESCE(CASE WHEN (TIMESTAMP '2019-08-27 18:00:00'<=(t."__time") AND (t."__time")<TIMESTAMP '2019-08-28 00:00:00') THEN (t."__time") END, TIME_SHIFT((t."__time"), 'PT6H', 1, 'Etc/UTC'))`,
    `TIME_FLOOR(COALESCE(CASE WHEN (TIMESTAMP '2019-08-27 18:00:00'<=(t."__time") AND (t."__time")<TIMESTAMP '2019-08-28 00:00:00') THEN (t."__time") END, TIME_SHIFT((t."__time"), 'PT6H', 1, 'Etc/UTC')), 'PT5M', NULL, 'Etc/UTC')`,
    't AS x (a, b, "c")',
    `VALUES   (1, 1 + 1),(2, 1 + 1)`,
    `VALUES('Toy' || 'ota', 2, 2+2, CURRENT_TIMESTAMP), ROW('Honda', (SELECT COUNT(*) FROM wikipedia), GREATEST(5, 1), CURRENT_TIMESTAMP - INTERVAL '1' DAY)`,
    `SELECT * FROM (VALUES   (1, 1 + 1),(2, 1 + 1)) t (a, "b")`,
    `SELECT * FROM UNNEST(ARRAY['1','2','3'])`,
    `SELECT * FROM "tbl", UNNEST(DATE_EXPAND(TIMESTAMP_TO_MILLIS(__time), TIMESTAMP_TO_MILLIS(__time), 'PT1S')) as unnested (dt)`,
    `JSON_OBJECT()`,
    `JSON_OBJECT(KEY 'x' VALUE 'y')`,
    `JSON_OBJECT(KEY 'x' VALUE 'y', KEY "z" || '~' VALUE "w" || '~')`,
    `JSON_OBJECT('x': 'y')`,
    `JSON_OBJECT('x': 'y', "z" || '~': "w" || '~')`,
    `JSON_OBJECT(KEY 'x' VALUE 'y', 'z': 'w')`,
  ])('does back and forth with %s', sql => {
    backAndForth(sql, SqlExpression);
  });

  it.each(['1', '1 + 1', `CONCAT('a', 'b')`, `x IN ('Hello World')`])(
    'does back and forth prettify with %s',
    sql => {
      backAndForthPrettify(sql, SqlExpression);
    },
  );

  it.each([`$lol`, `#main.sum($count)`])('plywood expression %s should not parse', sql => {
    expect(() => SqlBase.parseSql(sql)).toThrow();
  });

  describe('factories (static)', () => {
    describe('.and', () => {
      it('throws if invalid arg is fed in', () => {
        expect(() => SqlExpression.and(SqlExpression.parse('c < 10'), 'TRUE' as any)).toThrow(
          'must be a SqlExpression',
        );
      });

      it('works in empty case', () => {
        expect(String(SqlExpression.and())).toEqual('TRUE');
      });

      it('works in single clause case', () => {
        expect(String(SqlExpression.and(SqlExpression.parse('c < 10')))).toEqual('c < 10');
      });

      it('works in general case', () => {
        expect(
          String(
            SqlExpression.and(
              SqlExpression.parse('a OR b'),
              SqlExpression.parse('(c OR d)'),
              SqlExpression.parse('x AND y'),
              SqlExpression.parse('(z AND w)'),
              SqlExpression.parse('n < 10'),
              undefined,
              SqlExpression.parse('TRUE'),
              SqlExpression.parse('NOT k = 1'),
            ),
          ),
        ).toEqual('(a OR b) AND (c OR d) AND x AND y AND (z AND w) AND n < 10 AND NOT k = 1');
      });
    });

    describe('.or', () => {
      it('throws if invalid arg is fed in', () => {
        expect(() => SqlExpression.or(SqlExpression.parse('c < 10'), 'TRUE' as any)).toThrow(
          'must be a SqlExpression',
        );
      });

      it('works in empty case', () => {
        expect(String(SqlExpression.or())).toEqual('FALSE');
      });

      it('works in single clause case', () => {
        expect(String(SqlExpression.or(SqlExpression.parse('c < 10')))).toEqual('c < 10');
      });

      it('works in general case', () => {
        expect(
          String(
            SqlExpression.or(
              SqlExpression.parse('a OR b'),
              SqlExpression.parse('(c OR d)'),
              SqlExpression.parse('x AND y'),
              SqlExpression.parse('(z AND w)'),
              SqlExpression.parse('n < 10'),
              undefined,
              SqlExpression.parse('FALSE'),
              SqlExpression.parse('NOT k = 1'),
            ),
          ),
        ).toEqual('a OR b OR (c OR d) OR (x AND y) OR (z AND w) OR n < 10 OR NOT k = 1');
      });
    });

    describe('.add', () => {
      it('throws if invalid arg is fed in', () => {
        expect(() => SqlExpression.add(SqlLiteral.ONE, 0 as any)).toThrow(
          'must be a SqlExpression',
        );
      });

      it('works in empty case', () => {
        expect(String(SqlExpression.add())).toEqual('0.0');
      });

      it('works in single clause case', () => {
        expect(String(SqlExpression.add(SqlExpression.parse('F(x)')))).toEqual('F(x)');
      });

      it('works in general case', () => {
        expect(
          String(
            SqlExpression.add(
              SqlExpression.parse('F(a)'),
              SqlExpression.parse('b + c'),
              SqlExpression.parse('d - e'),
              SqlExpression.parse('(f + g)'),
              undefined,
              SqlExpression.parse('0'),
              SqlExpression.parse('10'),
            ),
          ),
        ).toEqual('F(a) + b + c + (d - e) + (f + g) + 0 + 10');
      });
    });

    describe('.subtract', () => {
      it('throws if invalid arg is fed in', () => {
        expect(() => SqlExpression.subtract(SqlLiteral.ONE, 0 as any)).toThrow(
          'must be a SqlExpression',
        );
      });

      it('throws error in empty case', () => {
        expect(() => SqlExpression.subtract()).toThrow(
          'first argument to subtract must be defined',
        );
      });

      it('works in single clause case', () => {
        expect(String(SqlExpression.subtract(SqlExpression.parse('F(x)')))).toEqual('F(x)');
      });

      it('works in general case', () => {
        expect(
          String(
            SqlExpression.subtract(
              SqlExpression.parse('F(a)'),
              SqlExpression.parse('b + c'),
              SqlExpression.parse('d - e'),
              SqlExpression.parse('(f + g)'),
              undefined,
              SqlExpression.parse('0'),
              SqlExpression.parse('10'),
            ),
          ),
        ).toEqual('F(a) - b - c - (d - e) - (f + g) - 0 - 10');
      });
    });

    describe('.fromTimeExpressionAndInterval', () => {
      const time = SqlColumn.optionalQuotes('__time');

      it('works for a single interval', () => {
        expect(
          String(
            SqlExpression.fromTimeExpressionAndInterval(
              time,
              '2022-04-30T00:00:00.000Z/2022-05-01T00:00:00.000Z',
            ),
          ),
        ).toEqual("TIMESTAMP '2022-04-30' <= __time AND __time < TIMESTAMP '2022-05-01'");
      });

      it('works for multiple intervals', () => {
        expect(
          String(
            SqlExpression.fromTimeExpressionAndInterval(time, [
              '2022-04-30T00:00:00.000Z/2022-04-30T01:00:00.000Z',
              '2022-04-30T02:00:00.000Z/2022-04-30T03:00:00.000Z',
            ]),
          ),
        ).toEqual(
          "(TIMESTAMP '2022-04-30' <= __time AND __time < TIMESTAMP '2022-04-30 01:00:00') OR (TIMESTAMP '2022-04-30 02:00:00' <= __time AND __time < TIMESTAMP '2022-04-30 03:00:00')",
        );
      });
    });
  });

  describe('factories (methods)', () => {
    const x = SqlColumn.optionalQuotes('x');
    const y = SqlColumn.optionalQuotes('y');

    describe('#as', () => {
      const x = SqlColumn.optionalQuotes('X').as('test');
      const z = SqlColumn.optionalQuotes('Z').as(RefName.create('test', true));

      it('should work with normal string', () => {
        expect(String(x.as('hello'))).toEqual('X AS "hello"');
      });

      it('should preserve quotes', () => {
        expect(String(z.as('hello'))).toEqual('Z AS "hello"');
      });

      it('should work with quotes if needed', () => {
        expect(String(x.as('select'))).toEqual('X AS "select"');
      });

      it('should work with quotes if forced', () => {
        expect(String(x.as('hello', true))).toEqual('X AS "hello"');
      });
    });

    describe('#setAlias', () => {
      const x = SqlColumn.optionalQuotes('X').setAlias('test');
      const z = SqlColumn.optionalQuotes('Z').setAlias(RefName.create('test', true));

      it('should work with normal string', () => {
        expect(String(x.setAlias('hello'))).toEqual('X AS "hello"');
      });

      it('should work with undefined', () => {
        expect(String(x.setAlias(undefined))).toEqual('X');
      });

      it('should preserve quotes', () => {
        expect(String(z.setAlias('hello'))).toEqual('Z AS "hello"');
      });

      it('should work with quotes if needed', () => {
        expect(String(x.setAlias('select'))).toEqual('X AS "select"');
      });

      it('should work with quotes if forced', () => {
        expect(String(x.setAlias('hello', true))).toEqual('X AS "hello"');
      });
    });

    it('#toOrderByExpression', () => {
      expect(String(x.toOrderByExpression('DESC'))).toEqual('x DESC');
    });

    it('#not', () => {
      expect(String(x.not())).toEqual('NOT x');
      expect(String(SqlExpression.parse(`a < b`).not())).toEqual('NOT (a < b)');
      expect(String(SqlExpression.parse(`a OR b`).not())).toEqual('NOT (a OR b)');
      expect(String(SqlExpression.parse(`a AND b`).not())).toEqual('NOT (a AND b)');
    });

    it('#equal', () => {
      expect(String(x.equal(y))).toEqual('x = y');
    });

    it('#unequal', () => {
      expect(String(x.unequal(y))).toEqual('x <> y');
    });

    it('#isNotDistinctFrom', () => {
      expect(String(x.isNotDistinctFrom(y))).toEqual('x IS NOT DISTINCT FROM y');
    });

    it('#isDistinctFrom', () => {
      expect(String(x.isDistinctFrom(y))).toEqual('x IS DISTINCT FROM y');
    });

    it('#lessThan', () => {
      expect(String(x.lessThan(y))).toEqual('x < y');
    });

    it('#greaterThan', () => {
      expect(String(x.greaterThan(y))).toEqual('x > y');
    });

    it('#lessThanOrEqual', () => {
      expect(String(x.lessThanOrEqual(y))).toEqual('x <= y');
    });

    it('#greaterThanOrEqual', () => {
      expect(String(x.greaterThanOrEqual(y))).toEqual('x >= y');
    });

    it('#isNull', () => {
      expect(String(x.isNull())).toEqual('x IS NULL');
    });

    it('#isNotNull', () => {
      expect(String(x.isNotNull())).toEqual('x IS NOT NULL');
    });

    it('#like', () => {
      expect(String(x.like(y))).toEqual('x LIKE y');
      expect(String(x.like(y, '$'))).toEqual("x LIKE y ESCAPE '$'");
    });

    it('#between', () => {
      expect(String(x.between(1, 5))).toEqual('x BETWEEN 1 AND 5');
    });

    it('#notBetween', () => {
      expect(String(x.notBetween(1, 5))).toEqual('x NOT BETWEEN 1 AND 5');
    });

    it('#betweenSymmetric', () => {
      expect(String(x.betweenSymmetric(5, 1))).toEqual('x BETWEEN SYMMETRIC 5 AND 1');
    });

    it('#notBetweenSymmetric', () => {
      expect(String(x.notBetweenSymmetric(5, 1))).toEqual('x NOT BETWEEN SYMMETRIC 5 AND 1');
    });

    it('#and', () => {
      expect(String(x.and(y))).toEqual('x AND y');
    });
  });

  describe('#decomposeViaAnd', () => {
    it('works for TRUE', () => {
      expect(mapString(SqlLiteral.TRUE.decomposeViaAnd())).toEqual([]);
    });

    it('works for FALSE', () => {
      expect(mapString(SqlLiteral.FALSE.decomposeViaAnd())).toEqual(['FALSE']);
    });

    it('works without AND', () => {
      expect(mapString(SqlExpression.parse('a = 1').decomposeViaAnd())).toEqual(['a = 1']);
    });

    it('works with AND', () => {
      expect(mapString(SqlExpression.parse('a AND b And c').decomposeViaAnd())).toEqual([
        'a',
        'b',
        'c',
      ]);

      expect(mapString(SqlExpression.parse('(a AND (b AND c))').decomposeViaAnd())).toEqual([
        'a AND (b AND c)',
      ]);

      expect(
        mapString(
          SqlExpression.parse('(a AND (b AND c))').decomposeViaAnd({ preserveParens: true }),
        ),
      ).toEqual(['(a AND (b AND c))']);

      expect(mapString(SqlExpression.parse('(a AND (b AND c)) And d').decomposeViaAnd())).toEqual([
        'a AND (b AND c)',
        'd',
      ]);
    });

    it('works with nested AND + flatten', () => {
      expect(
        mapString(
          SqlExpression.parse('(a AND (b AND c)) And d').decomposeViaAnd({ flatten: true }),
        ),
      ).toEqual(['a', 'b', 'c', 'd']);
    });

    it('works with query', () => {
      expect(mapString(SqlExpression.parse('SELECT 13').decomposeViaAnd())).toEqual(['SELECT 13']);
    });
  });

  describe('#filterAnd', () => {
    it('works without AND', () => {
      expect(String(SqlExpression.parse('a = 1').filterAnd(ex => ex.toString() !== 'b'))).toEqual(
        'a = 1',
      );

      expect(String(SqlExpression.parse('a = 1').filterAnd(() => false))).toEqual('undefined');
    });

    it('works with AND', () => {
      expect(
        String(SqlExpression.parse('a AND b And c').filterAnd(ex => ex.toString() !== 'b')),
      ).toEqual('a And c');
    });
  });

  describe('extreme', () => {
    it('should work for a huge flat parse', () => {
      const sql = new Array(1000)
        .fill('')
        .map((_, i) => `c_id = "c${i}"`)
        .join(' or ');

      backAndForth(sql);
    });

    it('should work for lots of things in parens (left paren)', () => {
      const sql = new Array(100).fill('').reduce((a, _, i) => `(${a} or c_id = "c${i}")`, 'X');

      backAndForth(sql);
    });

    it('should work for lots of things in parens (right paren)', () => {
      const sql = new Array(100).fill('').reduce((a, _, i) => `(c_id = "c${i}" or ${a})`, 'X');

      backAndForth(sql);
    });
  });

  describe('#fillPlaceholders', () => {
    it('works in basic case', () => {
      expect(
        SqlExpression.parse(`? < ?`)
          .fillPlaceholders([SqlColumn.create('A'), 5])
          .toString(),
      ).toEqual(`"A" < 5`);
    });

    it('works in missing placeholder', () => {
      expect(
        SqlExpression.parse(`? BETWEEN ? AND ?`)
          .fillPlaceholders([SqlColumn.create('A'), 5])
          .toString(),
      ).toEqual(`"A" BETWEEN 5 AND ?`);
    });
  });

  describe('addFilterToAggregations', () => {
    const knownAggregates = ['COUNT', 'SUM', 'MIN'];
    const filter = SqlExpression.parse(`country = 'USA'`);

    it('works in a simple case', () => {
      expect(
        SqlExpression.parse(`SUM(x)`).addFilterToAggregations(filter, knownAggregates).toString(),
      ).toEqual(`SUM(x) FILTER (WHERE country = 'USA')`);
    });

    it('works in a more complex case', () => {
      expect(
        SqlExpression.parse(`SUM(x) + COUNT(*) / MIN(CAST(y AS BIGINT))`)
          .addFilterToAggregations(filter, knownAggregates)
          .toString(),
      ).toEqual(
        `SUM(x) FILTER (WHERE country = 'USA') + COUNT(*) FILTER (WHERE country = 'USA') / MIN(CAST(y AS BIGINT)) FILTER (WHERE country = 'USA')`,
      );
    });

    it('fails if naked reference', () => {
      expect(() => {
        SqlExpression.parse(`x + 1`).addFilterToAggregations(filter, knownAggregates).toString();
      }).toThrow(`column reference outside aggregation`);
    });

    it('works when the function is not known', () => {
      expect(
        SqlExpression.parse(`BLAH(x)`).addFilterToAggregations(filter, knownAggregates).toString(),
      ).toEqual(`BLAH(x) FILTER (WHERE country = 'USA')`);
    });

    it('works when two functions are not known 1', () => {
      expect(
        SqlExpression.parse(`FOO(BAR(x + 1) + CAST(CURRENT_TIMESTAMP AS BIGINT))`)
          .addFilterToAggregations(filter, knownAggregates)
          .toString(),
      ).toEqual(
        `FOO(BAR(x + 1) FILTER (WHERE country = 'USA') + CAST(CURRENT_TIMESTAMP AS BIGINT))`,
      );
    });

    it('works when two functions are not known 2', () => {
      expect(
        SqlExpression.parse(`FOO(BAR(x + 1) + x)`)
          .addFilterToAggregations(filter, knownAggregates)
          .toString(),
      ).toEqual(`FOO(BAR(x + 1) + x) FILTER (WHERE country = 'USA')`);
    });

    it('works in real case 1', () => {
      expect(
        SqlExpression.parse(
          `APPROX_COUNT_DISTINCT_DS_HLL(COALESCE(t."email", t."user", 'api:' || t."id"))`,
        )
          .addFilterToAggregations(filter, ['APPROX_COUNT_DISTINCT_DS_HLL'])
          .toString(),
      ).toEqual(
        `APPROX_COUNT_DISTINCT_DS_HLL(COALESCE(t."email", t."user", 'api:' || t."id")) FILTER (WHERE country = 'USA')`,
      );
    });

    it('works in real case 2', () => {
      expect(
        SqlExpression.parse(
          `APPROX_COUNT_DISTINCT_DS_HLL(COALESCE(t."email", t."user", 'api:' || t."id")) FILTER (WHERE 2 <> 1)`,
        )
          .addFilterToAggregations(filter, knownAggregates)
          .toString(),
      ).toEqual(
        `APPROX_COUNT_DISTINCT_DS_HLL(COALESCE(t."email", t."user", 'api:' || t."id")) FILTER (WHERE 2 <> 1 AND country = 'USA')`,
      );
    });
  });
});
