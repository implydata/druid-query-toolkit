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
import { SqlColumn, SqlExpression, SqlHavingClause, SqlQuery } from '../..';

function having(sql: string): SqlHavingClause {
  return SqlQuery.parse(`SELECT a, COUNT(*) FROM t GROUP BY a ${sql}`).havingClause!;
}

describe('SqlHavingClause', () => {
  describe('parses', () => {
    it('round trips', () => {
      const queries: string[] = [
        'SELECT a, COUNT(*) FROM t GROUP BY a HAVING x = 1',
        'SELECT a, COUNT(*) FROM t GROUP BY a having  x = 1 AND y > 2',
        'SELECT a, COUNT(*) FROM t GROUP BY a HAVING /* c */ (x = 1 OR y = 2)',
        'SELECT a, COUNT(*) FROM t GROUP BY a HAVING\n  x = 1\n  AND y = 2\n  AND z = 3',
      ];

      for (const sql of queries) {
        try {
          backAndForth(sql, SqlQuery);
        } catch (e) {
          console.log(`Problem with: \`${sql}\``);
          throw e;
        }
      }
    });
  });

  describe('.create', () => {
    it('creates a clause from an expression', () => {
      const clause = SqlHavingClause.create(SqlExpression.parse('x = 1'));

      expect(clause).toBeInstanceOf(SqlHavingClause);
      expect(clause.toString()).toEqual('HAVING x = 1');
    });

    it('returns an existing clause as is', () => {
      const clause = having('HAVING x = 1');
      expect(SqlHavingClause.create(clause)).toBe(clause);
    });

    it('puts a long AND on its own indented line', () => {
      expect(SqlHavingClause.create(SqlExpression.parse('a = 1 AND b = 2')).toString()).toEqual(
        'HAVING a = 1 AND b = 2',
      );
      expect(
        SqlHavingClause.create(SqlExpression.parse('a = 1 AND b = 2 AND c = 3')).toString(),
      ).toEqual('HAVING\n  a = 1 AND b = 2 AND c = 3');
    });
  });

  describe('#changeExpression', () => {
    it('replaces the expression and keeps the keyword', () => {
      expect(
        having('having x = 1').changeExpression(SqlExpression.parse('y = 2')).toString(),
      ).toEqual('having y = 2');
    });
  });

  describe('#_walkInner', () => {
    it('substitutes inner expressions', () => {
      expect(
        having('HAVING x = 1')
          .walk(ex => (ex instanceof SqlColumn ? SqlColumn.create('y') : ex))
          .toString(),
      ).toEqual('HAVING "y" = 1');
    });

    it('returns the same instance when nothing changes', () => {
      const clause = having('HAVING x = 1');
      expect(clause.walk(ex => ex)).toBe(clause);
    });

    it('stops when the walker returns undefined', () => {
      const clause = having('HAVING x = 1');
      expect(clause.walk(ex => (ex instanceof SqlColumn ? undefined : ex))).toBe(clause);
    });
  });

  describe('#removeColumnFromAnd', () => {
    it('removes the parts of an AND that reference the column', () => {
      expect(having('HAVING x = 1 AND y = 2').removeColumnFromAnd('x')?.toString()).toEqual(
        'HAVING y = 2',
      );
    });

    it('keeps the clause when the column is not referenced', () => {
      expect(having('HAVING x = 1').removeColumnFromAnd('z')?.toString()).toEqual('HAVING x = 1');
    });

    it('returns undefined when nothing is left', () => {
      expect(having('HAVING x = 1').removeColumnFromAnd('x')).toBeUndefined();
    });
  });
});
