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

import type { SqlFunction } from '../..';
import { RefName, SqlColumnDeclaration, SqlExpression, SqlType } from '../..';

function parseDeclaration(declaration: string): SqlColumnDeclaration {
  const fn = SqlExpression.parse(`TABLE(extern('{}', '{}')) EXTEND (${declaration})`);
  return (fn as SqlFunction).extendClause!.columnDeclarations.first();
}

describe('SqlColumnDeclaration', () => {
  describe('parses', () => {
    it.each([`x VARCHAR`, `"x"   BIGINT ARRAY`, `x TYPE('COMPLEX<json>')`])(
      'does back and forth with %s',
      declaration => {
        const parsed = parseDeclaration(declaration);

        expect(parsed).toBeInstanceOf(SqlColumnDeclaration);
        expect(parsed.toString()).toEqual(declaration);
      },
    );

    it('parses the column and the type', () => {
      const parsed = parseDeclaration(`"x"  BIGINT`);

      expect(parsed.getColumnName()).toEqual('x');
      expect(parsed.columnType).toBeInstanceOf(SqlType);
      expect(parsed.columnType.toString()).toEqual('BIGINT');
    });
  });

  describe('.create', () => {
    it('creates a declaration from strings, keeping the type casing', () => {
      expect(SqlColumnDeclaration.create('x', 'varchar').toString()).toEqual(`"x" varchar`);
    });

    it('creates a declaration from a SqlType', () => {
      expect(SqlColumnDeclaration.create('x', SqlType.create('BIGINT')).toString()).toEqual(
        `"x" BIGINT`,
      );
    });
  });

  describe('#_walkInner', () => {
    const declaration = SqlColumnDeclaration.create('x', 'VARCHAR');

    it('returns the same instance when nothing changes', () => {
      expect(declaration.walk(ex => ex)).toBe(declaration);
    });

    it('substitutes the type', () => {
      expect(
        declaration.walk(ex => (ex instanceof SqlType ? SqlType.create('DOUBLE') : ex)).toString(),
      ).toEqual(`"x" DOUBLE`);
    });

    it('stops when the type walk returns undefined', () => {
      expect(
        declaration._walkHelper([], ex => (ex instanceof SqlType ? undefined : ex), false),
      ).toBeUndefined();
    });
  });

  describe('#getColumnName', () => {
    it('returns the unquoted column name', () => {
      expect(parseDeclaration(`"my col" VARCHAR`).getColumnName()).toEqual('my col');
    });
  });

  describe('#changeColumn', () => {
    it('accepts a string', () => {
      expect(parseDeclaration(`x  VARCHAR`).changeColumn('y').toString()).toEqual(`"y"  VARCHAR`);
    });

    it('accepts a RefName', () => {
      expect(
        parseDeclaration(`x VARCHAR`).changeColumn(RefName.create('y', false)).toString(),
      ).toEqual(`y VARCHAR`);
    });
  });

  describe('#changeColumnType', () => {
    it('accepts a string', () => {
      expect(parseDeclaration(`x  VARCHAR`).changeColumnType('BIGINT').toString()).toEqual(
        `x  BIGINT`,
      );
    });

    it('accepts a SqlType', () => {
      expect(
        parseDeclaration(`x VARCHAR`).changeColumnType(SqlType.create('DOUBLE')).toString(),
      ).toEqual(`x DOUBLE`);
    });
  });
});
