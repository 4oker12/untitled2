import { gql } from '@apollo/client';

export const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      id
      email
      name
      role
      handle
    }
  }
`;

export const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      refreshToken
      user {
        id
        email
        name
        role
        handle
      }
    }
  }
`;

export const LOGOUT = gql`
  mutation Logout {
    logout
  }
`;

export const REFRESH = gql`
  mutation Refresh {
    refresh {
      accessToken
      user {
        id
        email
        name
        role
        handle
      }
    }
  }
`;

export const CREATE_USER = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) { id email name role }
  }
`;

export const SEND_FRIEND_REQUEST = gql`
  mutation SendFriendRequest($input: SendFriendRequestInput!) {
    sendFriendRequest(input: $input) {
      id
      status
      from { handle }
      to   { handle }
    }
  }
`;

export const ACCEPT_FRIEND_REQUEST = gql`
  mutation AcceptFriendRequest($id: ID!) {
    acceptFriendRequest(id: $id) { id status }
  }
`;

export const DECLINE_FRIEND_REQUEST = gql`
  mutation DeclineFriendRequest($id: ID!) {
    declineFriendRequest(id: $id) { id status }
  }
`;

export const CANCEL_FRIEND_REQUEST = gql`
  mutation CancelFriendRequest($id: ID!) {
    cancelFriendRequest(id: $id) { id status }
  }
`;
