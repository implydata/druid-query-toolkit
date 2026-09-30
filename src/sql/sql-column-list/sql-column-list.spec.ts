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

import type { SqlAlias } from '../..';
import { RefName, SqlColumnList, SqlQuery } from '../..';
import { backAndForth } from '../../test-utils';

function parseColumnList(columnsSql: string): SqlColumnList {
  const query = SqlQuery.parse(`SELECT * FROM t AS x ${columnsSql}`);
  return (query.fromClause!.expressions.get(0) as SqlAlias).columns!;
}

describe('SqlColumnList', () => {
  describe('parses', () => {
    it.each([
      `SELECT * FROM t AS x (a)`,
      `SELECT * FROM t AS x ( a ,b,  "c" )`,
      `WITH w (a, b) AS (SELECT 1, 2) SELECT * FROM w`,
      `SELECT * FROM a JOIN b USING (k1 , k2)`,
    ])('parses: %s', sql => {
      backAndForth(sql);
    });

    it('parses the columns with their spacing', () => {
      const columnList = parseColumnList(`( a ,b )`);
      expect(columnList).toBeInstanceOf(SqlColumnList);
      expect(columnList.columns.values.map(c => c.name)).toEqual(['a', 'b']);
      expect(columnList.parens).toEqual([{ leftSpacing: ' ', rightSpacing: ' ' }]);
      expect(String(columnList)).toEqual(`( a ,b )`);
    });
  });

  describe('.create', () => {
    it('makes a parenthesized list', () => {
      expect(
        String(SqlColumnList.create([RefName.create('a'), RefName.create('b', false)])),
      ).toEqual(`("a", b)`);
    });

    it('returns an existing column list as is', () => {
      const columnList = SqlColumnList.create([RefName.create('a')]);
      expect(SqlColumnList.create(columnList)).toBe(columnList);
    });
  });

  describe('#changeColumns', () => {
    it('replaces the columns and keeps the parens', () => {
      const columnList = parseColumnList(`( a ,b )`);
      expect(String(columnList.changeColumns([RefName.create('c', false)]))).toEqual(`( c )`);
    });
  });

  describe('#clearOwnSeparators', () => {
    it('resets the separators to the default', () => {
      const columnList = parseColumnList(`(a ,b  ,  c)`);
      expect(String(columnList.clearOwnSeparators())).toEqual(`(a, b, c)`);
    });
  });
});
