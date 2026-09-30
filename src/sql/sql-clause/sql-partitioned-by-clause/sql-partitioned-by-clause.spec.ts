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
import { SqlExpression, SqlFunction, SqlLiteral, SqlPartitionedByClause, SqlQuery } from '../..';

describe('SqlPartitionedByClause', () => {
  describe('parses', () => {
    it.each([
      `INSERT INTO t SELECT * FROM x PARTITIONED BY DAY`,
      `INSERT INTO t SELECT * FROM x partitioned  by  hour`,
      `INSERT INTO t SELECT * FROM x PARTITIONED BY ALL`,
      `INSERT INTO t SELECT * FROM x PARTITIONED BY all  time`,
      `INSERT INTO t SELECT * FROM x PARTITIONED BY 'P1D'`,
      `INSERT INTO t SELECT * FROM x PARTITIONED BY TIME_FLOOR(__time, 'PT1H')`,
    ])('does back and forth with %s', sql => {
      backAndForth(sql, SqlQuery);
    });

    it('parses ALL without an expression', () => {
      const clause = SqlQuery.parse(
        `INSERT INTO t SELECT * FROM x PARTITIONED BY ALL TIME`,
      ).partitionedByClause!;

      expect(clause).toBeInstanceOf(SqlPartitionedByClause);
      expect(clause.expression).toBeUndefined();
      expect(clause.keywords.all).toEqual('ALL TIME');
    });

    it('parses a time unit as an expression', () => {
      const clause = SqlQuery.parse(
        `INSERT INTO t SELECT * FROM x PARTITIONED BY DAY`,
      ).partitionedByClause!;

      expect(String(clause.expression)).toEqual('DAY');
    });
  });

  describe('.create', () => {
    it('creates a clause with a unit', () => {
      expect(SqlPartitionedByClause.create(SqlLiteral.create('P1D')).toString()).toEqual(
        `PARTITIONED BY 'P1D'`,
      );
    });

    it('creates an ALL clause without a unit', () => {
      expect(SqlPartitionedByClause.create(undefined).toString()).toEqual(`PARTITIONED BY ALL`);
    });
  });

  describe('#changePartitionedBy', () => {
    it('changes the expression', () => {
      const clause = SqlQuery.parse(
        `INSERT INTO t SELECT * FROM x partitioned by ALL`,
      ).partitionedByClause!;

      expect(
        clause.changePartitionedBy(SqlExpression.parse(`FLOOR(__time TO DAY)`)).toString(),
      ).toEqual(`partitioned by FLOOR(__time TO DAY)`);
    });

    it('goes back to ALL when the expression is removed', () => {
      const clause = SqlQuery.parse(
        `INSERT INTO t SELECT * FROM x PARTITIONED BY DAY`,
      ).partitionedByClause!;

      expect(clause.changePartitionedBy(undefined).toString()).toEqual(`PARTITIONED BY ALL`);
    });
  });

  describe('#_walkInner', () => {
    const clause = SqlPartitionedByClause.create(SqlLiteral.create('P1D'));

    it('returns the same instance when nothing changes', () => {
      expect(clause.walk(ex => ex)).toBe(clause);
    });

    it('substitutes the expression', () => {
      expect(
        clause.walk(ex => (ex instanceof SqlLiteral ? SqlLiteral.create('PT1H') : ex)).toString(),
      ).toEqual(`PARTITIONED BY 'PT1H'`);
    });

    it('stops when the expression walk returns undefined', () => {
      expect(
        clause._walkHelper([], ex => (ex instanceof SqlLiteral ? undefined : ex), false),
      ).toBeUndefined();
    });

    it('walks an ALL clause without visiting an expression', () => {
      const allClause = SqlPartitionedByClause.create(undefined);
      const visited: string[] = [];

      expect(
        allClause.walk(ex => {
          visited.push(ex.type);
          return ex;
        }),
      ).toBe(allClause);
      expect(visited).toEqual(['partitionedByClause']);
    });
  });

  describe('#walk', () => {
    it('is reached when walking a whole query', () => {
      const query = SqlQuery.parse(
        `INSERT INTO t SELECT * FROM x PARTITIONED BY TIME_FLOOR(__time, 'PT1H')`,
      );

      expect(
        query
          .walk(ex =>
            ex instanceof SqlFunction && ex.getEffectiveFunctionName() === 'TIME_FLOOR'
              ? SqlExpression.parse(`TIME_FLOOR(__time, 'P1D')`)
              : ex,
          )
          .toString(),
      ).toEqual(`INSERT INTO t SELECT * FROM x PARTITIONED BY TIME_FLOOR(__time, 'P1D')`);
    });
  });
});
