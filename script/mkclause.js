const fs = require('fs-extra');

function toCamelCase(string) {
  return string.replace(/(^|-)[a-z]/g, s => s.replace('-', '').toUpperCase());
}

function toSnakeCase(string) {
  return string.replace(/(-)[a-z]/g, s => s.replace('-', '').toUpperCase());
}

async function main() {
  const name = process.argv[2];

  const nameName = toSnakeCase(name);
  const NameName = toCamelCase(name);

  const data = `/*
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

import { SqlBase, SqlBaseValue, Substitutor } from '../../sql-base';
import { SqlExpression } from '../../sql-expression';

export interface Sql${NameName}ClauseValue extends SqlBaseValue {  
  keyword?: string;
  expression: SqlExpression;
}

export class Sql${NameName}Clause extends SqlBase {
  static type = '${nameName}Clause';

  static DEFAULT_KEYWORD = '${name.toUpperCase().replace(/-/g, ' ')}';

  public readonly keyword?: string;
  public readonly expression: SqlExpression;

  constructor(options: Sql${NameName}ClauseValue) {
    super(options, Sql${NameName}Clause.type);
    this.keyword = options.keyword;
    this.expression = options.expression;
  }

  public valueOf(): Sql${NameName}ClauseValue {
    const value = super.valueOf() as Sql${NameName}ClauseValue;
    value.keyword = this.keyword;
    value.expression = this.expression;
    return value;
  }

  protected _toRawString(): string {
    const rawParts: string[] = [
      this.keyword || Sql${NameName}Clause.DEFAULT_KEYWORD,
      this.getInnerSpace('postKeyword')
    ];

    rawParts.push(this.expression.toString());

    return rawParts.join('');
  }

  public changeKeyword(keyword: string | undefined): this {
    const value = this.valueOf();
    value.keyword = keyword;
    return SqlBase.fromValue(value);
  }
  
  public changeExpression(expression: SqlExpression): this {
    const value = this.valueOf();
    value.expression = expression;
    return SqlBase.fromValue(value);
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlBase | undefined {
    let ret = this;

    const expression = this.expression._walkHelper(nextStack, fn, postorder);
    if (!expression) return;
    if (expression !== this.expression) {
      ret = ret.changeExpression(expression);
    }

    return ret;
  }
  
  public clearStaticKeywords(): this {
    const value = this.valueOf();
    delete value.keyword; 
    return SqlBase.fromValue(value);
  }

  public clearSeparators(): this {    
    const value = this.valueOf();
    // ???
    return SqlBase.fromValue(value);
  }
}

SqlBase.register(Sql${NameName}Clause.type, Sql${NameName}Clause);
`;

  await fs.mkdirp(`src/sql/sql-query/sql-${name}-clause`);
  await fs.writeFile(`src/sql/sql-query/sql-${name}-clause/sql-${name}-clause.ts`, data);
}

main();
