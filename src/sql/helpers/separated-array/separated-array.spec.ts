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

import { Separator } from '..';

import { SeparatedArray } from './separated-array';

describe('SeparatedArray', () => {
  const a = new SeparatedArray(
    [1, 2, 3],
    [Separator.rightSpace(','), Separator.symmetricSpace(';')],
  );

  it('works in basic case', () => {
    expect(String(a)).toEqual('1, 2 ; 3');
  });

  it('#change', () => {
    expect(String(a.change(1, 7))).toEqual('1, 7 ; 3');
  });

  it('#remove', () => {
    expect(String(a.remove(0))).toEqual('2 ; 3');
    expect(String(a.remove(1))).toEqual('1 ; 3');
    expect(String(a.remove(2))).toEqual('1, 2');
  });

  it('#insert', () => {
    expect(String(a.insert(0, 7))).toEqual('7, 1, 2 ; 3');
    expect(String(a.insert(1, 7))).toEqual('1, 7, 2 ; 3');
    expect(String(a.insert(2, 7))).toEqual('1, 2 ; 7 ; 3');
    expect(String(a.insert(3, 7))).toEqual('1, 2 ; 3 ; 7');
    expect(String(a.insert(4, 7))).toEqual('1, 2 ; 3 ; 7');
  });

  it('#prepend', () => {
    expect(String(a.prepend(7))).toEqual('7, 1, 2 ; 3');
  });

  it('#append', () => {
    expect(String(a.append(7))).toEqual('1, 2 ; 3 ; 7');
  });
});
