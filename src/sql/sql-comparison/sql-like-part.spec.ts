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
import { SqlColumn, SqlExpression, SqlLikePart, SqlLiteral } from '..';

describe('SqlLikePart', () => {
  const likePartOf = (sql: string) =>
    (SqlExpression.parse(sql) as SqlComparison).rhs as SqlLikePart;

  describe('parses', () => {
    it('parses as the rhs of a LIKE with ESCAPE', () => {
      const part = likePartOf(`x LIKE 'a!%%'  escape  '!'`);

      expect(part).toBeInstanceOf(SqlLikePart);
      expect(part.toString()).toEqual(`'a!%%'  escape  '!'`);
    });
  });

  describe('.create', () => {
    it('wraps strings in literals', () => {
      const part = SqlLikePart.create('a!%%', '!');

      expect(part.like).toBeInstanceOf(SqlLiteral);
      expect(part.escape).toBeInstanceOf(SqlLiteral);
      expect(part.toString()).toEqual(`'a!%%' ESCAPE '!'`);
    });

    it('accepts expressions', () => {
      expect(SqlLikePart.create(SqlColumn.create('p'), SqlLiteral.create('!')).toString()).toEqual(
        `"p" ESCAPE '!'`,
      );
    });
  });

  describe('#changeLike', () => {
    it('replaces the pattern', () => {
      expect(
        likePartOf(`x LIKE 'a%'  ESCAPE '!'`).changeLike(SqlLiteral.create('b%')).toString(),
      ).toEqual(`'b%'  ESCAPE '!'`);
    });
  });

  describe('#changeEscape', () => {
    it('replaces the escape', () => {
      expect(
        likePartOf(`x LIKE 'a%'  ESCAPE '!'`).changeEscape(SqlLiteral.create('#')).toString(),
      ).toEqual(`'a%'  ESCAPE '#'`);
    });
  });

  describe('#walk', () => {
    it('substitutes the pattern and the escape', () => {
      expect(
        likePartOf(`x LIKE p ESCAPE e`)
          .walk(ex => (ex instanceof SqlColumn ? SqlLiteral.create(ex.getName()) : ex))
          .toString(),
      ).toEqual(`'p' ESCAPE 'e'`);
    });

    it('keeps the same instance when nothing changes', () => {
      const part = likePartOf(`x LIKE 'a%' ESCAPE '!'`);

      expect(part.walk(ex => ex)).toBe(part);
    });

    it('stops when the callback returns nothing for the pattern or the escape', () => {
      const part = likePartOf(`x LIKE p ESCAPE e`);

      const seen: string[] = [];
      part.walk(ex => {
        seen.push(ex.toString());
        return ex instanceof SqlColumn && ex.getName() === 'p' ? undefined : ex;
      });
      expect(seen).toEqual(['p ESCAPE e', 'p']);

      expect(
        part.walkPostorder(ex =>
          ex instanceof SqlColumn && ex.getName() === 'e' ? undefined : ex,
        ),
      ).toBe(part);
    });
  });
});
