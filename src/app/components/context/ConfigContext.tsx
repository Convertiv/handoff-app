import React, { createContext, useContext, useState } from 'react';
import { ClientConfig } from '@handoff/types/config';
import { SectionLink } from '../util';
interface IConfigContext {
  config?: ClientConfig;
  setConfig: (config: ClientConfig) => void;
  menu?: SectionLink[];
  setMenu: (menu: SectionLink[]) => void;
}
interface IConfigContextProviderProps {
  children: React.ReactNode;
  defaultConfig?: ClientConfig;
  defaultMenu?: SectionLink[];
}

export const ConfigContext = createContext<IConfigContext | undefined>(undefined);

export const ConfigContextProvider: React.FC<IConfigContextProviderProps> = ({ children, defaultConfig, defaultMenu }) => {
  const [config, setConfig] = useState<ClientConfig>(defaultConfig);
  const [menu, setMenu] = useState<SectionLink[]>(defaultMenu);
  return (
    <ConfigContext.Provider
      value={{
        config,
        setConfig,
        menu,
        setMenu,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfigContext = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfigContext must be used within a ConfigContext.');
  }
  return context;
};
