// src/modules/backend.module.ts
import { Module, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { CONTEXT } from '@nestjs/graphql';
import type { Request } from 'express';
import { BackendClient } from './backend.client.js';

@Module({
    providers: [
        {
            provide: BackendClient,
            scope: Scope.REQUEST,
            // [FIX] Support both REST (REQUEST) and GraphQL (CONTEXT with ctx.req)
            useFactory: (req: Request | undefined, gqlCtx: any | undefined) => {
                const base = process.env.BACKEND_URL ?? 'http://localhost:5000';
                const request: Request | undefined = req ?? (gqlCtx?.req as Request | undefined);

                return new BackendClient(base, () => {
                    const headers: Record<string, string> = {};
                    const h = request?.headers;
                    if (h?.cookie) headers['cookie'] = String(h.cookie);
                    if (h?.authorization) headers['authorization'] = String(h.authorization);
                    return headers;
                });
            },
            inject: [REQUEST, CONTEXT],
        },
    ],
    exports: [BackendClient],
})
export class BackendModule {}
