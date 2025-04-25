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

import { SqlLimitClause, SqlLiteral } from '../../..';

describe('SqlLimitClause', () => {
  describe('.create', () => {
    it('creates a limit clause from a number', () => {
      const limitClause = SqlLimitClause.create(100);

      expect(limitClause).toBeInstanceOf(SqlLimitClause);
      expect(limitClause.toString()).toEqual('LIMIT 100');
    });

    it('creates a limit clause from a SqlLiteral', () => {
      const literal = SqlLiteral.create(50);
      const limitClause = SqlLimitClause.create(literal);

      expect(limitClause.toString()).toEqual('LIMIT 50');
    });
  });

  describe('#changeLimit', () => {
    it('changes the limit value when given a number', () => {
      const limitClause = SqlLimitClause.create(100);

      const newLimitClause = limitClause.changeLimit(200);

      expect(newLimitClause.toString()).toEqual('LIMIT 200');
      expect(newLimitClause).not.toBe(limitClause);
    });

    it('changes the limit value when given a SqlLiteral', () => {
      const limitClause = SqlLimitClause.create(100);

      const literal = SqlLiteral.create(300);
      const newLimitClause = limitClause.changeLimit(literal);

      expect(newLimitClause.toString()).toEqual('LIMIT 300');
    });
  });

  describe('#getLimitValue', () => {
    it('returns the limit value as a number', () => {
      const limitClause = SqlLimitClause.create(123);

      expect(limitClause.getLimitValue()).toBe(123);
    });

    it('returns the correct number when limit was created from a SqlLiteral', () => {
      const literal = SqlLiteral.create(456);
      const limitClause = SqlLimitClause.create(literal);

      expect(limitClause.getLimitValue()).toBe(456);
    });
  });
});
