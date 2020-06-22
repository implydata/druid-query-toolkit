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

import { parseSql } from '..';

describe('SqlBase', () => {
  describe('#fillPlaceholders', () => {
    it('works in basic case', () => {
      expect(
        parseSql(`? < ?`)
          .fillPlaceholders(['A', '5'])
          .toString(),
      ).toEqual(`A < 5`);
    });

    it('works in missing placeholder', () => {
      expect(
        parseSql(`? BETWEEN ? AND ?`)
          .fillPlaceholders(['A', '5'])
          .toString(),
      ).toEqual(`A BETWEEN 5 AND ?`);
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
  });
});
