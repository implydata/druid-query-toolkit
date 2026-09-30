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

import { SqlColumn, SqlExpression, SqlWhereClause } from '..';

describe('SqlClause', () => {
  describe('#_walkHelper', () => {
    const whereClause = SqlWhereClause.create(SqlExpression.parse(`x = 1`));

    it('returns the same clause when nothing changes', () => {
      expect(whereClause.walk(ex => ex)).toBe(whereClause);
    });

    it('returns a replacement clause', () => {
      const replacement = SqlWhereClause.create(SqlExpression.parse(`y = 2`));

      const walked = whereClause.walk(ex => (ex instanceof SqlWhereClause ? replacement : ex));

      expect(walked).toBe(replacement);
    });

    it('stops when the substitutor returns undefined', () => {
      expect(whereClause._walkHelper([], () => undefined, false)).toBeUndefined();
      expect(whereClause.walk(() => undefined)).toBe(whereClause);
    });

    it('throws when the clause is replaced by something that is not a clause', () => {
      expect(() =>
        whereClause.walk(ex => (ex instanceof SqlWhereClause ? SqlColumn.create('x') : ex)),
      ).toThrow('must return a sql clause');
    });
  });
});
