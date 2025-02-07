import { PreviewObject } from '@handoff/types';
import { ToggleGroup, ToggleGroupItem } from '@radix-ui/react-toggle-group';
import { LayoutGrid, Rows } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect } from 'react';
import { cn } from '../../lib/utils';
import HeadersType from '../Typography/Headers';
import { Metadata } from '../util';

interface ComponentMetadata extends Metadata {
  path?: string;
  absolute?: boolean;
}

export const APIComponentList = ({ title, description }: { title?; description? }) => {
  const [components, setComponents] = React.useState<PreviewObject[]>([]);
  const fetchComponents = async () => {
    let data = await fetch(`/api/components.json`).then((res) => res.json());
    setComponents(data as PreviewObject[]);
  };
  useEffect(() => {
    fetchComponents();
  }, []);
  if (components.length === 0) return <p>Loading...</p>;
  return <ComponentList components={components} title={title} description={description} />;
};

export const ComponentList = ({
  components,
  title,
  description,
}: {
  components: PreviewObject[];
  title?: string;
  description?: string;
}) => {
  const [layout, setLayout] = React.useState<string>('grid');

  if (!title) title = 'Components';
  if (!description) description = 'Self-contained reusable UI elements that can be used to build larger blocks or design patterns.';
  return (
    <div className="mx-auto w-full">
      <div className="flex flex-col gap-2 pb-7">
        <HeadersType.H2>{title}</HeadersType.H2>
        <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">{description}</p>
      </div>
      <div className="mb-4 flex justify-end">
        <ToggleGroup type="single" value={layout} onValueChange={(value) => value && setLayout(value)}>
          <ToggleGroupItem value="grid" aria-label="Grid layout">
            <LayoutGrid className="h-4 w-4" strokeWidth={1.5} />
          </ToggleGroupItem>
          <ToggleGroupItem value="single" aria-label="Single column layout">
            <Rows className="h-4 w-4" strokeWidth={1.5} />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div
        className={cn(
          'grid',
          layout === 'grid' ? 'grid-cols-1 gap-10 min-[800px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4' : 'grid-cols-1 gap-2'
        )}
      >
        {components.map((component) => {
          return <ComponentsPageCard key={`component-${component.id}`} component={component} layout={layout} />;
        })}
      </div>
    </div>
  );
};

const ComponentsPageCard = ({ component, layout }: { component: PreviewObject; layout: string }) => {
  return (
    <AbstractComponentsPageCard
      id={component.id}
      title={component.title}
      description={component.description}
      variations={component.previews ? Object.keys(component.previews).length : 0}
      layout={layout}
    />
  );
};

export const AbstractComponentsPageCard = ({
  id,
  title,
  description,
  variations,
  icon,
  image,
  path,
  layout = 'grid',
  available = true,
  absolute = false,
}: {
  id: string;
  title: string;
  description: string;
  icon?: string;
  image?: string;
  path?: string;
  layout?: string;
  available?: boolean;
  absolute?: boolean;
  variations?: number;
}) => {
  if (!path) path = 'components';
  // trim description to 200 characters at a word boundary
  if (description.length > 85) {
    description = description.substring(0, description.lastIndexOf(' ', 85)) + '...';
  }
  return (
    <div className={cn(layout === 'single' && 'grid grid-cols-[130px_1fr] items-start gap-6')}>
      <Link href={available ? (absolute ? path : `/system/component/${id}`) : '#'}>
        <img
          src={`${process.env.HANDOFF_APP_BASE_PATH ?? ''}/assets/images/illustration-sample-bw-1.svg`}
          width={1528}
          height={1250}
          alt="Components"
          className="mb-5 rounded-lg"
        />
        <div>
          <h2 className="text-base font-medium">{title}</h2>
          {variations && <small className="font-mono text-xs font-light text-gray-400">{variations} variations</small>}
          <p className={cn('text-sm leading-relaxed text-gray-600', layout === 'grid' ? 'mt-2' : 'mt-1')}>{description}</p>
        </div>
      </Link>
    </div>
  );
};
