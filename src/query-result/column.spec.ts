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

import { Column } from './column';

describe('Column', () => {
  describe('.fromName', () => {
    it('makes a column with just a name', () => {
      expect(Column.fromName('channel')).toEqual(new Column({ name: 'channel' }));
    });

    it('stringifies non string names', () => {
      expect(Column.fromName(3).name).toEqual('3');
    });
  });

  describe('.fromColumnNames', () => {
    it('makes a column per name', () => {
      expect(Column.fromColumnNames(['a', 1])).toEqual([
        new Column({ name: 'a' }),
        new Column({ name: '1' }),
      ]);
    });
  });

  describe('.fromColumnNamesAndTypeArrays', () => {
    it('attaches the native and sql types by position', () => {
      expect(
        Column.fromColumnNamesAndTypeArrays(['__time', 'n'], ['LONG', 'LONG'], ['TIMESTAMP']),
      ).toEqual([
        new Column({ name: '__time', nativeType: 'LONG', sqlType: 'TIMESTAMP' }),
        new Column({ name: 'n', nativeType: 'LONG', sqlType: undefined }),
      ]);
    });

    it('works without types', () => {
      expect(Column.fromColumnNamesAndTypeArrays(['a'])).toEqual([new Column({ name: 'a' })]);
    });
  });

  describe('.fromColumnNamesAndTypeArray', () => {
    it('attaches the types from an array of objects', () => {
      expect(
        Column.fromColumnNamesAndTypeArray(
          ['__time', 'n'],
          [{ type: 'LONG', sqlType: 'TIMESTAMP' }],
        ),
      ).toEqual([
        new Column({ name: '__time', nativeType: 'LONG', sqlType: 'TIMESTAMP' }),
        new Column({ name: 'n' }),
      ]);
    });

    it('works without types', () => {
      expect(Column.fromColumnNamesAndTypeArray(['a'])).toEqual([new Column({ name: 'a' })]);
    });
  });

  describe('#isTimeColumn', () => {
    it('is true only for a __time TIMESTAMP column', () => {
      expect(new Column({ name: '__time', sqlType: 'TIMESTAMP' }).isTimeColumn()).toEqual(true);
      expect(new Column({ name: '__time', sqlType: 'BIGINT' }).isTimeColumn()).toEqual(false);
      expect(new Column({ name: 'other', sqlType: 'TIMESTAMP' }).isTimeColumn()).toEqual(false);
      expect(new Column({ name: '__time' }).isTimeColumn()).toEqual(false);
    });
  });

  describe('#isNumeric', () => {
    it('is true for numeric sql types', () => {
      expect(new Column({ name: 'a', sqlType: 'BIGINT' }).isNumeric()).toEqual(true);
      expect(new Column({ name: 'a', sqlType: 'FLOAT' }).isNumeric()).toEqual(true);
      expect(new Column({ name: 'a', sqlType: 'DOUBLE' }).isNumeric()).toEqual(true);
    });

    it('is false for other sql types', () => {
      expect(new Column({ name: 'a', sqlType: 'VARCHAR' }).isNumeric()).toEqual(false);
      expect(new Column({ name: 'a', sqlType: 'TIMESTAMP' }).isNumeric()).toEqual(false);
      expect(new Column({ name: 'a' }).isNumeric()).toEqual(false);
    });
  });
});
