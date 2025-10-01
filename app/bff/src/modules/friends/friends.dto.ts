// app/bff/src/modules/friends.friends.users.dto.ts
// [ADDED] Минимальные интерфейсы для ответов бэкенда по друзьям/поиску

export interface PublicUserDto {
    id: string | number;
    email?: string;
    name?: string | null;
    role?: 'ADMIN' | 'USER' | string | null;
    handle?: string | null;
}

export interface FriendRequestDto {
    id: string | number;
    from?: PublicUserDto | null;
    to?: PublicUserDto | null;
    status?:
        | 'PENDING'
        | 'ACCEPTED'
        | 'DECLINED'
        | 'CANCELED'
        | 'CANCELLED'
        | string
        | null;
    createdAt?: string | null;
    updatedAt?: string | null;
}