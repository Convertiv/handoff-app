import Footer from './Footer';
import Header from './Header';
import Icon from './Icon';
import CustomNav from './SideNav/Custom';
import startCase from 'lodash/startCase';
import Head from 'next/head';
import { SectionLink } from './util';
import { ClientConfig } from '../../types/config';

export default function MarkdownLayout({
  metadata,
  children,
}: {
  metadata: {
    metaTitle: string;
    metaDescription: string;
    title: string;
    description: string;
    image?: string;
    menu: SectionLink[];
    config: ClientConfig;
current: SectionLink;
  };
  children: React.ReactNode;
}) {
  return (
    <div className="c-page">
      <Head>
        <title>{metadata.metaTitle}</title>
        <meta name="description" content={metadata.metaDescription} />
      </Head>
      <Header menu={metadata.menu} config={metadata.config} />
      {metadata.current && metadata.current.subSections.length > 0 && <CustomNav menu={metadata.current} />}
      <section className="c-content">
        <div className="o-container-fluid">
          <div className="c-hero">
            <div>
              <h1>{metadata.title}</h1>
              <p>{metadata.description}</p>
            </div>
            {metadata.image && <Icon name={metadata.image} className="c-hero__img" />}
            <div className="c-tabs">

                <button
                  className={`c-tabs__item`}
                >
                  Overview
                </button>

              <button
                className={`c-tabs__item`}
              >
                Tokens
              </button>
            </div>
          </div>
          <div className="o-row">{children}</div>
        </div>
      </section>
      <Footer config={metadata.config} />
    </div>
  );
}
