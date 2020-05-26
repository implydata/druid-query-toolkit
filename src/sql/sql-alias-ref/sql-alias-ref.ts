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

import { SqlExpression, SqlRef } from '..';
import { SqlBase, SqlBaseValue } from '../sql-base';

export interface SqlAliasRefValue extends SqlBaseValue {
  expression: SqlExpression;
  asKeyword: string;
  alias: SqlRef;
}

export class SqlAliasRef extends SqlBase {
  static type = 'alias-ref';

  static sqlAliasFactory(expression: SqlExpression, alias: string) {
    return new SqlAliasRef({
      type: SqlAliasRef.type,
      expression: expression,
      asKeyword: 'AS',
      alias: SqlRef.fromStringWithDoubleQuotes(alias),
    } as SqlAliasRefValue);
  }

  public readonly expression: SqlExpression;
  public readonly asKeyword: string;
  public readonly alias: SqlRef;

  constructor(options: SqlAliasRefValue) {
    super(options, SqlAliasRef.type);
    this.expression = options.expression;
    this.asKeyword = options.asKeyword;
    this.alias = options.alias;
  }

  public upgrade() {
    const value = this.valueOf();
    value.alias = value.alias.upgrade();
    return new SqlAliasRef(value);
  }

  public valueOf() {
    const value = super.valueOf() as SqlAliasRefValue;
    value.expression = this.expression;
    value.asKeyword = this.asKeyword;
    value.alias = this.alias;
    return value as SqlAliasRefValue;
  }

  public toRawString(): string {
    const rawParts: string[] = [this.expression.toString(), this.getInnerSpace('postExpression')];

    if (this.asKeyword) {
      rawParts.push(this.asKeyword, this.getInnerSpace('postAs'));
    }

    rawParts.push(this.alias.toString());

    return rawParts.join('');
  }
}

SqlBase.register(SqlAliasRef.type, SqlAliasRef);
