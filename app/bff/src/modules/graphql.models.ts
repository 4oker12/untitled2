import { Field, ID, Int, InputType, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum RoleGql {
  ADMIN = 'ADMIN',
  USER = 'USER',
}
registerEnumType(RoleGql, { name: 'Role' });

@ObjectType('User')
export class UserGql {
  @Field(() => ID) id!: string;
  @Field(() => String) email!: string;
  @Field(() => String, { nullable: true }) name?: string | null;
  @Field(() => RoleGql, { nullable: true }) role?: RoleGql | null;
  @Field(() => String, { nullable: true }) handle?: string | null;
}

@InputType('RegisterInput')
export class RegisterInput {
  @Field(() => String) email!: string;
  @Field(() => String) password!: string;
  @Field(() => String, { nullable: true }) name?: string | null;
  @Field(() => String, { nullable: true }) handle?: string | null;
}

@InputType('LoginInput')
export class LoginInput {
  @Field(() => String) email!: string;
  @Field(() => String) password!: string;
}

@ObjectType('AuthPayload')
export class AuthPayloadGql {
  @Field(() => String, { nullable: true })
  accessToken!: string | null;

  @Field(() => String, { nullable: true })
  refreshToken?: string | null;

  @Field(() => UserGql, { nullable: true })
  user?: UserGql | null;
}

// ---- Friends ----
export enum FriendRequestStatusGql {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  CANCELED = 'CANCELED',
}
registerEnumType(FriendRequestStatusGql, { name: 'FriendRequestStatus' });

@ObjectType('FriendRequest')
export class FriendRequestGql {
  @Field(() => ID) id!: string;
  @Field(() => UserGql, { nullable: true }) from?: UserGql | null;
  @Field(() => UserGql, { nullable: true }) to?: UserGql | null;
  @Field(() => FriendRequestStatusGql, { nullable: true }) status?: FriendRequestStatusGql | null;
  @Field(() => String, { nullable: true }) createdAt?: string | null;
  @Field(() => String, { nullable: true }) updatedAt?: string | null;
}

// [ADDED] вход для универсальной мутации
@InputType('SendFriendRequestInput')
export class SendFriendRequestInput {
  @Field(() => String, { nullable: true }) userId?: string;
  @Field(() => String, { nullable: true }) toHandle?: string;
}

@ObjectType('Message')
export class MessageGql {
  @Field(() => ID) id!: string;
  @Field(() => ID) fromUserId!: string;
  @Field(() => ID) toUserId!: string;
  @Field(() => String) body!: string;
  @Field(() => String) createdAt!: string;
  @Field(() => String, { nullable: true }) readAt?: string | null;
}

@InputType('SendMessageInput')
export class SendMessageInput {
  @Field(() => ID) toUserId!: string;
  @Field(() => String) body!: string;
}

@InputType('MessagesPageInput')
export class MessagesPageInput {
  @Field(() => ID) withUserId!: string;
  @Field(() => ID, { nullable: true }) cursor?: string;
  @Field(() => Int, { nullable: true }) take?: number;
}

@ObjectType('UnreadByUser')
export class UnreadByUserGql {
  @Field(() => ID) userId!: string;
  @Field(() => Int) count!: number;
}

@ObjectType('UnreadSummary')
export class UnreadSummaryGql {
  @Field(() => Int) total!: number;
  @Field(() => [UnreadByUserGql]) byUser!: UnreadByUserGql[];
}