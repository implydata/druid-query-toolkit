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

import { SqlLiteral, SqlOffsetClause, SqlQuery } from '../../..';
import { backAndForth } from '../../../test-utils';

describe('SqlOffsetClause', () => {
  describe('parses', () => {
    it('round trips', () => {
      backAndForth('SELECT * FROM t LIMIT 10 OFFSET 5', SqlQuery);
      backAndForth('SELECT * FROM t OFFSET 5', SqlQuery);
      backAndForth('SELECT * FROM t LIMIT 10 offset  /* c */ 5', SqlQuery);
    });

    it('parses the offset value', () => {
      expect(SqlQuery.parse('SELECT * FROM t OFFSET 7').offsetClause!.getOffsetValue()).toEqual(7);
    });
  });

  describe('.create', () => {
    it('creates an offset clause from a number', () => {
      const offsetClause = SqlOffsetClause.create(100);

      expect(offsetClause).toBeInstanceOf(SqlOffsetClause);
      expect(offsetClause.toString()).toEqual('OFFSET 100');
    });

    it('creates an offset clause from a SqlLiteral', () => {
      expect(SqlOffsetClause.create(SqlLiteral.create(50)).toString()).toEqual('OFFSET 50');
    });
  });

  describe('#changeOffset', () => {
    it('changes the offset and keeps the keyword', () => {
      const offsetClause = SqlQuery.parse('SELECT * FROM t offset 5').offsetClause!;

      const newOffsetClause = offsetClause.changeOffset(20);

      expect(newOffsetClause.toString()).toEqual('offset 20');
      expect(newOffsetClause).not.toBe(offsetClause);
    });

    it('accepts a SqlLiteral', () => {
      expect(SqlOffsetClause.create(1).changeOffset(SqlLiteral.create(3)).toString()).toEqual(
        'OFFSET 3',
      );
    });
  });

  describe('#_walkInner', () => {
    const offsetClause = SqlQuery.parse('SELECT * FROM t OFFSET 5').offsetClause!;

    it('substitutes the offset literal', () => {
      expect(
        offsetClause.walk(ex => (ex instanceof SqlLiteral ? SqlLiteral.create(8) : ex)).toString(),
      ).toEqual('OFFSET 8');
    });

    it('returns the same instance when nothing changes', () => {
      expect(offsetClause.walk(ex => ex)).toBe(offsetClause);
    });

    it('stops when the walker returns undefined', () => {
      expect(offsetClause.walk(ex => (ex instanceof SqlLiteral ? undefined : ex))).toBe(
        offsetClause,
      );
    });
  });

  describe('#getOffsetValue', () => {
    it('returns the offset as a number', () => {
      expect(SqlOffsetClause.create(42).getOffsetValue()).toEqual(42);
    });
  });
});
