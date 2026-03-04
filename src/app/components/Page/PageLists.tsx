import { ToggleGroup, ToggleGroupItem } from '@radix-ui/react-toggle-group';
import { AlignJustify, LayoutGrid, Rows, Search } from 'lucide-react';
import Link from 'next/link';
import React, { useEffect } from 'react';
import { cn } from '../../lib/utils';
import HeadersType from '../Typography/Headers';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { PagePreviewObject } from './types';

export const APIPageList = ({ pages, title, description }: { pages: PagePreviewObject[]; title?: string; description?: string }) => {
  if ((pages ?? []).length === 0) {
    return <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">No pages found.</p>;
  }
  return <PageList pages={pages} title={title} description={description} />;
};

export const PageList = ({
  pages,
  title,
  description,
}: {
  pages: PagePreviewObject[];
  title?: string;
  description?: string;
}) => {
  const [layout, setLayout] = React.useState<string>(window.localStorage.getItem('handoff-page-grid-layout') || 'grid');
  const [groupBy, setGroupBy] = React.useState<boolean>(false);
  const [search, setSearch] = React.useState<string>('');
  const [category, setCategory] = React.useState<string>('');
  const [list, setList] = React.useState<PagePreviewObject[]>(pages);
  const [groupedList, setGroupedList] = React.useState<Record<string, PagePreviewObject[]>>({});

  const categories = React.useMemo(() => {
    const cats = new Set(pages.map((p) => p.group).flat());
    return Array.from(cats);
  }, [pages]);

  useEffect(() => {
    setGroupedList(
      list
        .sort((a, b) => a.group.localeCompare(b.group))
        .reduce((acc, page) => {
          acc[page.group] = [...(acc[page.group] || []), page];
          return acc;
        }, {} as Record<string, PagePreviewObject[]>)
    );
  }, [list]);

  useEffect(() => {
    let filteredList = pages.filter((page) => {
      return page.title.toLowerCase().includes(search) || page.description.toLowerCase().includes(search);
    });
    if (category && category !== 'all') {
      filteredList = filteredList.filter((page) => page.group === category);
    }
    setList(filteredList);
  }, [search, category]);

  const storeLayout = (value: string) => {
    setLayout(value);
    window.localStorage.setItem('handoff-page-grid-layout', value);
  };

  if (!title) title = 'Pages';
  if (!description) description = 'Composed page templates built from reusable components.';

  return (
    <div className="mx-auto w-full mb-4">
      <div className="flex justify-between bg-accent rounded-xl mb-8">
        <div className="mr-auto flex items-center gap-3 bg-accent p-2.5 rounded-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search pages..."
              className="rounded-md pl-9 pr-3 py-1 text-sm border-none shadow-none"
              onChange={(e) => setSearch(e.currentTarget.value)}
              aria-label="Search pages"
              style={{ minWidth: 200 }}
            />
          </div>
        </div>
        <div className="flex justify-end p-2.5 gap-2.5">
          <div className="flex items-center gap-0.5 border border-input bg-background shadow-xs hover:text-accent-foreground p-0.5 rounded-md">
            <Select value={category} onValueChange={(val) => setCategory(val)} aria-label="Filter by category">
              <SelectTrigger className="rounded-md [&_span]:text-xs [&_svg]:ml-2.5 [&_svg]:size-3 py-1 px-2 pl-3 text-sm border-none shadow-none bg-transparent focus:border-blue-400 focus:outline-none">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <hr className="h-7 w-px bg-input" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn('w-9', groupBy && 'bg-accent text-accent-foreground')}
                  onClick={() => setGroupBy(!groupBy)}
                >
                  <Rows className="size-3.5" strokeWidth={1.5} />
                  <span className="sr-only">Group by category</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Group by category</TooltipContent>
            </Tooltip>
          </div>
          <ToggleGroup
            className="flex gap-0.5 border border-input bg-background shadow-xs hover:text-accent-foreground p-0.5 rounded-md"
            type="single"
            value={layout}
            onValueChange={(value) => storeLayout(value)}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  className={cn(
                    'size-9 py-2 px-2 flex items-center justify-center hover:bg-accent rounded-md',
                    layout === 'grid' && 'bg-accent text-accent-foreground'
                  )}
                  value="grid"
                  aria-label="Grid layout"
                >
                  <LayoutGrid className="size-3.5" strokeWidth={1.5} />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>Grid layout</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  className={cn(
                    'size-9 py-2 px-2 flex items-center justify-center hover:bg-accent rounded-md',
                    layout === 'single' && 'bg-accent text-accent-foreground'
                  )}
                  value="single"
                  aria-label="Single column layout"
                >
                  <AlignJustify className="size-3.5" strokeWidth={1.5} />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>Column layout</TooltipContent>
            </Tooltip>
          </ToggleGroup>
        </div>
      </div>

      {groupBy ? (
        <>
          {Object.keys(groupedList).map((group) => (
            <div key={`group-${group}`} className="mb-8">
              <HeadersType.H3 className="mb-4 text-lg font-medium border-b border-gray-200 pb-2">{group}</HeadersType.H3>
              <div
                className={cn(
                  'grid',
                  layout === 'grid' ? 'grid-cols-1 gap-10 min-[800px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4' : 'grid-cols-1 gap-2'
                )}
              >
                {groupedList[group].map((page) => (
                  <PageCard key={`page-${page.id}`} page={page} layout={layout} />
                ))}
              </div>
            </div>
          ))}
        </>
      ) : (
        <div
          className={cn(
            'grid',
            layout === 'grid' ? 'grid-cols-1 gap-10 min-[800px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4' : 'grid-cols-1 gap-2'
          )}
        >
          {list.map((page) => (
            <PageCard key={`page-${page.id}`} page={page} layout={layout} />
          ))}
        </div>
      )}
    </div>
  );
};

const PageCard = ({ page, layout }: { page: PagePreviewObject; layout: string }) => {
  const image = page.image || `${process.env.HANDOFF_APP_BASE_PATH ?? ''}/assets/images/illustration-sample-bw-1.svg`;
  const short = page.description.length > 85 ? page.description.substring(0, page.description.lastIndexOf(' ', 85)) + '...' : page.description;
  const long = page.description.length > 500 ? page.description.substring(0, page.description.lastIndexOf(' ', 500)) + '...' : page.description;
  const componentCount = page.components?.length ?? 0;

  return (
    <div className={cn(layout === 'single' && 'grid grid-cols-[130px_1fr] items-start gap-6')}>
      <Link href={`/system/page/${page.id}`} className="block bg-gray-50">
        <img
          src={`${process.env.HANDOFF_APP_BASE_PATH ?? ''}${image}`}
          width={1528}
          height={1250}
          alt={page.title}
          className="mb-5 rounded-lg"
        />
      </Link>
      <div>
        <h2 className="text-base font-medium">{page.title}</h2>
        <small className="font-mono text-xs font-light text-gray-400">{componentCount} components</small>
        <p className={cn('text-sm leading-relaxed text-gray-600', layout === 'grid' ? 'mt-2' : 'mt-1')}>
          {layout === 'grid' ? short : long}
        </p>
      </div>
    </div>
  );
};
