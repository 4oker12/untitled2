import { ApolloClient, HttpLink, InMemoryCache, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const uri = import.meta.env.VITE_GRAPHQL_URL as string;

// Helper: read cookie by name
function getCookie(name: string): string | null {
  const match = document.cookie.split('; ').find((row) => row.startsWith(name + '='));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

const httpLink = new HttpLink({ uri, credentials: 'include' });

// Optionally attach x-csrf from cookie named 'csrf' if present, but only for auth-changing mutations
const csrfLink = setContext((operation, prevContext) => {
  const headers = { ...(prevContext.headers || {}) } as Record<string, string>;
  const def = operation.query.definitions.find(
    (d: any) => d.kind === 'OperationDefinition',
  ) as any;
  const opName = operation.operationName || def?.name?.value;
  const authChanging = def?.operation === 'mutation' && (
    opName === 'Register' || opName === 'Login' || opName === 'Refresh' || opName === 'Logout'
  );
  if (authChanging) {
    const csrf = getCookie('csrf');
    if (csrf) headers['x-csrf'] = csrf;
  }
  return { headers };
});

export const apolloClient = new ApolloClient({
  link: from([csrfLink, httpLink]),
  cache: new InMemoryCache(),
});
