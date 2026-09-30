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
import type { SqlFunction } from '../..';
import { SqlColumnDeclaration, SqlExpression, SqlExtendClause, SqlQuery, SqlType } from '../..';

describe('SqlExtendClause', () => {
  describe('parses', () => {
    it.each([
      `SELECT * FROM TABLE(extern('{}', '{}')) EXTEND (x VARCHAR, y BIGINT)`,
      `SELECT * FROM TABLE(extern('{}', '{}')) (x VARCHAR)`,
      `SELECT * FROM TABLE(extern('{}', '{}'))  extend  (  x VARCHAR ,y   BIGINT ARRAY  )`,
    ])('does back and forth with %s', sql => {
      backAndForth(sql, SqlQuery);
    });

    it('parses the column declarations', () => {
      const fn = SqlExpression.parse(`TABLE(extern('{}', '{}')) EXTEND (x VARCHAR, y BIGINT)`);
      const extendClause = (fn as SqlFunction).extendClause!;

      expect(extendClause).toBeInstanceOf(SqlExtendClause);
      expect(extendClause.columnDeclarations.values.map(String)).toEqual(['x VARCHAR', 'y BIGINT']);
    });
  });

  describe('.create', () => {
    it('creates a clause from column declarations', () => {
      expect(
        SqlExtendClause.create([
          SqlColumnDeclaration.create('x', 'VARCHAR'),
          SqlColumnDeclaration.create('y', 'BIGINT'),
        ]).toString(),
      ).toEqual(`EXTEND ("x" VARCHAR, "y" BIGINT)`);
    });
  });

  describe('#_walkInner', () => {
    const clause = SqlExtendClause.create([
      SqlColumnDeclaration.create('x', 'VARCHAR'),
      SqlColumnDeclaration.create('y', 'BIGINT'),
    ]);

    it('returns the same instance when nothing changes', () => {
      expect(clause.walk(ex => ex)).toBe(clause);
    });

    it('substitutes inner column declarations', () => {
      expect(
        clause
          .walk(ex =>
            ex instanceof SqlColumnDeclaration && ex.getColumnName() === 'y'
              ? ex.changeColumnType('DOUBLE')
              : ex,
          )
          .toString(),
      ).toEqual(`EXTEND ("x" VARCHAR, "y" DOUBLE)`);
    });

    it('stops when an inner walk returns undefined', () => {
      expect(
        clause._walkHelper([], ex => (ex instanceof SqlType ? undefined : ex), false),
      ).toBeUndefined();
    });
  });

  describe('#changeColumnDeclarations', () => {
    it('replaces the column declarations and keeps the formatting', () => {
      const fn = SqlExpression.parse(
        `TABLE(extern('{}', '{}')) extend ( x VARCHAR )`,
      ) as SqlFunction;

      const changed = fn.extendClause!.changeColumnDeclarations([
        SqlColumnDeclaration.create('a', 'BIGINT'),
        SqlColumnDeclaration.create('b', 'DOUBLE'),
      ]);

      expect(changed.toString()).toEqual(`extend ( "a" BIGINT, "b" DOUBLE )`);
    });
  });
});
