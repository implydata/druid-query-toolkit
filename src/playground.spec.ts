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
import { sqlParserFactory } from './parser/druidsql';
import { FUNCTIONS } from './test-utils';

const parser = sqlParserFactory(FUNCTIONS);

describe.skip('Playground 1', () => {
  it('basic', () => {
    expect(
      parser(
        `("task_id"!='index_kafka_twitter-v2_4783a5f7782897d_phfbmpeo' OR "datasource"!='flow0') And 1 + 1`,
      ),
    ).toEqual({});
  });
  it('basic', () => {
    expect(
      parser(
        `("task_id"!='index_kafka_twitter_2d7ff8cb0e3dbed_jnkjiceg' AND "task_id"!='index_kafka_twitter_2d7ff8cb0e3dbed_jnkjiceg')`,
      ).toString(),
    ).toEqual({});
  });
});
