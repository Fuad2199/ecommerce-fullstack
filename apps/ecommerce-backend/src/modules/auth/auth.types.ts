export type TokenResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
};

export type RefreshPayload = {
  sub: string;
  type?: 'refresh' | 'access';
};
