import { AUTH_TOKEN_KEY } from "./authTokenKey.ts";

export function getAuthHeaders(): Record<string, string> {
    const token = sessionStorage.getItem(AUTH_TOKEN_KEY);

    if (!token) {
        return {};
    }

    return { Authorization: `Bearer ${token}` };
}

export function getCurrentUserId(): string | null {
    return sessionStorage.getItem(AUTH_TOKEN_KEY);
}
