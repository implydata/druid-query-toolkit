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
import { SqlColumn, SqlExpression, SqlQuery, SqlWhereClause } from '../..';

function where(sql: string): SqlWhereClause {
  return SqlQuery.parse(`SELECT * FROM t ${sql}`).whereClause!;
}

describe('SqlWhereClause', () => {
  describe('parses', () => {
    it('round trips', () => {
      const queries: string[] = [
        'SELECT * FROM t WHERE x = 1',
        'SELECT * FROM t where  x = 1 AND y > 2',
        'SELECT * FROM t WHERE /* c */ (x = 1 OR y = 2)',
        'SELECT * FROM t WHERE\n  x = 1\n  AND y = 2\n  AND z = 3',
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
      const clause = SqlWhereClause.create(SqlExpression.parse('x = 1'));

      expect(clause).toBeInstanceOf(SqlWhereClause);
      expect(clause.toString()).toEqual('WHERE x = 1');
    });

    it('returns an existing clause as is', () => {
      const clause = where('WHERE x = 1');
      expect(SqlWhereClause.create(clause)).toBe(clause);
    });

    it('puts a long AND on its own indented line', () => {
      expect(SqlWhereClause.create(SqlExpression.parse('a = 1 AND b = 2')).toString()).toEqual(
        'WHERE a = 1 AND b = 2',
      );
      expect(
        SqlWhereClause.create(SqlExpression.parse('a = 1 AND b = 2 AND c = 3')).toString(),
      ).toEqual('WHERE\n  a = 1 AND b = 2 AND c = 3');
    });
  });

  describe('.createForFunction', () => {
    it('creates a parenthesized clause for use in a FILTER', () => {
      expect(SqlWhereClause.createForFunction(SqlExpression.parse('x = 1')).toString()).toEqual(
        '(WHERE x = 1)',
      );
    });

    it('wraps an existing clause in parens', () => {
      expect(SqlWhereClause.createForFunction(where('where x = 1')).toString()).toEqual(
        '(where x = 1)',
      );
    });
  });

  describe('#changeExpression', () => {
    it('replaces the expression and keeps the keyword', () => {
      expect(
        where('where x = 1').changeExpression(SqlExpression.parse('y = 2')).toString(),
      ).toEqual('where y = 2');
    });
  });

  describe('#_walkInner', () => {
    it('substitutes inner expressions', () => {
      expect(
        where('WHERE x = 1')
          .walk(ex => (ex instanceof SqlColumn ? SqlColumn.create('y') : ex))
          .toString(),
      ).toEqual('WHERE "y" = 1');
    });

    it('returns the same instance when nothing changes', () => {
      const clause = where('WHERE x = 1');
      expect(clause.walk(ex => ex)).toBe(clause);
    });

    it('stops when the walker returns undefined', () => {
      const clause = where('WHERE x = 1');
      expect(clause.walk(ex => (ex instanceof SqlColumn ? undefined : ex))).toBe(clause);
    });
  });

  describe('#removeColumnFromAnd', () => {
    it('removes the parts of an AND that reference the column', () => {
      expect(where('WHERE x = 1 AND y = 2').removeColumnFromAnd('x')?.toString()).toEqual(
        'WHERE y = 2',
      );
    });

    it('keeps the clause when the column is not referenced', () => {
      expect(where('WHERE x = 1').removeColumnFromAnd('z')?.toString()).toEqual('WHERE x = 1');
    });

    it('returns undefined when nothing is left', () => {
      expect(where('WHERE x = 1').removeColumnFromAnd('x')).toBeUndefined();
    });
  });
});
