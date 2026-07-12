'use client';

import {
  ChevronRight,
  Grid,
  Hexagon,
  Image,
  Layers,
  LayoutPanelLeft,
  Palette,
  Pickaxe,
  Shapes,
  SquareChartGantt,
  Sun,
  TypeOutline,
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../components/ui/collapsible';

import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarSeparator,
} from '../../components/ui/sidebar';
import { normalizePathForMatch } from '../../lib/utils';
import { useNav } from '../context/NavProvider';

/**
 * `next/link` re-applies `basePath`, but the menu item paths already carry the base prefix (built by
 * the server navigation resolver). Strip the leading base segment once so the link is not
 * double-prefixed; with no base path this just returns a leading-slash route.
 */
const stripBasePath = (p: string): string => {
  const base = (process.env.HANDOFF_APP_BASE_PATH ?? '').replace(/^\/+|\/+$/g, '');
  let rel = p.replace(/^\/+/, '');
  if (base && (rel === base || rel.startsWith(`${base}/`))) {
    rel = rel.slice(base.length).replace(/^\/+/, '');
  }
  return `/${rel}`;
};

const NormalMenuItem = ({ title, icon, path }) => {
  const router = useRouter();
  const isActive = normalizePathForMatch(path) === normalizePathForMatch(router.asPath);
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        {/* Soft (client-side) navigation so moving between entity pages reuses the already-loaded
            cached nav with no reload/flash. Prefetch is off: each prefetch would invoke the
            fallback:'blocking' lambda data route, so fetch the target's data on click instead. */}
        <Link href={stripBasePath(path)} prefetch={false} className="gap-3">
          <MenuIcon icon={icon} isActive={isActive} />
          <span>{title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

const CollapsibleMenuItem = ({ title, icon, path, menu }) => {
  const router = useRouter();
  const isActive = menu.some(
    (item) => normalizePathForMatch(router.asPath).startsWith(normalizePathForMatch(item.path))
  );
  // Controlled so the active group auto-opens on soft navigation (an uncontrolled `defaultOpen` is
  // only read on mount and would not re-open the active group when the route changes client-side),
  // while still letting the user collapse/expand groups manually.
  const [open, setOpen] = useState(isActive);
  useEffect(() => {
    if (isActive) setOpen(true);
  }, [isActive]);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton className="h-9 gap-3">
            <MenuIcon icon={icon} isActive={isActive} />
            <span className={isActive ? 'font-medium text-sidebar-accent-foreground [&_svg]:opacity-100' : undefined}>{title}</span>
            <ChevronRight className="ml-auto size-[14px]! stroke-[1.5] text-slate-700 opacity-50 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub className="pl-3">
            <SidebarMenu>
              {menu.map((item) => (
                <MenuItem key={item.path} item={item} />
              ))}
            </SidebarMenu>
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
};

const MenuItem = ({ item }) => {
  if (item.menu && item.menu.length > 0) {
    return <CollapsibleMenuItem {...item} />;
  } else {
    return <NormalMenuItem {...item} />;
  }
};

const MenuIcon = ({ icon, isActive = false }) => {
  const iconClass = isActive ? 'text-slate-800 opacity-100' : 'text-slate-700 opacity-50';

  switch (icon) {
    case 'layers':
      return <Layers className={iconClass} strokeWidth={1.5} />;
    case 'square-chart-gantt':
      return <SquareChartGantt className={iconClass} strokeWidth={1.5} />;
    case 'pickaxe':
      return <Pickaxe className={iconClass} strokeWidth={1.5} />;
    case 'hexagon':
      return <Hexagon className={iconClass} strokeWidth={1.5} />;
    case 'palette':
      return <Palette className={iconClass} strokeWidth={1.5} />;
    case 'type':
      return <TypeOutline className={iconClass} strokeWidth={1.5} />;
    case 'grid':
      return <Grid className={iconClass} strokeWidth={1.5} />;
    case 'layout-panel-left':
      return <LayoutPanelLeft className={iconClass} strokeWidth={1.5} />;
    case 'sun':
      return <Sun className={iconClass} strokeWidth={1.5} />;
    case 'blend':
      return <Sun className={iconClass} strokeWidth={1.5} />;
    case 'image':
      return <Image className={iconClass} strokeWidth={1.5} />;
    case 'shapes':
      return <Shapes className={iconClass} strokeWidth={1.5} />;
    default:
      return null;
  }
};

const SideNav = () => {
  const { current } = useNav();
  const sections = current?.subSections ?? [];

  // Collapse the sidebar entirely (render nothing, reserve no gutter) when the resolved section has
  // no renderable content, so the page content goes full width. A `dynamic` slot counts as
  // renderable even before its entities load, to avoid a full-width → gutter flash in registry mode.
  const hasContent = sections.some((section) => (section.menu && section.menu.length > 0) || !!section.dynamic);
  if (!hasContent) {
    return null;
  }

  return (
    <Sidebar className="sticky left-auto">
      <SidebarContent className="px-4 pt-5">
        {sections.length > 0 &&
          sections.map((section, index) => (
            <React.Fragment key={index}>
              <SidebarGroup>
                {!section.path && <SidebarGroupLabel>{section.title}</SidebarGroupLabel>}
                {section.menu && section.menu.length > 0 && (
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {section.menu.map((item, subindex) => (
                        <MenuItem key={index + '-mi-' + subindex} item={item} />
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                )}
              </SidebarGroup>
              {index < sections.length && <SidebarSeparator className="mx-4" />}
            </React.Fragment>
          ))}
      </SidebarContent>
    </Sidebar>
  );
};

export default SideNav;
