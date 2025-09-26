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
