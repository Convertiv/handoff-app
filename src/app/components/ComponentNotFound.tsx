import * as util from './util';
import Head from 'next/head';
import Header from './Header';
import Icon from './Icon';
import CustomNav from './SideNav/Custom';
import Footer from './Footer';
export interface ComponentNotFoundProps extends util.DocumentationProps {
  children?: JSX.Element;
}
export const ComponentNotFound: React.FC<ComponentNotFoundProps> = ({ metadata, menu, current, children, config }) => {
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
              <h1>{`${metadata.title} Not Found`}</h1>
              <p>
                No <span>{metadata.title.toLowerCase()}</span> tokens were found. Either they couldn&rsquo;t be extracted from figma, or the component was not found in figma.
                Check to make sure that the component is being imported on fetch. If you see a red message indicating the component cannot
                be retrieved, check to make sure the component exists in figma.
              <br />
              <br />
                <a href="https://www.handoff.com/docs/tokens/not-found">Read More</a>
              </p>
            </div>
            {metadata.image && <Icon name={metadata.image} className="c-hero__img" />}
          </div>
        </div>
      </section>
      <Footer config={config} />
    </div>
  );
};
