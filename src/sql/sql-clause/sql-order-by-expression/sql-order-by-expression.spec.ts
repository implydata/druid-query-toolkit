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

import { backAndForth } from '../../../test-utils';
import { SqlColumn, SqlExpression, SqlOrderByExpression, SqlQuery } from '../..';

function orderBy(sql: string): SqlOrderByExpression {
  return SqlQuery.parse(`SELECT * FROM t ORDER BY ${sql}`).orderByClause!.expressions.first();
}

describe('SqlOrderByExpression', () => {
  describe('parses', () => {
    it('round trips with and without a direction', () => {
      backAndForth('SELECT * FROM t ORDER BY x', SqlQuery);
      backAndForth('SELECT * FROM t ORDER BY x  asc', SqlQuery);
      backAndForth('SELECT * FROM t ORDER BY x /* c */ Desc, 2', SqlQuery);
    });

    it('normalizes the direction', () => {
      expect(orderBy('x desc').direction).toEqual('DESC');
      expect(orderBy('x').direction).toBeUndefined();
    });
  });

  describe('.create', () => {
    it('creates an expression with an optional direction', () => {
      expect(String(SqlOrderByExpression.create(SqlColumn.create('x')))).toEqual('"x"');
      expect(String(SqlOrderByExpression.create(SqlColumn.create('x'), 'DESC'))).toEqual(
        '"x" DESC',
      );
    });

    it('throws on an invalid direction', () => {
      expect(() => SqlOrderByExpression.create(SqlColumn.create('x'), 'UP' as any)).toThrow(
        'invalid direction UP',
      );
    });
  });

  describe('.index', () => {
    it('creates an ordinal expression', () => {
      const ex = SqlOrderByExpression.index(0, 'DESC');

      expect(String(ex)).toEqual('1 DESC');
      expect(ex.isIndex()).toEqual(true);
      expect(ex.getIndexValue()).toEqual(0);
    });
  });

  describe('#changeExpression', () => {
    it('replaces the expression and keeps the direction', () => {
      expect(String(orderBy('x  desc').changeExpression(SqlExpression.parse('y + 1')))).toEqual(
        'y + 1  desc',
      );
    });
  });

  describe('#changeDirection', () => {
    it('changes the direction and resets the keyword', () => {
      expect(String(orderBy('x  desc').changeDirection('ASC'))).toEqual('x  ASC');
    });

    it('removes the direction and the space before it', () => {
      const ex = orderBy('x  desc').changeDirection(undefined);

      expect(String(ex)).toEqual('x');
      expect(ex.direction).toBeUndefined();
    });
  });

  describe('#getEffectiveDirection', () => {
    it('returns the effective direction', () => {
      expect(SqlOrderByExpression.create(SqlColumn.create('x')).getEffectiveDirection()).toEqual(
        'ASC',
      );

      expect(
        SqlOrderByExpression.create(SqlColumn.create('x'), 'ASC').getEffectiveDirection(),
      ).toEqual('ASC');

      expect(
        SqlOrderByExpression.create(SqlColumn.create('x'), 'DESC').getEffectiveDirection(),
      ).toEqual('DESC');
    });
  });

  describe('#reverseDirection', () => {
    it('flips the direction', () => {
      const x = SqlColumn.optionalQuotes('x');

      expect(String(SqlOrderByExpression.create(x, 'DESC').reverseDirection())).toEqual('x ASC');

      expect(String(SqlOrderByExpression.create(x, 'ASC').reverseDirection())).toEqual('x DESC');

      expect(String(SqlOrderByExpression.create(x).reverseDirection())).toEqual('x DESC');
    });
  });

  describe('#_walkInner', () => {
    it('substitutes the inner expression', () => {
      expect(
        String(
          orderBy('x DESC').walk(ex => (ex instanceof SqlColumn ? SqlColumn.create('y') : ex)),
        ),
      ).toEqual('"y" DESC');
    });

    it('returns the same instance when nothing changes', () => {
      const ex = orderBy('x DESC');
      expect(ex.walk(e => e)).toBe(ex);
    });

    it('stops when the walker returns undefined', () => {
      const ex = orderBy('x DESC');
      expect(ex.walk(e => (e instanceof SqlColumn ? undefined : e))).toBe(ex);
    });
  });

  describe('#isIndex', () => {
    it('is true only for ordinal literals', () => {
      expect(orderBy('2').isIndex()).toEqual(true);
      expect(orderBy("'a'").isIndex()).toEqual(false);
      expect(orderBy('x').isIndex()).toEqual(false);
    });
  });

  describe('#getIndexValue', () => {
    it('returns the zero based index', () => {
      expect(orderBy('2 DESC').getIndexValue()).toEqual(1);
    });

    it('returns -1 for a non index expression', () => {
      expect(orderBy('x').getIndexValue()).toEqual(-1);
      expect(orderBy("'a'").getIndexValue()).toEqual(-1);
    });
  });

  describe('#incrementIndex', () => {
    it('increments an ordinal and keeps the direction', () => {
      expect(String(orderBy('2 DESC').incrementIndex())).toEqual('3 DESC');
      expect(String(orderBy('4').incrementIndex(-2))).toEqual('2');
    });

    it('returns the same instance for a non literal expression', () => {
      const ex = orderBy('x');
      expect(ex.incrementIndex()).toBe(ex);
    });

    it('leaves a non index literal alone', () => {
      expect(String(orderBy("'a'").incrementIndex())).toEqual("'a'");
    });
  });
});
