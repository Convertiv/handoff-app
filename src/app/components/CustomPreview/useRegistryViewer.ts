'use client';

import { useSession } from 'next-auth/react';

// Call only in registry mode, where the session provider is mounted.
export const useRegistryViewer = (): { id: string; role?: string } | null => {
  const { data: session } = useSession();
  const user = session?.user as { id?: string; role?: string } | undefined;
  return user?.id ? { id: user.id, role: user.role } : null;
};

export const canEditCustomPreview = (viewer: { id: string; role?: string } | null, createdBy: { id: string } | null): boolean =>
  Boolean(viewer) && (viewer!.role === 'admin' || createdBy?.id === viewer!.id);
