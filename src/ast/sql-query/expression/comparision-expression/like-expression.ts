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

import { StringType } from '../../..';

export interface LikeExpressionValue {
  keyword: string;
  ex: StringType | Function;
  spacing: string[];
  escapeKeyword?: string;
  escape?: StringType;
}

export class LikeExpression {
  public keyword: string;
  public ex: StringType | Function;
  public spacing: string[];
  public escapeKeyword?: string;
  public escape?: StringType;

  constructor(options: LikeExpressionValue) {
    this.keyword = options.keyword;
    this.ex = options.ex;
    this.spacing = options.spacing;
    this.escape = options.escape;
    this.escapeKeyword = options.escapeKeyword;
    this.spacing = options.spacing;
  }

  toString() {
    const val: string[] = [this.keyword + this.spacing[0] + this.ex.toString()];
    if (this.escape) {
      val.push(this.spacing[1] + this.escapeKeyword + this.spacing[2] + this.escape);
    }
    return val.join('');
  }
}
