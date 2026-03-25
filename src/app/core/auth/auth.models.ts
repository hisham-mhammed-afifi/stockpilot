// CONCEPT: Global State - Auth models define the contract for the auth flow.
// These types are used by the AuthStore, AuthApiService, and login component.

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  image: string;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error';
