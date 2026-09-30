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

import { backAndForth } from '../../test-utils';
import type { SqlBase } from '..';
import { RefName, SqlAlias, SqlColumn, SqlExpression, SqlQuery, SqlTable } from '..';

describe('SqlAlias', () => {
  describe('parses', () => {
    it('works in no alias case', () => {
      const sql = `SELECT city`;

      backAndForth(sql);

      expect(SqlQuery.parse(sql).getSelectExpressionForIndex(0)).toMatchInlineSnapshot(`
        SqlColumn {
          "keywords": Object {},
          "parens": undefined,
          "refName": RefName {
            "name": "city",
            "quotes": false,
          },
          "spacing": Object {},
          "table": undefined,
          "type": "column",
        }
      `);
    });

    it('works in basic case', () => {
      const sql = `SELECT city AS City`;

      backAndForth(sql);

      expect(SqlQuery.parse(sql).getSelectExpressionForIndex(0)).toMatchInlineSnapshot(`
        SqlAlias {
          "alias": RefName {
            "name": "City",
            "quotes": false,
          },
          "columns": undefined,
          "expression": SqlColumn {
            "keywords": Object {},
            "parens": undefined,
            "refName": RefName {
              "name": "city",
              "quotes": false,
            },
            "spacing": Object {},
            "table": undefined,
            "type": "column",
          },
          "keywords": Object {
            "as": "AS",
          },
          "parens": undefined,
          "spacing": Object {
            "preAlias": " ",
            "preAs": " ",
          },
          "type": "alias",
        }
      `);
    });

    it('works with table prefix', () => {
      const sql = `SELECT tbl.city  As   City`;

      backAndForth(sql);

      expect(SqlQuery.parse(sql).getSelectExpressionForIndex(0)).toMatchInlineSnapshot(`
        SqlAlias {
          "alias": RefName {
            "name": "City",
            "quotes": false,
          },
          "columns": undefined,
          "expression": SqlColumn {
            "keywords": Object {},
            "parens": undefined,
            "refName": RefName {
              "name": "city",
              "quotes": false,
            },
            "spacing": Object {
              "postDot": "",
              "postTable": "",
            },
            "table": SqlTable {
              "keywords": Object {},
              "namespace": undefined,
              "parens": undefined,
              "refName": RefName {
                "name": "tbl",
                "quotes": false,
              },
              "spacing": Object {},
              "type": "table",
            },
            "type": "column",
          },
          "keywords": Object {
            "as": "As",
          },
          "parens": undefined,
          "spacing": Object {
            "preAlias": "   ",
            "preAs": "  ",
          },
          "type": "alias",
        }
      `);
    });

    it('works without AS', () => {
      const sql = `SELECT tbl.city City`;

      backAndForth(sql);

      expect(SqlQuery.parse(sql).getSelectExpressionForIndex(0)).toMatchInlineSnapshot(`
        SqlAlias {
          "alias": RefName {
            "name": "City",
            "quotes": false,
          },
          "columns": undefined,
          "expression": SqlColumn {
            "keywords": Object {},
            "parens": undefined,
            "refName": RefName {
              "name": "city",
              "quotes": false,
            },
            "spacing": Object {
              "postDot": "",
              "postTable": "",
            },
            "table": SqlTable {
              "keywords": Object {},
              "namespace": undefined,
              "parens": undefined,
              "refName": RefName {
                "name": "tbl",
                "quotes": false,
              },
              "spacing": Object {},
              "type": "table",
            },
            "type": "column",
          },
          "keywords": Object {
            "as": "",
          },
          "parens": undefined,
          "spacing": Object {
            "preAlias": " ",
          },
          "type": "alias",
        }
      `);
    });

    it('works with a column list', () => {
      const sql = `t AS x (a, "b")`;

      backAndForth(sql, SqlAlias);

      const alias = SqlExpression.parse(sql) as SqlAlias;
      expect(alias.getAliasName()).toEqual('x');
      expect(String(alias.columns)).toEqual('(a, "b")');
    });
  });

  describe('.create', () => {
    it('overwrites existing alias when aliasing an already aliased expression', () => {
      expect(
        SqlAlias.create(SqlAlias.create(SqlColumn.create('X'), 'name1'), 'name2').toString(),
      ).toEqual('"X" AS "name2"');
    });

    it('creates a simple alias with string column and string alias', () => {
      expect(SqlAlias.create(SqlColumn.create('col1'), 'alias1').toString()).toEqual(
        '"col1" AS "alias1"',
      );
    });

    it('creates an alias with RefName object as alias', () => {
      const refName = RefName.create('myAlias', true);
      expect(SqlAlias.create(SqlColumn.create('col1'), refName).toString()).toEqual(
        '"col1" AS "myAlias"',
      );
    });

    it('auto-quotes aliases that are reserved keywords', () => {
      expect(SqlAlias.create(SqlColumn.create('col1'), 'select').toString()).toEqual(
        '"col1" AS "select"',
      );
    });

    it('forces quotes when forceQuotes is true', () => {
      expect(SqlAlias.create(SqlColumn.create('col1'), 'normal', true).toString()).toEqual(
        '"col1" AS "normal"',
      );
    });

    it('adds parentheses to SqlQuery expressions', () => {
      const query = SqlQuery.create('tbl');
      const aliasedQuery = SqlAlias.create(query, 'subq');
      const result = aliasedQuery.toString();

      // Check that the result contains the main components rather than exact formatting
      expect(result).toContain('(');
      expect(result).toContain(')');
      expect(result).toContain('SELECT');
      expect(result).toContain('FROM "tbl"');
      expect(result).toContain('AS "subq"');
    });
  });

  describe('#changeExpression', () => {
    it('replaces the expression and keeps the alias and spacing', () => {
      const alias = SqlExpression.parse(`x  AS  "y"`) as SqlAlias;
      expect(alias.changeExpression(SqlExpression.parse('a + 1')).toString()).toEqual(
        'a + 1  AS  "y"',
      );
    });
  });

  describe('#changeAlias', () => {
    const x = SqlAlias.create(SqlColumn.optionalQuotes('X'), 'test');
    const z = SqlAlias.create(SqlColumn.optionalQuotes('Z'), RefName.create('test', true));

    it('works with normal string', () => {
      expect(String(x.changeAlias('hello'))).toEqual('X AS "hello"');
    });

    it('preserves quotes', () => {
      expect(String(z.changeAlias('hello'))).toEqual('Z AS "hello"');
    });

    it('works with quotes if needed', () => {
      expect(String(x.changeAlias('select'))).toEqual('X AS "select"');
    });

    it('works with quotes if forced', () => {
      expect(String(x.changeAlias('hello', true))).toEqual('X AS "hello"');
    });

    it('uses a RefName as given', () => {
      expect(String(x.changeAlias(RefName.create('hello', false)))).toEqual('X AS hello');
    });
  });

  describe('#_walkInner', () => {
    const alias = SqlExpression.parse(`a + b AS "c"`) as SqlAlias;

    it('returns the same instance when nothing changes', () => {
      expect(alias.walk(ex => ex)).toBe(alias);
    });

    it('substitutes inside the expression but not the alias', () => {
      expect(
        alias
          .walk(ex => (ex instanceof SqlColumn ? ex.changeName(ex.getName().toUpperCase()) : ex))
          .toString(),
      ).toEqual('A + B AS "c"');
    });

    it('abandons all changes when the expression aborts the walk', () => {
      expect(
        alias.walk((ex: SqlBase) => {
          if (!(ex instanceof SqlColumn)) return ex;
          if (ex.getName() === 'b') return;
          return ex.changeName('z');
        }),
      ).toBe(alias);
    });
  });

  describe('#ifUnnamedAliasAs', () => {
    it('keeps the existing alias', () => {
      const alias = SqlAlias.create(SqlColumn.create('x'), 'y');
      expect(alias.ifUnnamedAliasAs('z')).toBe(alias);
    });
  });

  describe('#convertToTable', () => {
    it('turns an aliased column into an aliased table', () => {
      const alias = SqlExpression.parse(`sys.segments AS s`) as SqlAlias;
      const converted = alias.convertToTable() as SqlAlias;
      expect(converted.expression).toBeInstanceOf(SqlTable);
      expect(converted.toString()).toEqual('sys.segments AS s');
    });

    it('leaves a non column expression alone', () => {
      const alias = SqlAlias.create(SqlExpression.parse('1 + 1'), 'two');
      expect(alias.convertToTable()).toBe(alias);
    });
  });

  describe('#getAliasName', () => {
    it('returns the alias name', () => {
      expect((SqlExpression.parse(`x AS "My Name"`) as SqlAlias).getAliasName()).toEqual('My Name');
    });
  });

  describe('#getOutputName', () => {
    it('returns the alias name', () => {
      expect(SqlExpression.parse(`x AS y`).getOutputName()).toEqual('y');
    });
  });

  describe('#getUnderlyingExpression', () => {
    it('returns the aliased expression', () => {
      const x = SqlColumn.create('x');
      expect(SqlAlias.create(x, 'y').getUnderlyingExpression()).toBe(x);
    });
  });

  describe('#changeUnderlyingExpression', () => {
    it('replaces the aliased expression', () => {
      expect(
        SqlAlias.create(SqlColumn.create('x'), 'y')
          .changeUnderlyingExpression(SqlExpression.parse('COUNT(*)'))
          .toString(),
      ).toEqual('COUNT(*) AS "y"');
    });
  });
});
