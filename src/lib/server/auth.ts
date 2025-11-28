import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '$env/dynamic/private';

const JWT_SECRET = env.JWT_SECRET || 'fallback-secret-do-not-use-in-prod';

export const hashPassword = async (password: string) => {
    return await bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hash: string) => {
    return await bcrypt.compare(password, hash);
};

export const createToken = (userId: number) => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string) => {
    try {
        return jwt.verify(token, JWT_SECRET) as { userId: number };
    } catch {
        return null;
    }
};
