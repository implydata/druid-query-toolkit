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
import { RefName, SqlAsPipeOperator, SqlColumn, SqlExpression } from '../..';
import { backAndForthPipeOperator } from '../../test-utils';

function parseOperator(sql: string): SqlAsPipeOperator {
  return (SqlExpression.parse(`FROM t ${sql}`) as SqlPipesQuery).getLastPipeOperator() as any;
}

describe('SqlAsPipeOperator', () => {
  describe('parses', () => {
    it.each([`|> AS a`, `|> as  "a b"`, `|>AS a`])('does back and forth with %s', sql => {
      backAndForthPipeOperator(sql, SqlAsPipeOperator);
    });
  });

  describe('does not parse', () => {
    it.each([`FROM t |> AS`, `FROM t |> AS a.b`, `FROM t |> AS a (b)`, `FROM t |> AS SELECT`])(
      'rejects %s',
      sql => {
        expect(() => SqlExpression.parse(sql)).toThrow('Expected');
      },
    );
  });

  describe('.create', () => {
    it('works', () => {
      expect(SqlAsPipeOperator.create('a').toString()).toEqual(`|> AS "a"`);
      expect(SqlAsPipeOperator.create('a', false).toString()).toEqual(`|> AS a`);
      expect(SqlAsPipeOperator.create(RefName.alias('b c')).toString()).toEqual(`|> AS "b c"`);
    });
  });

  describe('#getAliasName', () => {
    it('gets the name', () => {
      expect(parseOperator(`|> AS "a b"`).getAliasName()).toEqual('a b');
    });
  });

  describe('#changeAlias', () => {
    it('keeps the keyword spacing', () => {
      expect(parseOperator(`|> as  a`).changeAlias('b', false).toString()).toEqual(`|> as  b`);
    });
  });

  describe('#walk', () => {
    it('has nothing to walk', () => {
      const operator = parseOperator(`|> AS a`);

      expect(operator.walk(ex => (ex instanceof SqlColumn ? undefined : ex))).toBe(operator);
    });
  });
});
