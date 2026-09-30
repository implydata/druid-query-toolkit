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
import { SqlColumn, SqlExpression, SqlPipeOperator, SqlWherePipeOperator } from '../..';

describe('SqlPipeOperator', () => {
  describe('#toString', () => {
    it('renders the pipe before the operator', () => {
      expect(SqlWherePipeOperator.create(SqlColumn.create('x')).toString()).toEqual(`|> WHERE "x"`);
    });

    it('keeps the space after the pipe', () => {
      const query = SqlExpression.parse(`FROM t |>   WHERE x`) as SqlPipesQuery;

      expect(query.getLastPipeOperator().toString()).toEqual(`|>   WHERE x`);
    });
  });

  describe('#_walkHelper', () => {
    it('lets a walk replace an operator with another operator', () => {
      const query = SqlExpression.parse(`FROM t |> WHERE x`);

      expect(
        query
          .walk(ex =>
            ex instanceof SqlPipeOperator ? SqlWherePipeOperator.create(SqlColumn.create('y')) : ex,
          )
          .toString(),
      ).toEqual(`FROM t |> WHERE "y"`);
    });

    it('throws when a walk replaces an operator with something else', () => {
      const query = SqlExpression.parse(`FROM t |> WHERE x`);

      expect(() =>
        query.walk(ex => (ex instanceof SqlPipeOperator ? SqlColumn.create('y') : ex)),
      ).toThrow('must return a sql pipe operator');
    });
  });
});
