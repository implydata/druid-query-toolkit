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

import { SqlBase, SqlExpression, SqlRef } from '..';
import { backAndForth } from '../test-utils';

describe('SqlExpression', () => {
  it('things that work', () => {
    const queries: string[] = [
      '1',
      '1 + 1',
      `CONCAT('a', 'b')`,
      `(Select 1)`,
      `(TIMESTAMP '2019-08-27 18:00:00'<=(t."__time") AND (t."__time")<TIMESTAMP '2019-08-28 00:00:00')`,
      `COALESCE(CASE WHEN (TIMESTAMP '2019-08-27 18:00:00'<=(t."__time") AND (t."__time")<TIMESTAMP '2019-08-28 00:00:00') THEN (t."__time") END, TIME_SHIFT((t."__time"), 'PT6H', 1, 'Etc/UTC'))`,
      `TIME_FLOOR(COALESCE(CASE WHEN (TIMESTAMP '2019-08-27 18:00:00'<=(t."__time") AND (t."__time")<TIMESTAMP '2019-08-28 00:00:00') THEN (t."__time") END, TIME_SHIFT((t."__time"), 'PT6H', 1, 'Etc/UTC')), 'PT5M', NULL, 'Etc/UTC')`,
    ];

    for (const sql of queries) {
      try {
        backAndForth(sql);
      } catch (e) {
        console.log(`Problem with: \`${sql}\``);
        throw e;
      }
    }
  });

  it('plywood expressions should not parse', () => {
    const queries: string[] = [`$lol`, `#main.sum($count)`];

    for (const sql of queries) {
      let didNotError = false;
      try {
        SqlBase.parseSql(sql);
        didNotError = true;
      } catch {}
      if (didNotError) {
        throw new Error(`should not parse: ${sql}`);
      }
    }
  });

  describe('factories', () => {
    const x = SqlRef.column('x');
    const y = SqlRef.column('y');

    it('works with as', () => {
      expect(String(x.as('lol'))).toEqual('x AS lol');
    });

    it('works with toOrderByPart', () => {
      expect(String(x.toOrderByPart('DESC'))).toEqual('x DESC');
    });

    it('works with equal', () => {
      expect(String(x.equal(y))).toEqual('x = y');
    });

    it('works with unequal', () => {
      expect(String(x.unequal(y))).toEqual('x <> y');
    });

    it('works with lessThan', () => {
      expect(String(x.lessThan(y))).toEqual('x < y');
    });

    it('works with greaterThan', () => {
      expect(String(x.greaterThan(y))).toEqual('x > y');
    });

    it('works with lessThanOrEqual', () => {
      expect(String(x.lessThanOrEqual(y))).toEqual('x <= y');
    });

    it('works with greaterThanOrEqual', () => {
      expect(String(x.greaterThanOrEqual(y))).toEqual('x >= y');
    });

    it('works with isNull', () => {
      expect(String(x.isNull())).toEqual('x IS NULL');
    });

    it('works with isNotNull', () => {
      expect(String(x.isNotNull())).toEqual('x IS NOT NULL');
    });

    it('works with like', () => {
      expect(String(x.like(y))).toEqual('x LIKE y');
      expect(String(x.like(y, '$'))).toEqual("x LIKE y ESCAPE '$'");
    });

    it('works with between', () => {
      expect(String(x.between(1, 5))).toEqual('x BETWEEN 1 AND 5');
    });

    it('works with notBetween', () => {
      expect(String(x.notBetween(1, 5))).toEqual('x NOT BETWEEN 1 AND 5');
    });

    it('works with betweenSymmetric', () => {
      expect(String(x.betweenSymmetric(5, 1))).toEqual('x BETWEEN SYMMETRIC 5 AND 1');
    });

    it('works with notBetweenSymmetric', () => {
      expect(String(x.notBetweenSymmetric(5, 1))).toEqual('x NOT BETWEEN SYMMETRIC 5 AND 1');
    });

    it('works with and', () => {
      expect(String(x.and(y))).toEqual('x AND y');
    });
  });

  describe('#decomposeViaAnd', () => {
    it('works without AND', () => {
      expect(String(SqlExpression.parse('a = 1').decomposeViaAnd())).toEqual('a = 1');
    });

    it('works with AND', () => {
      expect(String(SqlExpression.parse('a AND b And c').decomposeViaAnd())).toEqual('a,b,c');
    });

    it('works with nested AND', () => {
      expect(String(SqlExpression.parse('(a AND (b AND c)) And d').decomposeViaAnd())).toEqual(
        'a,b,c,d',
      );
    });

    it('works with query', () => {
      expect(String(SqlExpression.parse('SELECT 13').decomposeViaAnd())).toEqual('SELECT 13');
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
