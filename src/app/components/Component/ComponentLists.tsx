import { PreviewObject } from '@handoff/types';
import { ToggleGroup, ToggleGroupItem } from '@radix-ui/react-toggle-group';
import { Group, LayoutGrid, Rows } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect } from 'react';
import { cn } from '../../lib/utils';
import HeadersType from '../Typography/Headers';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Metadata } from '../util';

interface ComponentMetadata extends Metadata {
  path?: string;
  absolute?: boolean;
}

export const APIComponentList = ({ components, title, description }: { components; title?; description?}) => {
  if ((components ?? []).length === 0) return <p>No components found.</p>;
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
  const [layout, setLayout] = React.useState<string>(window.localStorage.getItem('handoff-grid-layout') || 'grid');
  const [groupBy, setGroupBy] = React.useState<boolean>(false);
  const [search, setSearch] = React.useState<string>('');
  const [category, setCategory] = React.useState<string>('');
  const [list, setList] = React.useState<PreviewObject[]>(components);
  const [groupedList, setGroupedList] = React.useState<Record<string, PreviewObject[]>>({});

  const categories = React.useMemo(() => {
    const categories = new Set(components.map((component) => component.group).flat());
    return Array.from(categories);
  }, [components]);

  useEffect(() => {
    setGroupedList(list.sort((a, b) => a.group.localeCompare(b.group)).reduce((acc, component) => {
      acc[component.group] = [...(acc[component.group] || []), component];
      return acc;
    }, {}));
  }, [list]);

  useEffect(() => {
    // filter list by search
    let filteredList = components.filter((component) => {
      return component.title.toLowerCase().includes(search) || component.description.toLowerCase().includes(search);
    });
    if (category && category !== 'all') {
      filteredList = filteredList.filter((component) => {
        return component.group === category;
      });
    }
    setList(filteredList);
    // @ts-ignore 
  }, [search, category]);

  const storeLayout = (value) => {
    setLayout(value);
    window.localStorage.setItem('handoff-grid-layout', value);
  };
  if (!title) title = 'Components';
  if (!description) description = 'Self-contained reusable UI elements that can be used to build larger blocks or design patterns.';
  return (
    <div className="mx-auto w-full">
      <div className="flex flex-col gap-2 pb-7">
        <HeadersType.H2>{title}</HeadersType.H2>
        <p className="text-lg leading-relaxed text-gray-600 dark:text-gray-300">{description}</p>
      </div>
      <div className="mb-4 flex justify-between">
        <div className="mr-auto flex items-center gap-3">
          <Input
            type="text"
            placeholder="Search components..."
            className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm focus:border-blue-400 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            onChange={e => setSearch(e.currentTarget.value)}
            aria-label="Search components"
            style={{ minWidth: 200 }}
          />
          <Select
            value={category}
            onValueChange={val => {
              setCategory(val);
            }}
            aria-label="Filter by category"
          >
            <SelectTrigger className="rounded-md border border-gray-300 bg-white py-1 px-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" onClick={() => setGroupBy(true)}>
                <Group className="h-4 w-4" />
                <span className="sr-only">Group</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Group components
            </TooltipContent>
          </Tooltip>

        </div>
        <div className="flex items-center gap-2">
          <ToggleGroup type="single" value={layout} onValueChange={(value) => storeLayout(value)}>
            <ToggleGroupItem value="grid" aria-label="Grid layout">
              <LayoutGrid className="h-4 w-4" strokeWidth={1.5} />
            </ToggleGroupItem>
            <ToggleGroupItem value="single" aria-label="Single column layout">
              <Rows className="h-4 w-4" strokeWidth={1.5} />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {groupBy ? (
        <>
          {Object.keys(groupedList).map((group) => {
            return (
              <div key={`group-${group}`} className="mb-8 border-b border-gray-200 pb-4">
                <HeadersType.H3 className="mb-4 text-lg font-medium">{group}</HeadersType.H3>
                <div
                  className={cn(
                    'grid',
                    layout === 'grid' ? 'grid-cols-1 gap-10 min-[800px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4' : 'grid-cols-1 gap-2'
                  )}
                >
                  {groupedList[group].map((component) => {
                    return <ComponentsPageCard key={`component-${component.id}`} component={component} layout={layout} />;
                  })}
                </div>
              </div>
            );
          })}
        </>
      ) : (
        <div
          className={cn(
            'grid',
            layout === 'grid' ? 'grid-cols-1 gap-10 min-[800px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4' : 'grid-cols-1 gap-2'
          )}
        >            {list.map((component) => {
          return <ComponentsPageCard key={`component-${component.id}`} component={component} layout={layout} />;
        })}
        </div>
      )}
    </div>

  );
};

const ComponentsPageCard = ({ component, layout }: { component: PreviewObject; layout: string }) => {
  return (
    <AbstractComponentsPageCard
      id={component.id}
      title={component.title}
      image={component.image}
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
  image,
  path,
  layout = 'grid',
  available = true,
  absolute = false,
}: {
  id: string;
  title: string;
  description: string;
  image?: string;
  path?: string;
  layout?: string;
  available?: boolean;
  absolute?: boolean;
  variations?: number;
}) => {
  if (!path) path = 'components';
  // trim description to 200 characters at a word boundary

  const short = description.length > 85 ? description.substring(0, description.lastIndexOf(' ', 85)) + '...' : description;
  const long = description.length > 500 ? description.substring(0, description.lastIndexOf(' ', 500)) + '...' : description;

  if (!image) {
    image = `${process.env.HANDOFF_APP_BASE_PATH ?? ''}/assets/images/illustration-sample-bw-1.svg`;
  }
  return (
    <div className={cn(layout === 'single' && 'grid grid-cols-[130px_1fr] items-start gap-6')}>
      <Link href={available ? (absolute ? path : `/system/component/${id}`) : '#'} className="block bg-gray-50">
        <img src={image} width={1528} height={1250} alt="Components" className="mb-5 rounded-lg" />
      </Link>
      <div>
        <h2 className="text-base font-medium">{title}</h2>
        {variations && <small className="font-mono text-xs font-light text-gray-400">{variations} variations</small>}
        <p className={cn('text-sm leading-relaxed text-gray-600', layout === 'grid' ? 'mt-2' : 'mt-1')}>
          {layout === 'grid' ? short : long}
        </p>
      </div>
    </div>
  );
};
