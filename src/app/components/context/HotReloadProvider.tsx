import { createContext, ReactNode, useEffect, useState } from 'react';

interface HotReloadContextProps {
  reloadCounter: number;
}

export const HotReloadContext = createContext<HotReloadContextProps>({ reloadCounter: 0 });

export const HotReloadProvider = ({ connect, children }: { connect: boolean; children: ReactNode }) => {
  const [reloadCounter, setReloadCounter] = useState(0);

  useEffect(() => {
    if (!connect) {
      return;
    }

    const ws = new WebSocket('ws://localhost:3001');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'reload') {
        // Increment counter when a message is received
        setReloadCounter((prev) => prev + 1);
      }
    };

    ws.onerror = (err) => console.error('WebSocket error:', err);

    return () => {
      ws.close();
    };
  }, [connect]);

  return <HotReloadContext.Provider value={{ reloadCounter }}>{children}</HotReloadContext.Provider>;
};
