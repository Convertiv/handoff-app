'use client';

import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../../components/ui/collapsible';
import { Layers, ChevronRight, Blend, Type, Sun, LayoutGrid, Shapes, Image, Hexagon } from 'lucide-react';

import {
  SidebarProvider,
  SidebarTrigger,
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
  SidebarInset,
  SidebarMenuAction,
  SidebarHeader,
} from '../../components/ui/sidebar';
import { SectionLink } from '../util';

const NormalMenuItem = ({ title, icon, path }) => (
  <SidebarMenuItem>
    <SidebarMenuButton asChild>
      <a href={`/${path}`}>
        <Layers className="text-slate-700 opacity-50" strokeWidth={1.5} />
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
          <Blend className="text-slate-700 opacity-50" strokeWidth={1.5} />
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

const SideNav = ({ menu }: { menu: SectionLink }) => {
  return (
    <Sidebar className="sticky left-auto">
      <SidebarContent className="px-4 pt-5">
        {menu.subSections &&
          menu.subSections.length > 0 &&
          menu.subSections.map((section, index) => (
            <>
              <SidebarGroup>
                {!section.path && <SidebarGroupLabel>{section.title}</SidebarGroupLabel>}
                {section.menu && section.menu.length > 0 && (
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {section.menu.map((item) => (
                        <MenuItem key={item.path} item={item} />
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                )}
              </SidebarGroup>
              {index < menu.subSections.length && <SidebarSeparator className="mx-4" />}
            </>
          ))}
      </SidebarContent>
    </Sidebar>
  );
};

export default SideNav;
