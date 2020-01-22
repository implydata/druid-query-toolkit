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

import { sqlParserFactory } from './parser/druidsql';

const parser = sqlParserFactory();

describe('test', () => {
  it('quotes', () => {
    const sql = `"page"`;

    expect(parser(sql)).toMatchInlineSnapshot(`
        SqlRef {
          "innerSpacing": Object {},
          "name": "page",
          "namespace": undefined,
          "namespaceQuotes": undefined,
          "quotes": "\\"",
          "type": "ref",
        }
      `);
  });
});
