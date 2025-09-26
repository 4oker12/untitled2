import { Field, ID, InputType, ObjectType, registerEnumType } from '@nestjs/graphql';

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


// [ADDED] Статус заявки в друзья
export enum FriendRequestStatusGql {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  CANCELED = 'CANCELED',
}
registerEnumType(FriendRequestStatusGql, { name: 'FriendRequestStatus' });

// [ADDED] Модель заявки в друзья
@ObjectType('FriendRequest')
export class FriendRequestGql {
  @Field(() => ID) id!: string;

  @Field(() => UserGql, { nullable: true })
  from?: UserGql | null;

  @Field(() => UserGql, { nullable: true })
  to?: UserGql | null;

  @Field(() => FriendRequestStatusGql, { nullable: true })
  status?: FriendRequestStatusGql | null;

  // оставим строкой, чтобы не тянуть Date scalar
  @Field(() => String, { nullable: true })
  createdAt?: string | null;

  @Field(() => String, { nullable: true })
  updatedAt?: string | null;
}
