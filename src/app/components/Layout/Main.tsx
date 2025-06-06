import { ComponentDocumentationOptions } from '@handoff/types';
import { ClientConfig } from '@handoff/types/config';
import Head from 'next/head';
import { Header } from '../../components/Layout/Header';
import { ThemeProvider } from '../../components/util/theme-provider';
import SideNav from '../Navigation/SideNav';
import { ConfigContextProvider } from '../context/ConfigContext';
import { SidebarInset, SidebarProvider } from '../ui/sidebar';
import { SectionLink } from '../util';

interface LayoutComponentProps {
  metadata: {
    [key: string]: any;
  };
  content: string;
  options: ComponentDocumentationOptions;
  menu: SectionLink[];
  current: any[] | SectionLink;
  config: ClientConfig;
  children: React.ReactNode;
  fullWidthHero?: boolean;
}
export default function Layout<LayoutComponentProps>({ children, config, menu, metadata, current, fullWidthHero = false }) {
  return (
    <div>
      <ConfigContextProvider defaultConfig={config} defaultMenu={menu}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Head>
            <title>{metadata.metaTitle}</title>
            <meta name="description" content={metadata.metaDescription} />
          </Head>
          <div className="absolute left-[-200px] top-[-200px] z-[-1] h-[400px] w-[600px] bg-[#111111] opacity-[0.05] blur-[350px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {/* <img
              src={`${process.env.HANDOFF_APP_BASE_PATH ?? ''}/assets/images/back.png`}
              width={1528}
              height={1250}
              alt="Components"
              className="rounded-lg mb-5"
            /> */}
          </div>
          <Header />

          <div className="container mx-auto min-h-screen max-w-[1500px]">
            {fullWidthHero ? (
              <div className="w-full">
                <div className="relative bg-transparent px-0 lg:gap-10 xl:grid">
                  <div className="mx-auto w-full">{children}</div>
                </div>
              </div>
            ) : current ? (
              <SidebarProvider>
                <div className="flex w-full">
                  <SideNav menu={current} />
                  <SidebarInset className="relative bg-transparent py-8 pl-8 pr-8 md:pl-8 lg:gap-10 lg:py-16 lg:pl-16">
                    <div className="mx-auto w-full">{children}</div>
                  </SidebarInset>
                </div>
              </SidebarProvider>
            ) : (
              <div className="flex w-full">
                <div className="relative bg-transparent px-16 py-8 lg:gap-10 lg:py-16 xl:grid">
                  <div className="mx-auto w-full">{children}</div>
                </div>
              </div>
            )}
          </div>
        </ThemeProvider>
      </ConfigContextProvider>
    </div>
  );
}
