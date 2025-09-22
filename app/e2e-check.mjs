// Quick end-to-end sanity check for BFF ⇄ Backend auth flow
// Usage: start Backend (5000), BFF (4000), Frontend (5173 optional)
// Then run: node app/e2e-check.mjs

import fetch from 'node-fetch';

const GQL = process.env.GQL || 'http://localhost:4000/graphql';

function cookieFromHeaders(resp) {
  const set = resp.headers.raw()['set-cookie'] || [];
  return set.map((c) => c.split(';')[0]).join('; ');
}

async function callGraphQL({ query, variables }, cookies = '') {
  const resp = await fetch(GQL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(cookies ? { cookie: cookies } : {}),
    },
    body: JSON.stringify({ query, variables }),
    redirect: 'manual',
  });
  const newCookies = cookieFromHeaders(resp);
  const json = await resp.json().catch(() => null);
  if (!resp.ok || !json || json.errors) {
    console.error('HTTP status:', resp.status, resp.statusText);
    console.error('Response JSON:', JSON.stringify(json, null, 2));
    throw new Error('GraphQL call failed');
  }
  return { data: json.data, cookies: newCookies };
}

const qHello = `query { hello }`;
const qMe = `query { me { id email name role } }`;
const mRegister = `mutation Register($input: RegisterInput!) { register(input: $input) { user { id email name role } } }`;
const mLogin = `mutation Login($input: LoginInput!) { login(input: $input) { user { id email name role } } }`;
const mRefresh = `mutation { refresh { user { id email name role } } }`;
const mLogout = `mutation { logout }`;

(async () => {
  const rnd = Math.random().toString(36).slice(2, 8);
  const email = `e2e_${rnd}@example.com`;
  const password = 'Password123!';

  console.log('Checking hello...');
  const hello = await callGraphQL({ query: qHello });
  console.log('hello =', hello.data.hello);

  let cookies = '';

  console.log('Registering:', email);
  let r = await callGraphQL({ query: mRegister, variables: { input: { email, password, name: 'E2E' } } }, cookies);
  cookies = [cookies, r.cookies].filter(Boolean).join('; ');
  console.log('Registered user:', r.data.register.user);

  console.log('Me after register...');
  r = await callGraphQL({ query: qMe }, cookies);
  console.log('Me =', r.data.me);

  console.log('Refreshing...');
  r = await callGraphQL({ query: mRefresh }, cookies);
  cookies = [cookies, r.cookies].filter(Boolean).join('; ');
  console.log('Refreshed user:', r.data.refresh.user);

  console.log('Logging out...');
  r = await callGraphQL({ query: mLogout }, cookies);
  cookies = [cookies, r.cookies].filter(Boolean).join('; ');
  console.log('Logout ok =', r.data.logout);

  console.log('Logging in again...');
  r = await callGraphQL({ query: mLogin, variables: { input: { email, password } } }, cookies);
  cookies = [cookies, r.cookies].filter(Boolean).join('; ');
  console.log('Login user:', r.data.login.user);

  console.log('Me after login...');
  r = await callGraphQL({ query: qMe }, cookies);
  console.log('Me =', r.data.me);

  console.log('\nE2E flow complete.');
})().catch((e) => {
  console.error('E2E check failed:', e);
  process.exit(1);
});
