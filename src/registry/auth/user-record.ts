import type { RegistryUser } from './types';

export const toRegistryUser = (row: {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: RegistryUser['role'];
  status: RegistryUser['status'];
  emailVerifiedAt: Date | null;
  authVersion: number;
  createdAt: Date;
  updatedAt: Date;
}): RegistryUser => ({
  id: row.id,
  email: row.email,
  name: row.name,
  image: row.image,
  role: row.role,
  status: row.status,
  emailVerifiedAt: row.emailVerifiedAt,
  authVersion: row.authVersion,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});
