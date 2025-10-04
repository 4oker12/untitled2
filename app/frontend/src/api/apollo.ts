// src/api/apollo.ts
import { ApolloClient, HttpLink, InMemoryCache, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

/**
 * URL BFF GraphQL. Задай VITE_GRAPHQL_URL в .env, иначе — дефолт.
 * Примеры:
 *   VITE_GRAPHQL_URL=http://localhost:4000/graphql
 */
const uri: string =
    (import.meta as any).env?.VITE_GRAPHQL_URL ?? 'http://localhost:4000/graphql';

/** HTTP transport (шлём куки на BFF) */
const httpLink = new HttpLink({
  uri,
  credentials: 'include',
});

/**
 * Авторизация: добавляем Authorization: Bearer <token> из localStorage,
 * если он сохранён после логина.
 */
const authLink = setContext((_, { headers }) => {
  const token = typeof window !== 'undefined'
      ? window.localStorage.getItem('accessToken')
      : null;

  const nextHeaders: Record<string, string> = {
    ...(headers as Record<string, string> | undefined),
  };

  if (token) {
    nextHeaders['authorization'] = `Bearer ${token}`;
  }

  return { headers: nextHeaders };
});

/**
 * (Опционально) CSRF: если используешь meta[name="csrf-token"], прокинем заголовок.
 * Можно удалить, если не нужен.
 */
const csrfLink = setContext((_, { headers }) => {
  let csrf: string | null = null;
  if (typeof document !== 'undefined') {
    const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
    csrf = meta?.content ?? null;
  }

  const nextHeaders: Record<string, string> = {
    ...(headers as Record<string, string> | undefined),
  };

  if (csrf) {
    nextHeaders['x-csrf-token'] = csrf;
  }

  return { headers: nextHeaders };
});

/** Логирование ошибок (по желанию можно расширить refresh-логикой) */
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors?.length) {
    for (const err of graphQLErrors) {
      // eslint-disable-next-line no-console
      console.error('[GraphQL error]', err.message, err.extensions);
    }
  }
  if (networkError) {
    // eslint-disable-next-line no-console
    console.error('[Network error]', networkError);
  }
});

/**
 * Кэш. По умолчанию достаточно.
 * При желании можешь настроить typePolicies для messages/pagination.
 */
const cache = new InMemoryCache({
  // example:
  // typePolicies: {
  //   Query: {
  //     fields: {
  //       messages: {
  //         keyArgs: ['input', ['withUserId']], // кэш отдельно для каждого собеседника
  //         merge(_existing = [], incoming: any[]) {
  //           return incoming; // простая замена (или склеить при пагинации)
  //         },
  //       },
  //     },
  //   },
  // },
});

export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, csrfLink, httpLink]),
  cache,
});
