import Cookies from "js-cookie";

const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";

export function getToken(): string | undefined {
    return Cookies.get(TOKEN_KEY);
}

export function getRefreshToken(): string | undefined {
    return Cookies.get(REFRESH_TOKEN_KEY);
}

export function setToken(token: string, refreshToken?: string): void {
    // Access token expires in 15 minutes
    const in15Minutes = new Date(new Date().getTime() + 15 * 60 * 1000);
    Cookies.set(TOKEN_KEY, token, { expires: in15Minutes, sameSite: "strict" });
    if (refreshToken) {
        setRefreshToken(refreshToken);
    }
}

export function setRefreshToken(token: string): void {
    // Refresh token expires in 7 days
    Cookies.set(REFRESH_TOKEN_KEY, token, { expires: 7, sameSite: "strict" });
}

export function removeToken(): void {
    Cookies.remove(TOKEN_KEY);
    Cookies.remove(REFRESH_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
    return !!getToken() || !!getRefreshToken();
}

