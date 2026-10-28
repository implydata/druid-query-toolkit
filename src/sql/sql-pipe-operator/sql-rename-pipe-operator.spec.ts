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

import type { SqlPipesQuery } from '../..';
import { SqlAlias, SqlColumn, SqlExpression, SqlRenamePipeOperator } from '../..';
import { backAndForthPipeOperator } from '../../test-utils';

function parseOperator(sql: string): SqlRenamePipeOperator {
  return (SqlExpression.parse(`FROM t ${sql}`) as SqlPipesQuery).getLastPipeOperator() as any;
}

describe('SqlRenamePipeOperator', () => {
  describe('parses', () => {
    it.each([
      `|> RENAME a AS b`,
      `|> RENAME a b`,
      `|> rename  a  as  "b c" ,  d e`,
      `|> RENAME t.a AS b`,
    ])('does back and forth with %s', sql => {
      backAndForthPipeOperator(sql, SqlRenamePipeOperator);
    });

    it('parses each rename as an alias of a column', () => {
      const renames = parseOperator(`|> RENAME a AS b, c d`).renames.values;

      expect(renames.every(rename => rename instanceof SqlAlias)).toEqual(true);
      expect(renames.every(rename => rename.expression instanceof SqlColumn)).toEqual(true);
      expect(renames.map(rename => rename.getAliasName())).toEqual(['b', 'd']);
    });
  });

  describe('does not parse', () => {
    it.each([
      `FROM t |> RENAME`,
      `FROM t |> RENAME a`,
      `FROM t |> RENAME a + 1 AS b`,
      `FROM t |> RENAME a AS b (c)`,
    ])('rejects %s', sql => {
      expect(() => SqlExpression.parse(sql)).toThrow('Expected');
    });
  });

  describe('.create', () => {
    it('works', () => {
      expect(
        SqlRenamePipeOperator.create([
          SqlColumn.create('a').as('b'),
          SqlColumn.optionalQuotes('c').as('d'),
        ]).toString(),
      ).toEqual(`|> RENAME "a" AS "b", c AS "d"`);
    });
  });

  describe('#changeRenames', () => {
    it('replaces the renames', () => {
      expect(
        parseOperator(`|> rename  a AS b`)
          .changeRenames([SqlColumn.optionalQuotes('c').as('d')])
          .toString(),
      ).toEqual(`|> rename  c AS "d"`);
    });
  });

  describe('#getNewNames', () => {
    it('gets the new name of each renamed column', () => {
      expect(parseOperator(`|> RENAME a AS b, t.c d`).getNewNames()).toEqual({ a: 'b', c: 'd' });
    });
  });

  describe('#walk', () => {
    it('walks the renames', () => {
      expect(
        parseOperator(`|> RENAME a AS b`)
          .walk(ex => (ex instanceof SqlColumn ? SqlColumn.optionalQuotes('c') : ex))
          .toString(),
      ).toEqual(`|> RENAME c AS b`);
    });

    it('stops when the substitutor returns undefined', () => {
      const operator = parseOperator(`|> RENAME a AS b`);

      expect(operator.walk(ex => (ex instanceof SqlColumn ? undefined : ex))).toBe(operator);
    });

    it('returns the same operator when nothing changes', () => {
      const operator = parseOperator(`|> RENAME a AS b`);

      expect(operator.walk(ex => ex)).toBe(operator);
    });
  });

  describe('#clearOwnSeparators', () => {
    it('clears the list separators', () => {
      expect(parseOperator(`|> RENAME a b ,c d`).clearOwnSeparators().toString()).toEqual(
        `|> RENAME a b, c d`,
      );
    });
  });
});
