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

  it('works when parsed with mixed case', () => {
    const cast = SqlExpression.parse('CAST(X AS varchar)') as SqlFunction;
    const type = cast.getCastType()!;
    expect(type.toString()).toEqual('varchar');
    expect(type.value).toEqual('VARCHAR');
    expect(type.getNativeType()).toEqual('string');
  });
});
