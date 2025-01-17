import { cn } from '@/lib/utils';
import { ToggleGroup, ToggleGroupItem } from '@radix-ui/react-toggle-group';
import { startCase } from 'lodash';
import { LayoutGrid, Rows } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import HeadersType from '../Typography/Headers';
import { Metadata } from '../util';

interface ComponentMetadata extends Metadata {
  path?: string;
  absolute?: boolean;
}

export const ComponentList = ({ components }: { components: { [id: string]: ComponentMetadata } }) => {
  const [layout, setLayout] = React.useState<string>('grid');
  return (
    <div className="mx-auto w-full">
      <div className="flex flex-col gap-2 pb-7">
        <HeadersType.H2>Components</HeadersType.H2>
        <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">
          Self-contained reusable UI elements that can be used to build larger blocks or design patterns.
        </p>
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
        {Object.keys(components).map((componentId) => {
          const component = components[componentId];

          return (
            <ComponentsPageCard
              key={`component-${componentId}`}
              component={componentId}
              title={component.title ?? startCase(componentId)}
              description={component.description}
              image={component.image}
              layout={layout}
              path={component.path}
              absolute={component.absolute}
            />
          );
        })}
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
  path,
  layout = 'grid',
  available = true,
  absolute = false,
}: {
  component: string;
  title: string;
  description: string;
  icon?: string;
  image?: string;
  path?: string;
  layout?: string;
  available?: boolean;
  absolute?: boolean;
}) => {
  if (!path) path = 'components';
  return (
    <div className={cn(layout === 'single' && 'grid grid-cols-[130px_1fr] items-start gap-6')}>
      <Link href={available ? (absolute ? path : `/system/component/${component}`) : '#'}>
        <img
          src={`${process.env.HANDOFF_APP_BASE_PATH ?? ''}/assets/images/illustration-sample-bw-1.svg`}
          width={1528}
          height={1250}
          alt="Components"
          className="mb-5 rounded-lg"
        />
        <div>
          <h2 className="text-base font-medium">{title}</h2>

          <small className="font-mono text-xs font-light text-gray-400">{Math.floor(Math.random() * 20)} variations</small>
          <p className={cn('text-sm leading-relaxed text-gray-600', layout === 'grid' ? 'mt-2' : 'mt-1')}>{descripton}</p>
        </div>
      </Link>
    </div>
  );
};
