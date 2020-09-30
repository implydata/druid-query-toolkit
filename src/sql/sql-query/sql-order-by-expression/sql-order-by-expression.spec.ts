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

import { SqlOrderByExpression, SqlRef } from '../..';

describe('SqlOrderByExpression', () => {
  it('#getEffectiveDirection', () => {
    expect(SqlOrderByExpression.create(SqlRef.column('x')).getEffectiveDirection()).toEqual('ASC');

    expect(SqlOrderByExpression.create(SqlRef.column('x'), 'ASC').getEffectiveDirection()).toEqual(
      'ASC',
    );

    expect(SqlOrderByExpression.create(SqlRef.column('x'), 'DESC').getEffectiveDirection()).toEqual(
      'DESC',
    );
  });

  it('#reverseDirection', () => {
    expect(
      String(SqlOrderByExpression.create(SqlRef.column('x'), 'DESC').reverseDirection()),
    ).toEqual('x ASC');

    expect(
      String(SqlOrderByExpression.create(SqlRef.column('x'), 'ASC').reverseDirection()),
    ).toEqual('x DESC');

    expect(String(SqlOrderByExpression.create(SqlRef.column('x')).reverseDirection())).toEqual(
      'x DESC',
    );
  });
});
