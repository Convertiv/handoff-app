"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
  navigationMenuTriggerStyle
} from "@/components/ui/navigation-menu"

export function MainNav() {
  return (
    <NavigationMenu>
        <NavigationMenuList>
            <NavigationMenuItem>
                <NavigationMenuTrigger>Foundations</NavigationMenuTrigger>
                <NavigationMenuContent className="p-2 gap-1 md:w-[200px] lg:w-[200px]">
                    <NavigationMenuLink>
                    <a
                        href="/foundations/logo"
                        className={cn(
                            "block select-none space-y-1 rounded-sm p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                        )}
                        >
                        <div className="text-sm leading-none">Logo</div>
                    </a>
                    </NavigationMenuLink>
                    <NavigationMenuLink>
                    <a
                        href="/foundations/colors"
                        className={cn(
                            "block select-none space-y-1 rounded-sm p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                        )}
                        >
                        <div className="text-sm leading-none">Colors</div>
                    </a>
                    </NavigationMenuLink>
                    <NavigationMenuLink>
                    <a
                        href="/foundations/typography"
                        className={cn(
                            "block select-none space-y-1 rounded-sm p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                        )}
                        >
                        <div className="text-sm leading-none">Typography</div>
                    </a>
                    </NavigationMenuLink>
                </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
                <NavigationMenuTrigger>Design System</NavigationMenuTrigger>
                <NavigationMenuContent className="p-2 gap-1 md:w-[200px] lg:w-[200px]">
                    <NavigationMenuLink>
                    <a
                        href="/foundations/logo"
                        className={cn(
                            "block select-none space-y-1 rounded-sm p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                        )}
                        >
                        <div className="text-sm leading-none">Tokens</div>
                    </a>
                    </NavigationMenuLink>
                    <NavigationMenuLink>
                    <a
                        href="/foundations/colors"
                        className={cn(
                            "block select-none space-y-1 rounded-sm p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                        )}
                        >
                        <div className="text-sm leading-none">Components</div>
                    </a>
                    </NavigationMenuLink>
                    <NavigationMenuLink>
                    <a
                        href="/foundations/typography"
                        className={cn(
                            "block select-none space-y-1 rounded-sm p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                        )}
                        >
                        <div className="text-sm leading-none">Blocks</div>
                    </a>
                    </NavigationMenuLink>
                </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
                <Link href="/docs" legacyBehavior passHref>
                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                        Guidelines
                    </NavigationMenuLink>
                </Link>
            </NavigationMenuItem>
        </NavigationMenuList>
    </NavigationMenu>
  )
}