export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  jti?: string; //refresh token id
}