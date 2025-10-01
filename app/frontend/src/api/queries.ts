// src/api/queries.ts
import { gql } from '@apollo/client';

export const ME = gql`
  query Me {
    me { id email name role handle }
  }
`;

export const USERS = gql`
  query Users {
    users { id email name role }
  }
`;

export const FRIEND_REQUESTS = gql`
  query FriendRequests($direction: String) {
    friendRequests(direction: $direction) {
      id
      status
      from { handle id email }
      to   { handle id email }
      createdAt
      updatedAt
    }
  }
`;

export const FRIENDS = gql`
  query Friends {
    friendsSvc { id handle email }
  }
`;

export const SEARCH_USERS = gql`
  query SearchUsers($q: String!) {
    searchUsers(q: $q) {
      id
      handle
      email
      name
    }
  }
`;
