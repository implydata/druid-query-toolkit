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
import { SqlExpression, SqlType } from '../..';

describe('SqlType', () => {
  describe('parses', () => {
    it('works when parsed with mixed case', () => {
      const cast = SqlExpression.parse('CAST(X AS varchar)') as SqlFunction;
      const type = cast.getCastType()!;
      expect(type.toString()).toEqual('varchar');
      expect(type.value).toEqual('VARCHAR');
      expect(type.getNativeType()).toEqual('string');
    });
  });

  describe('.create', () => {
    it('works for varchar', () => {
      const varcharType = SqlType.create('varchar');
      expect(varcharType.toString()).toEqual('varchar');
      expect(varcharType.isArray()).toBeFalsy();
      expect(varcharType.value).toEqual('VARCHAR');
      expect(varcharType.getNativeType()).toEqual('string');
    });

    it('works for arrays', () => {
      const arrayType = SqlType.create('varchar /* lol */ array');
      expect(arrayType.toString()).toEqual('varchar /* lol */ array');
      expect(arrayType.isArray()).toBeTruthy();
      expect(arrayType.value).toEqual('VARCHAR ARRAY');
      expect(arrayType.getNativeType()).toEqual('ARRAY<string>');
    });

    it('returns an existing type as is', () => {
      expect(SqlType.create(SqlType.DOUBLE)).toBe(SqlType.DOUBLE);
    });

    it('does not store a keyword when the value is already normalized', () => {
      expect(SqlType.create('BIGINT').keywords).toEqual({});
    });

    it('keeps TYPE(...) as written apart from the TYPE keyword', () => {
      const type = SqlType.create(`type('COMPLEX<json>')`);
      expect(type.value).toEqual(`TYPE('COMPLEX<json>')`);
      expect(type.toString()).toEqual(`type('COMPLEX<json>')`);
    });
  });

  describe('.makeEffectiveType', () => {
    it('upper cases and normalizes the spacing', () => {
      expect(SqlType.makeEffectiveType('bigint')).toEqual('BIGINT');
      expect(SqlType.makeEffectiveType('double  \n array')).toEqual('DOUBLE ARRAY');
    });

    it('does not change the case inside TYPE(...)', () => {
      expect(SqlType.makeEffectiveType(`Type('COMPLEX<json>')`)).toEqual(`TYPE('COMPLEX<json>')`);
    });
  });

  describe('.fromNativeType', () => {
    it.each([
      ['string', 'VARCHAR'],
      ['ARRAY<string>', 'VARCHAR ARRAY'],
      ['double', 'DOUBLE'],
      ['ARRAY<double>', 'DOUBLE ARRAY'],
      ['float', 'FLOAT'],
      ['LONG', 'BIGINT'],
      ['ARRAY<long>', 'BIGINT ARRAY'],
      ['COMPLEX<json>', `TYPE('COMPLEX<json>')`],
      ['COMPLEX<hyperUnique>', 'VARCHAR'],
    ])('maps %s to %s', (nativeType, sqlType) => {
      expect(SqlType.fromNativeType(nativeType).toString()).toEqual(sqlType);
    });
  });

  describe('#getEffectiveType', () => {
    it('returns the normalized value', () => {
      expect(SqlType.create('varchar  array').getEffectiveType()).toEqual('VARCHAR ARRAY');
    });
  });

  describe('#getNativeType', () => {
    it.each([
      ['VARCHAR', 'string'],
      ['VARCHAR ARRAY', 'ARRAY<string>'],
      ['DOUBLE', 'double'],
      ['FLOAT', 'float'],
      ['DOUBLE ARRAY', 'ARRAY<double>'],
      ['TIMESTAMP', 'long'],
      ['BIGINT', 'long'],
      ['BIGINT ARRAY', 'ARRAY<long>'],
      [`TYPE('COMPLEX<json>')`, 'COMPLEX<json>'],
      ['BOOLEAN', 'string'],
    ])('maps %s to %s', (sqlType, nativeType) => {
      expect(SqlType.create(sqlType).getNativeType()).toEqual(nativeType);
    });

    it('round trips through fromNativeType', () => {
      for (const nativeType of [
        'string',
        'ARRAY<string>',
        'double',
        'ARRAY<double>',
        'float',
        'long',
        'ARRAY<long>',
        'COMPLEX<json>',
      ]) {
        expect(SqlType.fromNativeType(nativeType).getNativeType()).toEqual(nativeType);
      }
    });
  });

  describe('#isArray', () => {
    it('is true only for array types', () => {
      expect(SqlType.BIGINT_ARRAY.isArray()).toEqual(true);
      expect(SqlType.BIGINT.isArray()).toEqual(false);
      expect(SqlType.create(`TYPE('COMPLEX<json>')`).isArray()).toEqual(false);
    });
  });
});
