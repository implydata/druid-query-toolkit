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

import { SqlBase, SqlType } from '../../sql-base';
import { SqlClause, SqlClauseValue } from '../sql-clause';

export interface SqlExplainClauseValue extends SqlClauseValue {}

export class SqlExplainClause extends SqlClause {
  static type: SqlType = 'explainClause';

  static readonly DEFAULT_EXPLAIN_KEYWORD = 'EXPLAIN';
  static readonly DEFAULT_PLAN_KEYWORD = 'PLAN';
  static readonly DEFAULT_FOR_KEYWORD = 'FOR';

  static create(): SqlExplainClause {
    return new SqlExplainClause({});
  }

  constructor(options: SqlExplainClauseValue) {
    super(options, SqlExplainClause.type);
  }

  protected _toRawString(): string {
    return [
      this.getKeyword('explain', SqlExplainClause.DEFAULT_EXPLAIN_KEYWORD),
      this.getSpace('postExplain'),
      this.getKeyword('plan', SqlExplainClause.DEFAULT_PLAN_KEYWORD),
      this.getSpace('postPlan'),
      this.getKeyword('for', SqlExplainClause.DEFAULT_FOR_KEYWORD),
    ].join('');
  }
}

SqlBase.register(SqlExplainClause);
