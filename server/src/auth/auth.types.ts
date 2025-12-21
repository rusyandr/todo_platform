export type UserRole = 'host' | 'student';

export interface AuthenticatedUser {
  userId: number;
  email: string;
  name: string;
  role: UserRole;
}
