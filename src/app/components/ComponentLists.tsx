import { startCase } from 'lodash';
import { Metadata } from './util';
import Link from 'next/link';
import Icon from '../components/Icon';
import Image from 'next/image';

export const ComponentList = ({ components }: { components: { [id: string]: Metadata } }) => {
  return (
    <div className="o-row">
      <div className="o-col-12@md">
        <div className="o-stack-2@md o-stack-3@lg u-mb-n-4">
          <>
            {Object.keys(components).map((componentId) => {
              const component = components[componentId];

              return (
                <ComponentsPageCard
                  key={`component-${componentId}`}
                  component={componentId}
                  title={component.title ?? startCase(componentId)}
                  description={component.description}
                  image={component.image}
                />
              );
            })}
          </>
        </div>
      </div>
    </div>
  );
};

export const ComponentsPageCard = ({
  component,
  title,
  description: descripton,
  icon,
  image,
  available = true,
}: {
  component: string;
  title: string;
  description: string;
  icon?: string;
  image?: string;
  available?: boolean;
}) => (
  <div key={`component-${component}`}>
    <Link href={available ? `/components/${component}` : '#'}>
      <div className={`c-component-card ${!available && 'c-component-card--soon'}`}>
        <div className="c-component-card__img">
          {icon && <Icon name={icon} />}
          {image && <Image src={image} alt={title} width={170} height={135} />}
        </div>
        <h6>{title}</h6>
        <p>{descripton}</p>
      </div>
    </Link>
  </div>
);
