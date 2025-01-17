'use client';

import { Blend, ChevronRight, Grid, Hexagon, Image, Layers, Palette, Pickaxe, SquareChartGantt, TypeOutline } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../components/ui/collapsible';

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

const NormalMenuItem = ({ title, icon, path }) => (
  <SidebarMenuItem>
    <SidebarMenuButton asChild>
      <a href={`/${path}`}>
        <MenuIcon icon={icon} />
        <span>{title}</span>
      </a>
    </SidebarMenuButton>
  </SidebarMenuItem>
);

const CollapsibleMenuItem = ({ title, icon, path, menu }) => (
  <Collapsible className="group/collapsible">
    <SidebarMenuItem>
      <CollapsibleTrigger asChild>
        <SidebarMenuButton>
          <MenuIcon icon={icon} />
          <span>{title}</span>
          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
        </SidebarMenuButton>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenuSub>
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

const MenuItem = ({ item }) => {
  if (item.menu && item.menu.length > 0) {
    return <CollapsibleMenuItem {...item} />;
  } else {
    return <NormalMenuItem {...item} />;
  }
};

const MenuIcon = ({ icon }) => {
  switch (icon) {
    case 'layers':
      return <Layers className="text-slate-700 opacity-50" strokeWidth={1.5} />;
    case 'square-chart-gantt':
      return <SquareChartGantt className="text-slate-700 opacity-50" strokeWidth={1.5} />;
    case 'pickaxe':
      return <Pickaxe className="text-slate-700 opacity-50" strokeWidth={1.5} />;
    case 'hexagon':
      return <Hexagon className="text-slate-700 opacity-50" strokeWidth={1.5} />;
    case 'palette':
      return <Palette className="text-slate-700 opacity-50" strokeWidth={1.5} />;
    case 'type':
      return <TypeOutline className="text-slate-700 opacity-50" strokeWidth={1.5} />;
    case 'grid':
      return <Grid className="text-slate-700 opacity-50" strokeWidth={1.5} />;
    case 'effect':
      return <Blend className="text-slate-700 opacity-50" strokeWidth={1.5} />;
    case 'blend':
      return <Blend className="text-slate-700 opacity-50" strokeWidth={1.5} />;
    case 'image':
      return <Image className="text-slate-700 opacity-50" strokeWidth={1.5} />;
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
                      {section.menu.map((item) => (
                        <MenuItem key={index + '-' + item.path} item={item} />
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
