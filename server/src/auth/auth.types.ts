export type UserRole = 'teacher' | 'student';

export interface AuthenticatedUser {
  userId: number;
  email: string;
  name: string;
  role: UserRole;
}
