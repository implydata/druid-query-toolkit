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

import { parseSql } from './parser';

describe('SqlBase', () => {
  describe('#prettyTrim', () => {
    it('.toJSON', () => {
      expect(JSON.stringify({ x: parseSql(`COUNT(*)`) })).toEqual('{"x":"COUNT(*)"}');
    });
  });

  describe('#prettyTrim', () => {
    it('works in basic case', () => {
      expect(
        parseSql(
          `abcd_efgh_ijkl_mnop_qrst_uvwx_yz.abcd_efgh_ijkl_mnop_qrst_uvwx_yz = 'abcd_efgh_ijkl_mnop_qrst_uvwx_yz'`,
        )
          .prettyTrim(10)
          .toString(),
      ).toEqual(`"abcd_ef..."."abcd_ef..." = 'abcd_ef...'`);
    });

    it('works with COUNT(*)', () => {
      expect(parseSql(`COUNT(*)`).prettyTrim(10).toString()).toEqual(`COUNT(*)`);
    });
  });

  describe('#changeSpace', () => {
    it('works', () => {
      let sql = parseSql(`COUNT(*)`);
      expect(sql.getSpace('postArguments')).toEqual('');
      sql = sql.changeSpace('postArguments', '   ');
      expect(sql.getSpace('postArguments')).toEqual('   ');
      expect(sql.toString()).toEqual(`COUNT(*   )`);
    });
  });
});
