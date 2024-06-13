import Footer from './Footer';
import Header from './Header';
import Icon from './Icon';
import CustomNav from './SideNav/Custom';
import startCase from 'lodash/startCase';
import Head from 'next/head';
export default function MarkdownLayout(metadata, menu, config, current, id, hasPreviews, activeTab, setActiveTab, ComponentTab, children) {
  return (
    <div className="c-page">
      <Head>
        <title>{metadata.metaTitle}</title>
        <meta name="description" content={metadata.metaDescription} />
      </Head>
      <Header menu={menu} config={config} />
      {current.subSections.length > 0 && <CustomNav menu={current} />}
      <section className="c-content">
        <div className="o-container-fluid">
          <div className="c-hero">
            <div>
              <h1>{metadata.title ?? startCase(id)}</h1>
              <p>{metadata.description}</p>
            </div>
            {metadata.image && <Icon name={metadata.image} className="c-hero__img" />}
            <div className="c-tabs">
              {hasPreviews && (
                <button
                  className={`c-tabs__item ${activeTab === ComponentTab.Overview ? 'is-selected' : ''}`}
                  onClick={() => setActiveTab(ComponentTab.Overview)}
                >
                  Overview
                </button>
              )}
              <button
                className={`c-tabs__item ${activeTab === ComponentTab.DesignTokens ? 'is-selected' : ''}`}
                onClick={() => setActiveTab(ComponentTab.DesignTokens)}
              >
                Tokens
              </button>
            </div>
          </div>
                  <div className="o-row">
                      {children}
          </div>
        </div>
      </section>
      <Footer config={config} />
    </div>
  );
}
