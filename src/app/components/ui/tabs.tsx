import * as TabsPrimitive from "@radix-ui/react-tabs"
import * as React from "react"

import { cn } from "../../lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, children, ...props }, ref) => {
  const [indicator, setIndicator] = React.useState({ left: 0, width: 0 })
  const listRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    const list = listRef.current
    if (!list) return

    const update = () => {
      const active = list.querySelector<HTMLElement>('[data-state="active"]')
      if (active) {
        setIndicator({ left: active.offsetLeft, width: active.offsetWidth })
      }
    }

    update()
    const observer = new MutationObserver(update)
    observer.observe(list, { attributes: true, subtree: true, attributeFilter: ['data-state'] })
    window.addEventListener('resize', update)
    return () => { observer.disconnect(); window.removeEventListener('resize', update) }
  }, [])

  return (
    <TabsPrimitive.List
      ref={(node) => { listRef.current = node; if (typeof ref === 'function') ref(node); else if (ref) ref.current = node }}
      className={cn("relative inline-flex h-10 items-center justify-center gap-1 border-b border-border text-muted-foreground", className)}
      {...props}
    >
      {children}
      <span
        className="absolute bottom-[-2px] h-0.5 bg-sky-600 transition-all duration-200"
        style={{ left: indicator.left, width: indicator.width }}
      />
    </TabsPrimitive.List>
  )
})
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "relative inline-flex h-10 items-center justify-center whitespace-nowrap px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-foreground",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsContent, TabsList, TabsTrigger }

