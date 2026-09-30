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

import type { SqlComparison } from '..';
import { SqlBetweenPart, SqlColumn, SqlExpression, SqlLiteral } from '..';

describe('SqlBetweenPart', () => {
  const betweenPartOf = (sql: string) =>
    (SqlExpression.parse(sql) as SqlComparison).rhs as SqlBetweenPart;

  describe('parses', () => {
    it('parses as the rhs of a BETWEEN', () => {
      const part = betweenPartOf(`x BETWEEN  1  and  5`);

      expect(part).toBeInstanceOf(SqlBetweenPart);
      expect(part.symmetric).toBeUndefined();
      expect(part.toString()).toEqual(`1  and  5`);
    });

    it('parses SYMMETRIC', () => {
      const part = betweenPartOf(`x BETWEEN symmetric 5 AND 1`);

      expect(part.symmetric).toEqual(true);
      expect(part.toString()).toEqual(`symmetric 5 AND 1`);
    });
  });

  describe('.create', () => {
    it('creates a part', () => {
      expect(SqlBetweenPart.create(SqlLiteral.create(1), SqlLiteral.create(5)).toString()).toEqual(
        '1 AND 5',
      );
    });
  });

  describe('.symmetric', () => {
    it('creates a symmetric part', () => {
      expect(
        SqlBetweenPart.symmetric(SqlLiteral.create(5), SqlLiteral.create(1)).toString(),
      ).toEqual('SYMMETRIC 5 AND 1');
    });
  });

  describe('#valueOf', () => {
    it('only records symmetric when it is set', () => {
      expect(
        SqlBetweenPart.create(SqlLiteral.create(1), SqlLiteral.create(5)).valueOf(),
      ).not.toHaveProperty('symmetric');
      expect(
        SqlBetweenPart.symmetric(SqlLiteral.create(1), SqlLiteral.create(5)).valueOf(),
      ).toHaveProperty('symmetric', true);
    });
  });

  describe('#changeStart', () => {
    it('replaces the start and keeps the rest', () => {
      expect(
        betweenPartOf(`x BETWEEN SYMMETRIC 1  AND 5`).changeStart(SqlLiteral.create(2)).toString(),
      ).toEqual('SYMMETRIC 2  AND 5');
    });
  });

  describe('#changeEnd', () => {
    it('replaces the end and keeps the rest', () => {
      expect(
        betweenPartOf(`x BETWEEN 1  AND 5`).changeEnd(SqlLiteral.create(6)).toString(),
      ).toEqual('1  AND 6');
    });
  });

  describe('#walk', () => {
    it('substitutes the start and the end', () => {
      expect(
        betweenPartOf(`x BETWEEN a AND b`)
          .walk(ex => (ex instanceof SqlColumn ? SqlLiteral.create(ex.getName()) : ex))
          .toString(),
      ).toEqual(`'a' AND 'b'`);
    });

    it('keeps the same instance when nothing changes', () => {
      const part = betweenPartOf(`x BETWEEN a AND b`);

      expect(part.walk(ex => ex)).toBe(part);
    });

    it('stops when the callback returns nothing for the start or the end', () => {
      const part = betweenPartOf(`x BETWEEN a AND b`);

      const seen: string[] = [];
      part.walk(ex => {
        seen.push(ex.toString());
        return ex instanceof SqlColumn && ex.getName() === 'a' ? undefined : ex;
      });
      expect(seen).toEqual(['a AND b', 'a']);

      expect(
        part.walkPostorder(ex =>
          ex instanceof SqlColumn && ex.getName() === 'b' ? undefined : ex,
        ),
      ).toBe(part);
    });
  });
});
