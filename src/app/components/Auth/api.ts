const basePath = process.env.HANDOFF_APP_BASE_PATH ?? '';

export const authApiUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${basePath}${normalizedPath}`;
};

export const authPageUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${basePath}${normalizedPath}`;
};

export const readApiError = async (response: Response, fallback: string): Promise<string> => {
  const body = (await response.json().catch(() => null)) as { error?: string | { message?: string }; message?: string } | null;

  if (typeof body?.error === 'string') return body.error;
  if (typeof body?.error === 'object' && body.error?.message) return body.error.message;
  if (body?.message) return body.message;
  return fallback;
};
