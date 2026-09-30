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
import { sane } from '../../../utils';
import { SeparatedArray, SqlClusteredByClause, SqlColumn, SqlLiteral, SqlQuery } from '../..';

describe('SqlClusteredByClause', () => {
  describe('parses', () => {
    it.each([
      `INSERT INTO t SELECT * FROM x PARTITIONED BY DAY CLUSTERED BY a`,
      `INSERT INTO t SELECT * FROM x PARTITIONED BY DAY clustered   by a ,  2, LOWER(b)`,
      `INSERT INTO t SELECT * FROM x PARTITIONED BY DAY CLUSTERED /* c */ BY a`,
    ])('does back and forth with %s', sql => {
      backAndForth(sql, SqlQuery);
    });

    it('parses the expressions', () => {
      const clause = SqlQuery.parse(
        `INSERT INTO t SELECT * FROM x PARTITIONED BY DAY CLUSTERED BY a, 2`,
      ).clusteredByClause!;

      expect(clause).toBeInstanceOf(SqlClusteredByClause);
      expect(clause.toArray().map(String)).toEqual(['a', '2']);
    });
  });

  describe('.create', () => {
    it('creates a clause from an array of expressions', () => {
      expect(
        SqlClusteredByClause.create([SqlColumn.create('a'), SqlLiteral.index(1)]).toString(),
      ).toEqual(`CLUSTERED BY "a", 2`);
    });

    it('creates a clause from a separated array', () => {
      expect(
        SqlClusteredByClause.create(
          SeparatedArray.fromSingleValue(SqlColumn.create('a')),
        ).toString(),
      ).toEqual(`CLUSTERED BY "a"`);
    });
  });

  describe('#changeExpressions', () => {
    it('replaces the expressions and keeps the keyword', () => {
      const clause = SqlQuery.parse(
        `INSERT INTO t SELECT * FROM x PARTITIONED BY DAY clustered by a`,
      ).clusteredByClause!;

      const changed = clause.changeExpressions([SqlColumn.create('b'), SqlColumn.create('c')]);

      expect(changed.toString()).toEqual(`clustered by "b", "c"`);
      expect(clause.toString()).toEqual(`clustered by a`);
    });
  });

  describe('#addExpression', () => {
    const clause = SqlClusteredByClause.create([SqlColumn.create('a')]);

    it('adds to the end by default', () => {
      expect(clause.addExpression(SqlColumn.create('b')).toString()).toEqual(
        `CLUSTERED BY "a", "b"`,
      );
    });

    it('adds to the start', () => {
      expect(clause.addExpression(SqlColumn.create('b'), 'start').toString()).toEqual(
        `CLUSTERED BY "b", "a"`,
      );
    });
  });

  describe('#_walkInner', () => {
    const clause = SqlClusteredByClause.create([SqlColumn.create('a'), SqlColumn.create('b')]);

    it('returns the same instance when nothing changes', () => {
      expect(clause.walk(ex => ex)).toBe(clause);
    });

    it('substitutes inner expressions', () => {
      expect(
        clause
          .walk(ex =>
            ex instanceof SqlColumn && ex.getName() === 'b' ? SqlColumn.create('z') : ex,
          )
          .toString(),
      ).toEqual(`CLUSTERED BY "a", "z"`);
    });

    it('stops when an inner expression walk returns undefined', () => {
      expect(
        clause._walkHelper([], ex => (ex instanceof SqlColumn ? undefined : ex), false),
      ).toBeUndefined();
    });
  });

  describe('#clearOwnSeparators', () => {
    it('resets the separators between expressions', () => {
      const clause = SqlQuery.parse(
        `INSERT INTO t SELECT * FROM x PARTITIONED BY DAY CLUSTERED BY a  ,b`,
      ).clusteredByClause!;

      expect(clause.clearOwnSeparators().toString()).toEqual(`CLUSTERED BY a, b`);
    });
  });

  describe('#toArray', () => {
    it('returns the expressions', () => {
      const a = SqlColumn.create('a');
      const b = SqlColumn.create('b');

      expect(SqlClusteredByClause.create([a, b]).toArray()).toEqual([a, b]);
    });
  });

  describe('#shiftIndexes', () => {
    const sql = SqlQuery.parse(sane`
      SELECT
        COUNT(*) AS "Count",
        isAnonymous,
        cityName,
        flags,
        SUM(added) AS "sum_added"
      FROM wikipedia
      CLUSTERED BY 2, 3, 4
    `);

    it('works', () => {
      expect(sql.clusteredByClause!.shiftIndexes(0).toString()).toEqual(`CLUSTERED BY 3, 4, 5`);
      expect(sql.clusteredByClause!.shiftIndexes(1).toString()).toEqual(`CLUSTERED BY 3, 4, 5`);
      expect(sql.clusteredByClause!.shiftIndexes(2).toString()).toEqual(`CLUSTERED BY 2, 4, 5`);
      expect(sql.clusteredByClause!.shiftIndexes(3).toString()).toEqual(`CLUSTERED BY 2, 3, 5`);
      expect(sql.clusteredByClause!.shiftIndexes(4).toString()).toEqual(`CLUSTERED BY 2, 3, 4`);
      expect(sql.clusteredByClause!.shiftIndexes(5).toString()).toEqual(`CLUSTERED BY 2, 3, 4`);
    });

    it('leaves expressions that are not indexes alone', () => {
      const clause = SqlClusteredByClause.create([
        SqlColumn.create('a'),
        SqlLiteral.create('x'),
        SqlLiteral.index(0),
      ]);

      expect(clause.shiftIndexes(0).toString()).toEqual(`CLUSTERED BY "a", 'x', 2`);
    });
  });
});
