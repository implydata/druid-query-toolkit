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

import { SqlBase, SqlExpression, SqlRef } from '../..';

describe('SqlExpression', () => {
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
      expect(String(x.as('lol'))).toEqual('x AS "lol"');
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
});
