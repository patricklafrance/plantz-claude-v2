export function getUserId(request: Request): string | null {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
        return null;
    }

    return authHeader.slice("Bearer ".length);
}
