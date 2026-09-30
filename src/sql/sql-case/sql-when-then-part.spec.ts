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

import type { SqlBase, SqlCase } from '..';
import { SqlColumn, SqlExpression, SqlLiteral, SqlWhenThenPart } from '..';

describe('SqlWhenThenPart', () => {
  const a = SqlColumn.optionalQuotes('a');
  const b = SqlColumn.optionalQuotes('b');

  function firstPart(sql: string): SqlWhenThenPart {
    return (SqlExpression.parse(sql) as SqlCase).whenThenParts.first();
  }

  describe('parses', () => {
    it('keeps spacing and keyword casing inside a CASE', () => {
      const part = firstPart(`CASE x when  1,2  Then 'one' END`);
      expect(part).toBeInstanceOf(SqlWhenThenPart);
      expect(part.toString()).toEqual(`when  1,2  Then 'one'`);
      expect(part.keywords).toEqual({ when: 'when', then: 'Then' });
      expect(part.spacing).toEqual({ postWhen: '  ', postWhenExpressions: '  ', postThen: ' ' });
    });
  });

  describe('.create', () => {
    it('accepts a single when expression', () => {
      expect(SqlWhenThenPart.create(a, b).toString()).toEqual('WHEN a THEN b');
    });

    it('accepts an array of when expressions', () => {
      expect(SqlWhenThenPart.create([a, b], 1).toString()).toEqual('WHEN a, b THEN 1');
    });

    it('wraps a literal then value', () => {
      const part = SqlWhenThenPart.create(a, 'yes');
      expect(part.thenExpression).toBeInstanceOf(SqlLiteral);
      expect(part.toString()).toEqual(`WHEN a THEN 'yes'`);
    });
  });

  describe('#valueOf', () => {
    it('includes the when and then expressions', () => {
      const part = SqlWhenThenPart.create(a, b);
      const value = part.valueOf();
      expect(value.type).toEqual('whenThenPart');
      expect(value.whenExpressions).toBe(part.whenExpressions);
      expect(value.thenExpression).toBe(part.thenExpression);
    });
  });

  describe('#changeWhenExpressions', () => {
    it('replaces all when expressions and keeps spacing', () => {
      const part = firstPart(`CASE x WHEN  1 THEN 'one' END`);
      expect(
        part.changeWhenExpressions([SqlLiteral.create(2), SqlLiteral.create(3)]).toString(),
      ).toEqual(`WHEN  2, 3 THEN 'one'`);
    });
  });

  describe('#changeWhenExpression', () => {
    it('replaces the when expressions with a single one', () => {
      expect(SqlWhenThenPart.create([a, b], 1).changeWhenExpression(b).toString()).toEqual(
        'WHEN b THEN 1',
      );
    });
  });

  describe('#changeThenExpression', () => {
    it('replaces the then expression', () => {
      expect(SqlWhenThenPart.create(a, 1).changeThenExpression(b).toString()).toEqual(
        'WHEN a THEN b',
      );
    });
  });

  describe('#_walkInner', () => {
    const part = firstPart(`CASE WHEN a, b THEN c END`);

    it('returns the same instance when nothing changes', () => {
      expect(part.walk(ex => ex)).toBe(part);
    });

    it('substitutes inside the when and then expressions', () => {
      expect(
        part
          .walk(ex => (ex instanceof SqlColumn ? ex.changeName(ex.getName().toUpperCase()) : ex))
          .toString(),
      ).toEqual('WHEN A, B THEN C');
    });

    it('visits when expressions before the then expression', () => {
      const seen: string[] = [];
      part.walk(ex => {
        if (ex instanceof SqlColumn) seen.push(ex.getName());
        return ex;
      });
      expect(seen).toEqual(['a', 'b', 'c']);
    });

    function upperUnless(stopAt: string) {
      return (ex: SqlBase): SqlBase | undefined => {
        if (!(ex instanceof SqlColumn)) return ex;
        if (ex.getName() === stopAt) return;
        return ex.changeName(ex.getName().toUpperCase());
      };
    }

    it('abandons all changes when a when expression aborts the walk', () => {
      expect(part.walk(upperUnless('b'))).toBe(part);
    });

    it('abandons all changes when the then expression aborts the walk', () => {
      expect(part.walk(upperUnless('c'))).toBe(part);
    });
  });
});
