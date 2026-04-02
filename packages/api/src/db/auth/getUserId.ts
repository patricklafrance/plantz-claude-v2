import { AUTH_TOKEN_KEY } from "../../entities/auth/types.ts";

export function getUserId(): string | null {
    return sessionStorage.getItem(AUTH_TOKEN_KEY);
}
