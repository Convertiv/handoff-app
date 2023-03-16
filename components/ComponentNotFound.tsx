import * as util from 'components/util';
import Head from 'next/head';
import Header from './Header';
import Icon from './Icon';
import CustomNav from './SideNav/Custom';
export interface ComponentNotFoundProps extends util.DocumentationProps {
  children?: JSX.Element;
}
export const ComponentNotFound: React.FC<ComponentNotFoundProps> = ({ metadata, menu, current, children }) => {
  return (
    <div className="c-page">
      <Head>
        <title>{metadata.metaTitle}</title>
        <meta name="description" content={metadata.metaDescription} />
      </Head>
      <Header menu={menu} />
      {current.subSections.length > 0 && <CustomNav menu={current} />}
      <section className="c-content">
        <div className="o-container-fluid">
          <div className="c-hero">
            <div>
              <h1>{metadata.title}</h1>
              <p>{metadata.description}</p>
            </div>
            {metadata.image && <Icon name={metadata.image} className="c-hero__img" />}
          </div>
        </div>
      </section>
    </div>
  );
};
