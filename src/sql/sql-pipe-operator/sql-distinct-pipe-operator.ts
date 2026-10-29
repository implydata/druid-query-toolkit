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

import type { SqlTypeDesignator } from '../sql-base';
import { SqlBase } from '../sql-base';

import type { SqlPipeOperatorValue } from './sql-pipe-operator';
import { SqlPipeOperator } from './sql-pipe-operator';

export type SqlDistinctPipeOperatorValue = SqlPipeOperatorValue;

/**
 * The \`|> DISTINCT\` pipe operator, which removes duplicate rows from the input.
 */
export class SqlDistinctPipeOperator extends SqlPipeOperator {
  static type: SqlTypeDesignator = 'distinctPipeOperator';

  static DEFAULT_DISTINCT_KEYWORD = 'DISTINCT';

  static create(): SqlDistinctPipeOperator {
    return new SqlDistinctPipeOperator({});
  }

  constructor(options: SqlDistinctPipeOperatorValue) {
    super(options, SqlDistinctPipeOperator.type);
  }

  protected _toRawOperatorString(): string {
    return this.getKeyword('distinct', SqlDistinctPipeOperator.DEFAULT_DISTINCT_KEYWORD);
  }

  public _walkInner(): SqlPipeOperator | undefined {
    return this;
  }
}

SqlBase.register(SqlDistinctPipeOperator);
