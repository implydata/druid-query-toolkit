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
import { OrExpression } from '../../..';

export interface CaseValue {
  whenKeyword: string;
  whenExpr: OrExpression;
  thenKeyword: string;
  thenExpr: OrExpression;
  spacing: string[];
}

export class CasePart {
  public whenKeyword: string;
  public whenExpr: OrExpression;
  public thenKeyword: string;
  public thenExpr: OrExpression;
  public spacing: string[];

  constructor(options: CaseValue) {
    this.whenKeyword = options.whenKeyword;
    this.whenExpr = options.whenExpr;
    this.thenKeyword = options.thenKeyword;
    this.thenExpr = options.thenExpr;
    this.spacing = options.spacing;
  }

  toString() {
    return (
      this.whenKeyword +
      this.spacing[0] +
      this.whenExpr.toString() +
      this.spacing[1] +
      this.thenKeyword +
      this.spacing[2] +
      this.thenExpr.toString()
    );
  }
}
