import { Request } from 'express';
import { UserRole } from '@prisma/client';

declare module 'express-serve-static-core' {

    // Adiciona as novas propriedades à interface Request
    interface Request {
        userId?: string;
        userRole?: UserRole;
    }
}