import { useRouter } from 'next/router';
import { useEffect } from 'react';

const PatternIndexRedirect = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace('/system');
  }, [router]);

  return null;
};

export default PatternIndexRedirect;
