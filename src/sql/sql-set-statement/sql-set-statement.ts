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

import type { SqlBaseValue, SqlTypeDesignator, Substitutor } from '../sql-base';
import { SqlBase } from '../sql-base';
import type { LiteralValue } from '../sql-literal/sql-literal';
import { SqlLiteral } from '../sql-literal/sql-literal';
import { RefName } from '../utils';

export interface SqlSetStatementValue extends SqlBaseValue {
  key: RefName;
  value: SqlLiteral;
}

export class SqlSetStatement extends SqlBase {
  static type: SqlTypeDesignator = 'setStatement';

  static DEFAULT_SET_KEYWORD = 'SET';

  static create(key: string | RefName, value: LiteralValue | SqlLiteral): SqlSetStatement {
    return new SqlSetStatement({
      key: RefName.create(key),
      value: SqlLiteral.create(value),
    });
  }

  static contextStatementsToContext(
    contextStatements: readonly SqlSetStatement[] | undefined,
  ): Record<string, any> {
    const context: Record<string, any> = {};
    if (contextStatements) {
      for (const contextStatement of contextStatements) {
        context[contextStatement.getKeyString()] = contextStatement.value.value;
      }
    }
    return context;
  }

  static contextToContextStatements(context: Record<string, any>): SqlSetStatement[] {
    return Object.entries(context).map(([k, v]) => SqlSetStatement.create(k, v));
  }

  public readonly key: RefName;
  public readonly value: SqlLiteral;

  constructor(options: SqlSetStatementValue) {
    super(options, SqlSetStatement.type);
    this.key = options.key;
    this.value = options.value;
  }

  public valueOf(): SqlSetStatementValue {
    const value = super.valueOf() as SqlSetStatementValue;
    value.key = this.key;
    value.value = this.value;
    return value;
  }

  protected _toRawString(): string {
    return [
      this.getKeyword('set', SqlSetStatement.DEFAULT_SET_KEYWORD),
      this.getSpace('postSet'),
      this.key.toString(),
      this.getSpace('postKey'),
      '=',
      this.getSpace('postEquals'),
      this.value.toString(),
      this.getSpace('postValue', ''),
      ';',
    ].join('');
  }

  public getKeyString(): string {
    return this.key.toString();
  }

  public changeKey(key: RefName | string): this {
    const value = this.valueOf();
    value.key = RefName.create(key);
    return SqlBase.fromValue(value);
  }

  public changeValue(value: SqlLiteral | LiteralValue): this {
    const v = this.valueOf();
    v.value = SqlLiteral.create(value);
    return SqlBase.fromValue(v);
  }

  public _walkInner(
    nextStack: SqlBase[],
    fn: Substitutor,
    postorder: boolean,
  ): SqlBase | undefined {
    let ret = this;

    const value = this.value._walkHelper(nextStack, fn, postorder);
    if (!value) return;
    if (value !== this.value) {
      ret = ret.changeValue(value as SqlLiteral);
    }

    return ret;
  }
}

SqlBase.register(SqlSetStatement);
