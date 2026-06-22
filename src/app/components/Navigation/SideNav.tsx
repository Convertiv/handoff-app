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

import { groupBy, startCase } from 'lodash';
import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useState } from 'react';
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
import { normalizePathForMatch, toAbsolutePath } from '../../lib/utils';
import { useConfigContext } from '../context/ConfigContext';
import { SectionLink } from '../util';

const NormalMenuItem = ({ title, icon, path }) => {
  const router = useRouter();
  const isActive = normalizePathForMatch(path) === normalizePathForMatch(router.asPath);
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <a href={toAbsolutePath(path)} className="gap-3">
          <MenuIcon icon={icon} isActive={isActive} />
          <span>{title}</span>
        </a>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

const CollapsibleMenuItem = ({ title, icon, path, menu }) => {
  const router = useRouter();
  const isActive = menu.some(
    (item) => normalizePathForMatch(router.asPath).startsWith(normalizePathForMatch(item.path))
  );
  return (
    <Collapsible defaultOpen={isActive} className="group/collapsible">
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

/** Minimal nav payload served by `GET /api/docs/nav.json` (id/title/group + component `type`). */
type NavEntity = { id: string; title?: string; group?: string; type?: string };
type NavData = { components: NavEntity[]; patterns: NavEntity[] };

/** Mirror of `buildBasePath()` in components/util so client-built links match the baked menu paths. */
const buildBasePath = (): string => {
  if (!process.env.HANDOFF_APP_BASE_PATH) {
    return '';
  }
  return process.env.HANDOFF_APP_BASE_PATH.replace(/^\/+|\/+$/g, '') + '/';
};

/**
 * Build a grouped submenu from the minimal nav entities, mirroring the server-side
 * `buildComponentMenu`/`buildPatternMenu` shape (group → sorted items, both sorted by title) so the
 * client-resolved registry nav renders identically to the workspace/static baked menu.
 */
const buildEntitySubmenu = (entities: NavEntity[], segment: 'component' | 'pattern') => {
  const basePath = buildBasePath();
  const grouped = groupBy(entities, (entity) => entity.group ?? '');
  return Object.keys(grouped)
    .map((group) => ({
      title: group || 'Uncategorized',
      menu: grouped[group]
        .map((entity) => ({
          path: `${basePath}system/${segment}/${entity.id}`,
          title: entity.title || startCase(entity.id),
        }))
        .sort((a, b) => a.title.localeCompare(b.title)),
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
};

const SideNav = ({ menu }: { menu: SectionLink }) => {
  const { config } = useConfigContext();
  const isRegistry = config?.runtime?.mode === 'registry';
  const [nav, setNav] = useState<NavData | null>(null);

  // Registry entity lists are mutable at runtime, so resolve the component/pattern submenus at request
  // time from the live (minimal) docs read API instead of the build-time snapshot. Workspace/static
  // keep the baked menu and never fetch.
  useEffect(() => {
    if (!isRegistry) {
      return;
    }
    const controller = new AbortController();
    fetch(`${process.env.HANDOFF_APP_BASE_PATH ?? ''}/api/docs/nav.json`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setNav(data as NavData);
      })
      .catch(() => {
        // Keep the baked menu on failure; the nav stays usable rather than disappearing.
      });
    return () => controller.abort();
  }, [isRegistry]);

  // Replace the `menu` of any subsection tagged `dynamic` with the live, request-time list.
  const sections = useMemo(() => {
    const subSections = menu?.subSections ?? [];
    if (!isRegistry || !nav) {
      return subSections;
    }
    return subSections.map((section) => {
      const dyn = section.dynamic;
      if (dyn?.kind === 'components') {
        const components = dyn.type ? (nav.components ?? []).filter((c) => c.type === dyn.type) : nav.components ?? [];
        return { ...section, menu: buildEntitySubmenu(components, 'component') };
      }
      if (dyn?.kind === 'patterns') {
        return { ...section, menu: buildEntitySubmenu(nav.patterns ?? [], 'pattern') };
      }
      return section;
    });
  }, [menu, isRegistry, nav]);

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
