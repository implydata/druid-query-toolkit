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
import { SeparatedArray, SqlQuery, SqlTable, SqlWithClause, SqlWithPart } from '../..';

function withClause(sql: string): SqlWithClause {
  return SqlQuery.parse(`${sql} SELECT * FROM t`).withClause!;
}

describe('SqlWithClause', () => {
  describe('parses', () => {
    it('round trips', () => {
      const queries: string[] = [
        'WITH t AS (SELECT 1) SELECT * FROM t',
        'with  t AS (SELECT 1) SELECT * FROM t',
        'WITH\nt AS (SELECT 1),\nu AS (SELECT 2)\nSELECT * FROM t',
        'WITH t AS (SELECT 1) ,u AS (SELECT 2) SELECT * FROM t',
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
    const t = SqlWithPart.simple('t', SqlQuery.parse('SELECT 1'));
    const u = SqlWithPart.simple('u', SqlQuery.parse('SELECT 2'));

    it('puts a single part on the same line', () => {
      expect(SqlWithClause.create([t]).toString()).toEqual('WITH "t" AS (SELECT 1)');
    });

    it('puts several parts on their own lines', () => {
      expect(SqlWithClause.create(SeparatedArray.fromArray([t, u])).toString()).toEqual(
        'WITH\n"t" AS (SELECT 1),\n"u" AS (SELECT 2)',
      );
    });
  });

  describe('#changeWithParts', () => {
    it('replaces the parts and keeps the keyword', () => {
      expect(
        withClause('with t AS (SELECT 1)')
          .changeWithParts([SqlWithPart.simple('v', SqlQuery.parse('SELECT 3'))])
          .toString(),
      ).toEqual('with "v" AS (SELECT 3)');
    });
  });

  describe('#_walkInner', () => {
    it('walks into every part', () => {
      expect(
        withClause('WITH t AS (SELECT * FROM a), u AS (SELECT * FROM b)')
          .walk(ex => (ex instanceof SqlTable ? SqlTable.create('c') : ex))
          .toString(),
      ).toEqual('WITH t AS (SELECT * FROM "c"), u AS (SELECT * FROM "c")');
    });

    it('returns the same instance when nothing changes', () => {
      const clause = withClause('WITH t AS (SELECT * FROM a)');
      expect(clause.walk(ex => ex)).toBe(clause);
    });

    it('stops when the walker returns undefined', () => {
      const clause = withClause('WITH t AS (SELECT * FROM a)');
      expect(clause.walk(ex => (ex instanceof SqlTable ? undefined : ex))).toBe(clause);
    });
  });

  describe('#clearOwnSeparators', () => {
    it('resets the separators between parts', () => {
      expect(
        withClause('WITH t AS (SELECT 1) ,u AS (SELECT 2)').clearOwnSeparators().toString(),
      ).toEqual('WITH t AS (SELECT 1),\nu AS (SELECT 2)');
    });
  });
});
