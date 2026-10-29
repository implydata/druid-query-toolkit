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

import { RefName } from '../helpers';
import type { SqlTypeDesignator } from '../sql-base';
import { SqlBase } from '../sql-base';

import type { SqlPipeOperatorValue } from './sql-pipe-operator';
import { SqlPipeOperator } from './sql-pipe-operator';

export interface SqlAsPipeOperatorValue extends SqlPipeOperatorValue {
  alias: RefName;
}

/**
 * The \`|> AS t\` pipe operator, which names the input table so that later operators can refer
 * to its columns as `t.column` (in a `|> JOIN`, for example).
 */
export class SqlAsPipeOperator extends SqlPipeOperator {
  static type: SqlTypeDesignator = 'asPipeOperator';

  static DEFAULT_AS_KEYWORD = 'AS';

  static create(alias: RefName | string, forceQuotes?: boolean): SqlAsPipeOperator {
    return new SqlAsPipeOperator({
      alias: typeof alias === 'string' ? RefName.alias(alias, forceQuotes) : alias,
    });
  }

  public readonly alias: RefName;

  constructor(options: SqlAsPipeOperatorValue) {
    super(options, SqlAsPipeOperator.type);
    this.alias = options.alias;
  }

  public valueOf(): SqlAsPipeOperatorValue {
    const value = super.valueOf() as SqlAsPipeOperatorValue;
    value.alias = this.alias;
    return value;
  }

  protected _toRawOperatorString(): string {
    return [
      this.getKeyword('as', SqlAsPipeOperator.DEFAULT_AS_KEYWORD),
      this.getSpace('postAs'),
      this.alias.toString(),
    ].join('');
  }

  public getAliasName(): string {
    return this.alias.name;
  }

  public changeAlias(alias: RefName | string, forceQuotes?: boolean): this {
    const value = this.valueOf();
    value.alias = typeof alias === 'string' ? RefName.alias(alias, forceQuotes) : alias;
    return SqlBase.fromValue(value);
  }

  public _walkInner(): SqlPipeOperator | undefined {
    return this;
  }
}

SqlBase.register(SqlAsPipeOperator);
