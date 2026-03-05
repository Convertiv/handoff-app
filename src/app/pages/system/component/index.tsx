import { useEffect } from 'react';
import { useRouter } from 'next/router';

const ComponentIndexRedirect = () => {
  const router = useRouter();
  const basePath = process.env.HANDOFF_APP_BASE_PATH ?? '';

  useEffect(() => {
    router.replace(`${basePath}/system`);
  }, [router, basePath]);

  return null;
};

export default ComponentIndexRedirect;
