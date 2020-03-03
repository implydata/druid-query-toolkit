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

import { sqlParserFactory } from '../../index';
import { FUNCTIONS } from '../../test-utils';

const parser = sqlParserFactory(FUNCTIONS);

describe('sql-ref', () => {
  it('Ref with double quotes and double quoted namespace', () => {
    const sql = '"test"."namespace"';
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"\\"test\\".\\"namespace\\""`);
    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlRef {
        "innerSpacing": Object {},
        "name": "namespace",
        "namespace": "test",
        "namespaceQuotes": "\\"",
        "quotes": "\\"",
        "type": "ref",
      }
    `);
  });

  it('Ref with double quotes and no quotes namespace', () => {
    const sql = '"test".namespace';
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"\\"test\\".namespace"`);
    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlRef {
        "innerSpacing": Object {},
        "name": "namespace",
        "namespace": "test",
        "namespaceQuotes": "\\"",
        "quotes": "",
        "type": "ref",
      }
    `);
  });

  it('Ref with no quotes and namespace', () => {
    const sql = 'test.namespace';
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"test.namespace"`);
    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlRef {
        "innerSpacing": Object {},
        "name": "namespace",
        "namespace": "test",
        "namespaceQuotes": "",
        "quotes": "",
        "type": "ref",
      }
    `);
  });

  it('Ref with no quotes and no namespace', () => {
    const sql = 'test';
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"test"`);
    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlRef {
        "innerSpacing": Object {},
        "name": "test",
        "namespace": undefined,
        "namespaceQuotes": undefined,
        "quotes": "",
        "type": "ref",
      }
    `);
  });

  it('Ref with double quotes and no namespace', () => {
    const sql = '"test"';
    expect(parser(sql).toString()).toMatchInlineSnapshot(`"\\"test\\""`);
    expect(parser(sql)).toMatchInlineSnapshot(`
      SqlRef {
        "innerSpacing": Object {},
        "name": "test",
        "namespace": undefined,
        "namespaceQuotes": undefined,
        "quotes": "\\"",
        "type": "ref",
      }
    `);
  });
});
