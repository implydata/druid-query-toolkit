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

// A minimal fetch-based stand-in for axios.get / axios.post: resolves to { data } and
// rejects with an error that has error.response.data for non 2xx responses
async function request(url, init) {
  const resp = await fetch(url, init);
  const text = await resp.text();
  let data = text;
  if ((resp.headers.get('content-type') || '').includes('application/json')) {
    try {
      data = JSON.parse(text);
    } catch {}
  }

  if (!resp.ok) {
    const e = new Error(`Request failed with status code ${resp.status}`);
    e.response = { status: resp.status, data };
    throw e;
  }

  return { status: resp.status, data };
}

function get(url) {
  return request(url);
}

function post(url, body) {
  return request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

module.exports = { get, post };
