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
import { SqlExpression } from '../sql-expression';
import { SqlFunction } from '../sql-function/sql-function';
import { SqlQuery } from '../sql-query/sql-query';
import { SqlTable } from '../sql-table/sql-table';

import { SqlTableQuery } from './sql-table-query';

describe('SqlTableQuery', () => {
  describe('valid table queries', () => {
    it.each([
      `TABLE "kttm"`,
      `TABLE kttm`,
      `TABLE druid.kttm`,
      `TABLE "druid"."kttm"`,
      `table  "kttm"`,
      `TABLE druid . kttm`,
      `TABLE"kttm"`,
      `(TABLE "kttm")`,
      `((TABLE "kttm"))`,
    ])('does back and forth with %s', sql => {
      backAndForth(sql, SqlTableQuery);
    });
  });

  describe('table queries used as a sub query', () => {
    it.each([
      `SELECT * FROM (TABLE "kttm") LIMIT 3`,
      `SELECT * FROM (TABLE "kttm") AS t`,
      `SELECT COUNT(*) FROM (TABLE "kttm") WHERE country = 'Argentina'`,
      `SELECT * FROM (TABLE druid.kttm) LIMIT 3`,
      `SELECT 1 WHERE 1 IN (TABLE "kttm")`,
    ])('does back and forth with %s', sql => {
      backAndForth(sql, SqlQuery);
    });
  });

  it('does not shadow the TABLE(...) table function', () => {
    const sql = `TABLE(extern('{"type":"inline"}', '{"type":"csv"}'))`;
    backAndForth(sql, SqlFunction);

    // ...even with a space before the paren
    expect(SqlExpression.parse(`TABLE (extern(1))`)).toBeInstanceOf(SqlFunction);
  });

  it('rejects a three part name', () => {
    expect(() => SqlExpression.parse(`TABLE a.b.c`)).toThrowError('Expected');
  });

  it('.create', () => {
    expect(SqlTableQuery.create('kttm').toString()).toEqual(`TABLE "kttm"`);
    expect(SqlTableQuery.create(SqlTable.create('kttm', 'druid')).toString()).toEqual(
      `TABLE "druid"."kttm"`,
    );
    expect(SqlTableQuery.create(SqlTableQuery.create('kttm')).toString()).toEqual(`TABLE "kttm"`);
  });

  it('.optionalQuotes', () => {
    expect(SqlTableQuery.optionalQuotes('kttm').toString()).toEqual(`TABLE kttm`);
    expect(SqlTableQuery.optionalQuotes('has space').toString()).toEqual(`TABLE "has space"`);
  });

  it('gets and changes the table', () => {
    const tableQuery = SqlExpression.parse(`TABLE druid.kttm`) as SqlTableQuery;

    expect(tableQuery.getTableName()).toEqual('kttm');
    expect(tableQuery.getNamespaceName()).toEqual('druid');

    expect(tableQuery.changeTableName('wikipedia').toString()).toEqual(`TABLE druid.wikipedia`);
    expect(tableQuery.changeNamespace(undefined).toString()).toEqual(`TABLE kttm`);
    expect(tableQuery.changeTable(SqlTable.create('wikipedia')).toString()).toEqual(
      `TABLE "wikipedia"`,
    );
  });

  it('walks the underlying table', () => {
    const tableQuery = SqlExpression.parse(`TABLE druid.kttm`);

    expect(tableQuery.getUsedTableNames()).toEqual(['kttm']);

    expect(
      tableQuery
        .walk(ex => (ex instanceof SqlTable ? SqlTable.optionalQuotes('wikipedia') : ex))
        .toString(),
    ).toEqual(`TABLE wikipedia`);
  });

  it('works in a FROM clause when constructed', () => {
    expect(SqlQuery.selectStarFrom(SqlTableQuery.create('kttm')).toString()).toEqual(
      `SELECT *\nFROM (TABLE "kttm")`,
    );
  });

  it('prettifies', () => {
    expect(SqlExpression.parse(`table   druid . kttm`).prettify().toString()).toEqual(
      `TABLE druid.kttm`,
    );
  });

  it('parses to the expected tree', () => {
    expect(SqlExpression.parse(`TABLE "druid"."kttm"`)).toMatchInlineSnapshot(`
      SqlTableQuery {
        "keywords": Object {
          "table": "TABLE",
        },
        "parens": undefined,
        "spacing": Object {
          "postTable": " ",
        },
        "table": SqlTable {
          "keywords": Object {},
          "namespace": SqlNamespace {
            "keywords": Object {},
            "parens": undefined,
            "refName": RefName {
              "name": "druid",
              "quotes": true,
            },
            "spacing": Object {},
            "type": "namespace",
          },
          "parens": undefined,
          "refName": RefName {
            "name": "kttm",
            "quotes": true,
          },
          "spacing": Object {
            "postDot": "",
            "postNamespace": "",
          },
          "type": "table",
        },
        "type": "tableQuery",
      }
    `);
  });
});
