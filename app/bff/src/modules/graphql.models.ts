// src/modules/graphql.models.ts
// [NOTE] Явно указываем типы в @Field для всех string-полей и enum.
// Это устраняет UndefinedTypeError при сборке схемы.

import { Field, ID, InputType, ObjectType, registerEnumType } from '@nestjs/graphql';

// [ADDED] Enum для роли вместо string union
export enum RoleGql {
  ADMIN = 'ADMIN',
  USER = 'USER',
}
registerEnumType(RoleGql, { name: 'Role' });

@ObjectType()
export class UserGql {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  email!: string;

  // [FIX] Явно указываем тип String и nullable
  @Field(() => String, { nullable: true })
  name?: string | null;

  // [FIX] Явно указываем enum тип и nullable
  @Field(() => RoleGql, { nullable: true })
  role?: RoleGql | null;

  // [FIX] Явно указываем тип String и nullable
  @Field(() => String, { nullable: true })
  handle?: string | null;
}

// ---------- Inputs ----------

@InputType()
export class RegisterInput {
  @Field(() => String)
  email!: string;

  @Field(() => String)
  password!: string;

  // [FIX] явные типы
  @Field(() => String, { nullable: true })
  name?: string | null;

  @Field(() => String, { nullable: true })
  handle?: string | null;
}

@InputType()
export class LoginInput {
  @Field(() => String)
  email!: string;

  @Field(() => String)
  password!: string;
}
