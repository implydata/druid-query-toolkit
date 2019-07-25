/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Column, OrExpression, StringType } from '../../../index';

describe('single column Tests', () => {
  it('column with no brackets to string', () => {
    const val = new Column({
      parens: [],
      ex: new OrExpression({
        basicExpression: new StringType({ chars: 'value', quote: "'", spacing: ['', ''] }),
      }),
      alias: null,
      spacing: [''],
    });
    expect(val.toString()).toMatchSnapshot();
  });
  it('column addparen', () => {
    const val = new Column({
      parens: [],
      ex: new OrExpression({
        basicExpression: new StringType({ chars: 'value', quote: "'", spacing: ['', ''] }),
      }),
      alias: null,
      spacing: [''],
    });
    val.addParen(['(', [null]], [[null], ')']);
    expect(val).toMatchSnapshot();
  });
  it('column addparen to string', () => {
    const val = new Column({
      parens: [],
      ex: new OrExpression({
        basicExpression: new StringType({ chars: 'value', quote: "'", spacing: ['', ''] }),
      }),
      alias: null,
      spacing: [''],
    });
    val.addParen(['(', [null]], [[null], ')']);
    expect(val.toString()).toMatchSnapshot();
  });
  it('column getBasicValue with bracket', () => {
    const val = new Column({
      parens: [],
      ex: new OrExpression({
        basicExpression: new StringType({ chars: 'value', quote: "'", spacing: ['', ''] }),
      }),
      alias: null,
      spacing: [''],
    });
    val.addParen(['(', [null]], [[null], ')']);
    expect(val.getBasicValue()).toMatchSnapshot();
  });
  it('column getAlias', () => {
    const val = new Column({
      parens: [],
      ex: new OrExpression({
        basicExpression: new StringType({ chars: 'value', quote: "'", spacing: ['', ''] }),
      }),
      alias: null,
      spacing: [''],
    });
    val.addParen(['(', [null]], [[null], ')']);
    expect(val.getBasicValue()).toMatchSnapshot();
  });
});
