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

import { sqlParserFactory } from '../..';
import { FUNCTIONS } from '../../test-utils';

const parser = sqlParserFactory(FUNCTIONS);

describe('getTableNames Tests', () => {
  it('getTableNames', () => {
    expect(
      parser(`SELECT *
  FROM "github"`).getTableNames(),
    ).toMatchInlineSnapshot(`
      Array [
        "github",
      ]
    `);
  });

  it('getTableName with nameSpace', () => {
    expect(
      parser(`SELECT *
  FROM sys."github"`).getTableNames(),
    ).toMatchInlineSnapshot(`
      Array [
        "github",
      ]
    `);
  });

  it('getTableName with nameSpace and alias', () => {
    expect(
      parser(`SELECT *
  FROM sys."github" as Name`).getTableNames(),
    ).toMatchInlineSnapshot(`
      Array [
        "Name",
      ]
    `);
  });

  it('getTableName with muiltple tables', () => {
    expect(
      parser(`SELECT *
  FROM sys."github" as test, sys.name`).getTableNames(),
    ).toMatchInlineSnapshot(`
      Array [
        "test",
        "name",
      ]
    `);
  });
});

describe('getSchema Test', () => {
  it('getSchema', () => {
    expect(
      parser(`SELECT *
  FROM "github"`).getSchema(),
    ).toMatchInlineSnapshot(`"github"`);
  });
});
