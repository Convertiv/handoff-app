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

import { useRouter } from 'next/router';
import React from 'react';
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
import { SectionLink } from '../util';

const trimSlashes = (input: string): string => {
  return input.replace(/^\/+|\/+$/g, '');
};

const NormalMenuItem = ({ title, icon, path }) => {
  const router = useRouter();
  const isActive = trimSlashes(path) === trimSlashes(router.asPath);
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <a href={`/${path}`} className="gap-3">
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
    (item) => trimSlashes(router.asPath).startsWith(trimSlashes(item.path)) || trimSlashes(item.path) === trimSlashes(router.asPath)
  );
  return (
    <Collapsible defaultOpen={isActive} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton className="h-9 gap-3">
            <MenuIcon icon={icon} isActive={isActive} />
            <span className={isActive ? 'font-medium text-sidebar-accent-foreground [&_svg]:opacity-100' : undefined}>{title}</span>
            <ChevronRight className="ml-auto !size-[14px] stroke-[1.5] text-slate-700 opacity-50 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
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

const SideNav = ({ menu }: { menu: SectionLink }) => {
  return (
    <Sidebar className="sticky left-auto">
      <SidebarContent className="px-4 pt-5">
        {menu.subSections &&
          menu.subSections.length > 0 &&
          menu.subSections.map((section, index) => (
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
              {index < menu.subSections.length && <SidebarSeparator className="mx-4" />}
            </React.Fragment>
          ))}
      </SidebarContent>
    </Sidebar>
  );
};

export default SideNav;
