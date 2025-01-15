import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, BookType, Box, Calendar, Check, ChevronRight, CircleCheck, Contrast, Code2, Copy, Command, FileCode2, Home, Image, Inbox, Info, Layers, LayoutTemplate, Link, OctagonX, PersonStanding, Search, Settings, SquareChevronRight, SwatchBook, Type, LayoutGrid, Rows, TriangleAlert, Blend, Sun, Tangent, TableCellsSplit, Shapes, SunMedium, CornerDownRight, TextQuote, X, ArrowRightToLine } from "lucide-react"
import { ThemeProvider } from "@/components/util/theme-provider"
import { Header } from "@/components/HeaderNew"
import { SideNav } from "@/components/SideNavNew"
import { AnchorNav } from "@/components/AnchorNavNew"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

import {
    SidebarProvider,
    SidebarInset,
} from "@/components/ui/sidebar"

import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import {
    Breadcrumb,
    BreadcrumbEllipsis,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

export default function ButtonDemo() {
  const [layout, setLayout] = useState("grid");
  const [selectedValue, setSelectedValue] = useState("on");
  const [open, setOpen] = useState(false);
  const [openType, setOpenType] = useState(false);

  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText("URL to Colors page with color panel opened.");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Error copying URL: ", err);
    }
  };

  return (
    <div>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <div className="absolute top-[-200px] left-[-200px] z-[-1] w-[600px] h-[400px] bg-[#FD3146] blur-[280px] opacity-[0.07]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {/* <img
            src={`${process.env.HANDOFF_APP_BASE_PATH ?? ''}/assets/images/back.png`}
            width={1528}
            height={1250}
            alt="Components"
            className="rounded-lg mb-5"
          /> */}
        </div>
        <div className="sticky top-0 z-50">
          <Header />
        </div>
        <div className="container max-w-[1500px] mx-auto min-h-screen">
          <SidebarProvider>
            <div className="flex w-full">
              <SideNav />
              <SidebarInset className="relative py-8 lg:gap-10 lg:py-16 xl:grid px-16 bg-transparent">
                <div className="mx-auto w-full">
                  <div className="flex flex-col gap-2 pb-7">
                    <h1 className="text-3xl font-normal">Components</h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">Self-contained reusable UI elements that can be used to build larger blocks or design patterns.</p>
                  </div>
                  <div className="flex justify-end mb-4">
                    <ToggleGroup type="single" value={layout} onValueChange={(value) => value && setLayout(value)}>
                      <ToggleGroupItem value="grid" aria-label="Grid layout">
                        <LayoutGrid className="h-4 w-4" strokeWidth={1.5} />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="single" aria-label="Single column layout">
                        <Rows className="h-4 w-4" strokeWidth={1.5} />
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  <div className={cn(
                    "grid",
                    layout === "grid" 
                      ? "gap-10 grid-cols-1 min-[800px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4" 
                      : "gap-2 grid-cols-1"
                  )}>
                    <div className={cn(
                      layout === "single" && "grid grid-cols-[130px_1fr] gap-6 items-start"
                    )}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`${process.env.HANDOFF_APP_BASE_PATH ?? ''}/assets/images/illustration-sample-bw-1.svg`}
                        width={1528}
                        height={1250}
                        alt="Components"
                        className="rounded-lg mb-5"
                      />
                      <div>
                        <a href="">
                          <h2 className="text-base font-medium">Component Name</h2>
                        </a>
                        <small className="text-xs font-mono text-gray-400 font-light">17 variations</small>
                        <p className={cn("text-sm text-gray-600 leading-relaxed", layout === "grid" ? "mt-2" : "mt-1")}>Switch button to easily toggle between active and inactive states.</p>
                      </div>
                    </div>

                    <div className={cn(
                      layout === "single" && "grid grid-cols-[130px_1fr] gap-6 items-start"
                    )}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`${process.env.HANDOFF_APP_BASE_PATH ?? ''}/assets/images/illustration-sample-bw-2.svg`}
                        width={1528}
                        height={1250}
                        alt="Components"
                        className="rounded-lg mb-5"
                      />
                      <div>
                        <a href="">
                          <h2 className="text-base font-medium">Component Name</h2>
                        </a>
                        <small className="text-xs font-mono text-gray-400 font-light">17 variations</small>
                        <p className={cn("text-sm text-gray-600 leading-relaxed", layout === "grid" ? "mt-2" : "mt-1")}>Switch button to easily toggle between active and inactive states.</p>
                      </div>
                    </div>

                    <div className={cn(
                      layout === "single" && "grid grid-cols-[130px_1fr] gap-6 items-start"
                    )}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`${process.env.HANDOFF_APP_BASE_PATH ?? ''}/assets/images/illustration-sample-bw-3.svg`}
                        width={1528}
                        height={1250}
                        alt="Components"
                        className="rounded-lg mb-5"
                      />
                      <div>
                        <a href="">
                          <h2 className="text-base font-medium">Component Name</h2>
                        </a>
                        <small className="text-xs font-mono text-gray-400 font-light">17 variations</small>
                        <p className={cn("text-sm text-gray-600 leading-relaxed", layout === "grid" ? "mt-2" : "mt-1")}>Switch button to easily toggle between active and inactive states.</p>
                      </div>
                    </div>

                  </div>
                  <Separator className="mt-14 mb-4" />
                  <div className="lg:gap-10 lg:py-8 xl:grid xl:grid-cols-[1fr_280px]">
                    <div>
                      <h2 className="text-2xl font-medium mb-3">Cards With Icons</h2>
                      <p className="mb-8">Design System is a collection of guidelines, principles, and tools that help teams build digital products. It is a living document that evolves as the needs of our users and the technology landscape change.</p>
                      <div className="grid grid-cols-[repeat(auto-fit,minmax(100%,1fr))] sm:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
                        <a href="" className="p-7 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-900 transition-colors">
                          <div className="flex flex-col gap-2">
                            <PersonStanding className="h-5 w-5 text-gray-500 dark:text-gray-400 " strokeWidth={1.5} />
                            <h3 className="text-base font-medium">Accessibility</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Handoff strives to make our sites accessible to all users. This section provides guidelines and tools to help you build accessible sites.</p>
                          </div>
                        </a>
                        <a href="" className="p-7 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-900 transition-colors group">
                          <div className="flex flex-col items-start gap-2">
                            <FileCode2 className="h-5 w-5 text-gray-500 dark:text-gray-400" strokeWidth={1.5} />
                            <h3 className="text-base font-medium">CSS Guidelines</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">This section provides guidelines for using the SS&C CSS, including Bootstrap, color management, and typography.</p>
                            <Button variant="link" className="px-0 text-sm font-medium text-gray-900 dark:text-gray-100 hover:no-underline">
                              Learn More
                              <ArrowRight className="inline-block transition-transform group-hover:translate-x-1" />
                            </Button>
                          </div>
                        </a>
                        <a href="" className="p-7 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-900 transition-colors">
                          <div className="flex flex-col gap-2">
                            <Code2 className="h-5 w-5 text-gray-500 dark:text-gray-400 " strokeWidth={1.5} />
                            <h3 className="text-base font-medium">Javascript</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Handoff strives to make our sites accessible to all users. This section provides guidelines and tools to help you build accessible sites.</p>
                          </div>
                        </a>
                      </div>
                    </div>
                    <AnchorNav />
                  </div>
                  <div className="mt-10">
                    <h2 className="text-2xl font-medium mb-3">Cards With Badges</h2>
                    <p className="leading-relaxed mb-8">Design System is a collection of guidelines, principles, and tools that help teams build digital products. It is a living document that evolves as the needs of our users and the technology landscape change.</p>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(100%,1fr))] sm:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
                      <a href="" className="p-7 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
                        <Badge variant="green" className="mb-3">Badge</Badge>
                        <div className="flex flex-col gap-2">
                          <h3 className="text-base font-medium">Accessibility</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed ">Handoff strives to make our sites accessible to all users. This section provides guidelines and tools to help you build accessible sites.</p>
                        </div>
                      </a>
                      <a href="" className="p-7 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
                        <Badge variant="green" className="mb-3">Badge</Badge>
                        <div className="flex flex-col gap-2">
                          <h3 className="text-base font-medium">Accessibility</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">Handoff strives to make our sites accessible to all users. This section provides guidelines and tools to help you build accessible sites.</p>
                        </div>
                      </a>
                    </div>
                  </div>
                  <div className="mt-10">
                    <Separator className="my-14" />
                    <h2 className="text-2xl font-medium mb-3">Alerts</h2>
                    <p className="leading-relaxed mb-8">Alerts are used to communicate important information to the user, called with the <code>Alert</code> component. They can contain a title, description, and a link. Custom elements can be added to the alert but they will likely be unstyled.</p>

                    <Alert variant="green" className="mb-8">
                      <CircleCheck/>
                      <AlertDescription>
                        This is a success alert that should be used to indicate a <a href="#">successful action</a>.
                      </AlertDescription>
                    </Alert>

                    <Alert variant="info" className="mb-8">
                      <Info/>
                      <AlertDescription>
                        This is an info alert that should be used to notify the user of <a href="#">important information</a>.
                      </AlertDescription>
                    </Alert>

                    <Alert variant="warning" className="mb-8">
                      <TriangleAlert/>
                      <AlertDescription>
                        This is a warning alert that should be used to notify the user of potential issues or <a href="#">warnings</a>.
                      </AlertDescription>
                    </Alert>

                    <Alert variant="destructive" className="mb-8">
                      <OctagonX/>
                      <AlertDescription>
                        This is a destructive alert that should be used to indicate a <a href="#">critical error</a>.
                      </AlertDescription>
                    </Alert>

                    <p className="text-gray-600 leading-relaxed mb-8">If variant is not specified, the alert will default to the default style.</p>

                    <Alert className="mb-8">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        This is a default alert that should be used to indicate a <a href="#">critical error</a>.
                      </AlertDescription>
                    </Alert>

                    <p className="mb-4">Alert consists of following parts:</p>
                    <ul className="list-disc ml-6 space-y-2">
                      <li><p><code>AlertTitle</code> - used to display the title of the alert.</p></li>
                      <li><p><code>AlertDescription</code> - used to display the description of the alert.</p></li>
                    </ul>
                    <Separator className="my-14" />
                    <h2 className="text-2xl font-medium mb-3">Colors</h2>
                    <p className="mb-8">Color system built out of main brand colors and adjusted for variety of interfaces.</p>
                    <h3 className="text-lg font-medium mb-2">Standard List</h3>
                    <p className="mb-8">Use for palette of colors containing many shades.</p>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,400px))] gap-6 mb-6">
                      <a href="#" className="flex flex-col items-start">
                        <div className="bg-[#0077C8] rounded-lg block h-32 mb-2 w-full"></div>
                        <p className="text-sm font-medium mb-1">SS&C Blue</p>
                        <small className="text-xs font-mono text-gray-400 font-light">#0077C8</small>
                      </a>
                      <a href="" className="flex flex-col">
                        <div className="bg-[#E5F1F9] rounded-lg block h-32 mb-2"></div>
                        <p className="text-sm font-medium mb-1">Cobalt</p>
                        <small className="text-xs font-mono text-gray-400 font-light">#E5F1F9</small>
                      </a>
                    </div>
                    <h3 className="text-lg font-medium mb-2">Mini List</h3>
                    <p className="text-sm text-gray-600 leading-relaxed mb-8">Use for palette of colors containing many shades.</p>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(70px,70px))] gap-6">
                      <div className="flex flex-col">
                        <div className="bg-[#E5F1F9] rounded-lg block h-14 mb-2 relative group">
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-sm bg-white/80 p-[6px] flex items-center justify-center">
                            <span className="inline-block w-[3px] h-[3px] bg-black rounded-full"></span>
                            <span className="inline-block w-[3px] h-[3px] bg-black rounded-full mx-[2px]"></span>
                            <span className="inline-block w-[3px] h-[3px] bg-black rounded-full"></span>
                          </div>
                        </div>
                        <p className="text-sm font-medium mb-1">100</p>
                        <small className="text-xs font-mono text-gray-400 font-light">#E5F1F9</small>
                      </div>
                      <a href="" className="flex flex-col">
                        <div className="bg-[#CCE4F4] rounded-lg block h-14 mb-2"></div>
                        <p className="text-sm font-medium mb-1">200</p>
                        <small className="text-xs font-mono text-gray-400 font-light">#CCE4F4</small>
                      </a>
                      <a href="" className="flex flex-col">
                        <div className="bg-[#99C9E9] rounded-lg block h-14 mb-2"></div>
                        <p className="text-sm font-medium mb-1">300</p>
                        <small className="text-xs font-mono text-gray-400 font-light">#99C9E9</small>
                      </a>
                      <a href="" className="flex flex-col">
                        <div className="bg-[#66ADDE] rounded-lg block h-14 mb-2"></div>
                        <p className="text-sm font-medium mb-1">400</p>
                        <small className="text-xs font-mono text-gray-400 font-light">#66ADDE</small>
                      </a>
                      <a href="" className="flex flex-col">
                        <div className="bg-[#3392D3] rounded-lg block h-14 mb-2"></div>
                        <p className="text-sm font-medium mb-1">500</p>
                        <small className="text-xs font-mono text-gray-400 font-light">#3392D3</small>
                      </a>
                      <a href="" className="flex flex-col">
                        <div className="bg-[#0077C8] rounded-lg block h-14 mb-2"></div>
                        <p className="text-sm font-medium mb-1">600</p>
                        <small className="text-xs font-mono text-gray-400 font-light">#0077C8</small>
                      </a>
                      <a href="" className="flex flex-col">
                        <div className="bg-[#005F9E] rounded-lg block h-14 mb-2"></div>
                        <p className="text-sm font-medium mb-1">700</p>
                        <small className="text-xs font-mono text-gray-400 font-light">#005F9E</small>
                      </a>
                      <a href="" className="flex flex-col">
                        <div className="bg-[#00497A] rounded-lg block h-14 mb-2"></div>
                        <p className="text-sm font-medium mb-1">800</p>
                        <small className="text-xs font-mono text-gray-400 font-light">#00497A</small>
                      </a>
                      <div className="flex flex-col">
                        <div className="bg-[#003152] rounded-lg block h-14 mb-2 relative group">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-sm bg-white/100 p-[6px] flex items-center justify-center cursor-pointer">
                                <span className="inline-block w-[3px] h-[3px] bg-black rounded-full"></span>
                                <span className="inline-block w-[3px] h-[3px] bg-black rounded-full mx-[2px]"></span>
                                <span className="inline-block w-[3px] h-[3px] bg-black rounded-full"></span>
                              </div>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-60">
                              <DropdownMenuItem onClick={() => navigator.clipboard.writeText('Blue 900')}>
                                <Copy className="text-gray-400" /> Name 
                                <DropdownMenuShortcut className="max-w-[100px] truncate">Blue 900</DropdownMenuShortcut>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigator.clipboard.writeText('#003152')}>
                                <Copy className="text-gray-400" /> HEX 
                                <DropdownMenuShortcut className="max-w-[100px] truncate">#003152</DropdownMenuShortcut>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigator.clipboard.writeText('rgba(0, 49, 82, 1)')}>
                                <Copy className="text-gray-400" /> RGBA 
                                <DropdownMenuShortcut className="max-w-[100px] truncate">rgba(0, 49, 82, 1)</DropdownMenuShortcut>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onSelect={() => setOpen(true)} className="truncate"><SwatchBook className="text-gray-400" />Color Info</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Sheet
                            open={open}
                            onOpenChange={setOpen}
                          >
                            <SheetContent className="w-[400px] sm:w-[540px] overflow-auto [&>button]:opacity-0 [&>button:hover]:opacity-0">
                              <div className="px-2 -mt-1">
                                <div className="flex justify-between mb-4">
                                  <TooltipProvider delayDuration={0}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="disabled:opacity-100 h-7 [&_svg]:size-3"
                                          onClick={handleCopy}
                                          aria-label={copied ? "Copied" : "Copy Link"}
                                          disabled={copied}
                                        >
                                          <div
                                            className={cn(
                                              "transition-all",
                                              copied ? "scale-100 opacity-100" : "scale-0 opacity-0",
                                            )}
                                          >
                                            <Check className="stroke-emerald-500" size={12} strokeWidth={1.5} aria-hidden="true" />
                                          </div>
                                          <div
                                            className={cn(
                                              "absolute transition-all",
                                              copied ? "scale-0 opacity-0" : "scale-100 opacity-100",
                                            )}
                                          >
                                            <Link size={12} strokeWidth={1.5} aria-hidden="true" />
                                          </div>
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent className="px-2 py-1 text-xs">Copy Link</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  <SheetClose asChild>
                                    <Button variant="outline" size="sm" className="h-7 [&_svg]:size-3">
                                      <ArrowRightToLine />
                                    </Button>
                                  </SheetClose>
                                </div>
                              </div>
                              <SheetHeader className="px-2 space-y-2">
                                <div className="bg-[#003152] rounded-md block h-32 mb-2 w-full relative">
                                  <div className="absolute bottom-0 left-0 py-4 px-4 flex flex-col gap-0.5">
                                    <p className="text-white font-medium">Blue 900</p>
                                    <p className="text-xs font-mono text-white">#003152</p>
                                  </div>
                                </div>
                                <SheetDescription className="leading-relaxed">
                                  Color description coming from Figma variable or style description. Usually usage guideline like "Use for background" or "Use for text".
                                </SheetDescription>
                                <div className="flex items-center gap-2 mt-2">
                                  <svg className="w-2.5 h-2.5 text-slate-700" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Figma</title><path d="M15.852 8.981h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.491-4.49 4.491zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019h-3.117V7.51zm0 1.471H8.148c-2.476 0-4.49-2.014-4.49-4.49S5.672 0 8.148 0h4.588v8.981zm-4.587-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.02 3.019 3.02h3.117V1.471H8.148zm4.587 15.019H8.148c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v8.98zM8.148 8.981c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h3.117V8.981H8.148zM8.172 24c-2.489 0-4.515-2.014-4.515-4.49s2.014-4.49 4.49-4.49h4.588v4.441c0 2.503-2.047 4.539-4.563 4.539zm-.024-7.51a3.023 3.023 0 0 0-3.019 3.019c0 1.665 1.365 3.019 3.044 3.019 1.705 0 3.093-1.376 3.093-3.068v-2.97H8.148zm7.704 0h-.098c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h.098c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.49-4.49 4.49zm-.097-7.509c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h.098c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019h-.098z"/></svg>
                                  <Breadcrumb>
                                    <BreadcrumbList className="text-xs text-gray-500">
                                      <BreadcrumbItem>
                                        <BreadcrumbPage className="text-gray-500">Primitives</BreadcrumbPage>
                                      </BreadcrumbItem>
                                      <BreadcrumbSeparator>
                                        /
                                      </BreadcrumbSeparator>
                                      <BreadcrumbItem>
                                        <BreadcrumbPage className="text-gray-500">Colors</BreadcrumbPage>
                                      </BreadcrumbItem>
                                      <BreadcrumbSeparator>
                                        /
                                      </BreadcrumbSeparator>
                                      <BreadcrumbItem>
                                        <BreadcrumbPage className="text-gray-500">Blue</BreadcrumbPage>
                                      </BreadcrumbItem>
                                      <BreadcrumbSeparator>
                                        /
                                      </BreadcrumbSeparator>
                                      <BreadcrumbItem>
                                        <BreadcrumbPage className="text-gray-500">900</BreadcrumbPage>
                                      </BreadcrumbItem>
                                    </BreadcrumbList>
                                  </Breadcrumb>
                                </div>
                              </SheetHeader>
                              <div className="px-2">
                                <Separator className="mb-4 mt-6" />
                                <p className="flex items-center gap-3 mb-3">
                                  <SwatchBook className="text-slate-700 opacity-70 w-[14px] h-[14px]" strokeWidth={1.5} />
                                  <span className="font-normal text-sm">Color Spaces</span>
                                </p>
                                <ul className="flex flex-col gap-3">
                                  <li className="px-4 py-2 w-full bg-gray-100 flex justify-between rounded-md border border-input bg-transparent shadow-sm border-t-[#f3f3f3]">
                                    <p className="font-mono text-xs text-gray-400">HEX</p>
                                    <div className="relative">
                                      <p className={cn(
                                        "font-mono text-xs absolute transition-[filter,transform,opacity] duration-400",
                                        selectedValue === "on" ? "blur-none translate-y-0 opacity-100" : "blur-sm translate-y-2 opacity-0"
                                      )}>
                                        #0077C8
                                      </p>
                                      <p className={cn(
                                        "font-mono text-xs transition-[filter,transform,opacity] duration-400",
                                        selectedValue === "off" ? "blur-none translate-y-0 opacity-100" : "blur-sm translate-y-[-20px] opacity-0"
                                      )}>
                                        0077C8
                                      </p>
                                    </div>
                                  </li>
                                  <li className="px-4 py-2 w-full bg-gray-100 flex justify-between rounded-md border border-input bg-transparent shadow-sm border-t-[#f3f3f3]">
                                    <p className="font-mono text-xs text-gray-400">RGB</p>
                                    <div className="relative">
                                      <p className={cn(
                                        "font-mono text-xs absolute transition-[filter,transform,opacity] duration-400",
                                        selectedValue === "on" ? "blur-none translate-y-0 opacity-100" : "blur-sm translate-y-2 opacity-0"
                                      )}>
                                        #0077C8
                                      </p>
                                      <p className={cn(
                                        "font-mono text-xs transition-[filter,transform,opacity] duration-400",
                                        selectedValue === "off" ? "blur-none translate-y-0 opacity-100" : "blur-sm translate-y-[-20px] opacity-0"
                                      )}>
                                        0077C8
                                      </p>
                                    </div>
                                  </li>
                                  <li className="px-4 py-2 w-full bg-gray-100 flex justify-between rounded-md border border-input bg-transparent shadow-sm border-t-[#f3f3f3]">
                                    <p className="font-mono text-xs text-gray-400">HSL</p>
                                    <p className="font-mono text-xs">
                                      {selectedValue === "on" ? "hsl(210deg, 100%, 40%)" : "210°, 100%, 40%"}
                                    </p>
                                  </li>
                                  <li className="px-4 py-2 w-full bg-gray-100 flex justify-between rounded-md border border-input bg-transparent shadow-sm border-t-[#f3f3f3]">
                                    <p className="font-mono text-xs text-gray-400">LCH</p>
                                    <p className="font-mono text-xs">
                                      {selectedValue === "on" ? "lch(49 50 273)" : "49, 50, 273"}
                                    </p>
                                  </li>
                                </ul>
                                <div className="flex justify-end hidden">
                                  <div className="inline-flex h-7 rounded-lg bg-input/50 p-0.5 mt-3">
                                    <RadioGroup
                                      value={selectedValue}
                                      onValueChange={setSelectedValue}
                                      className="group relative inline-grid grid-cols-[1fr_1fr] items-center gap-0 text-xs font-medium after:absolute after:inset-y-0 after:w-1/2 after:rounded-md after:bg-background after:shadow-sm after:shadow-black/5 after:outline-offset-2 after:transition-transform after:duration-300 after:[transition-timing-function:cubic-bezier(0.16,1,0.3,1)] has-[:focus-visible]:after:outline has-[:focus-visible]:after:outline-2 has-[:focus-visible]:after:outline-ring/70 data-[state=off]:after:translate-x-0 data-[state=on]:after:translate-x-full"
                                      data-state={selectedValue}
                                    >
                                      <label className="relative z-10 inline-flex h-full min-w-6 cursor-pointer select-none items-center justify-center whitespace-nowrap px-3 transition-colors group-data-[state=on]:text-muted-foreground/70">
                                        Raw Value
                                        <RadioGroupItem value="off" className="sr-only" />
                                      </label>
                                      <label className="relative z-10 inline-flex h-full min-w-8 cursor-pointer select-none items-center justify-center whitespace-nowrap px-4 transition-colors group-data-[state=off]:text-muted-foreground/70">
                                        <span>
                                          CSS
                                        </span>
                                        <RadioGroupItem value="on" className="sr-only" />
                                      </label>
                                    </RadioGroup>
                                  </div>
                                </div>
                                <Separator className="mb-4 mt-6" />
                                <p className="flex items-center gap-3 mb-3">
                                  <Contrast className="text-slate-700 opacity-70 w-[14px] h-[14px]" strokeWidth={1.5} />
                                  <span className="font-normal text-sm">Contrast</span>
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="p-4 rounded-md border border-input bg-transparent">
                                    <p className="text-xs font-medium mb-3">Small Text</p>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline">4.5:1</Badge>
                                      <span className="text-xs text-gray-500">Required</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                      <Badge variant="green">7.2:1</Badge>
                                      <span className="text-xs text-gray-500">Current</span>
                                    </div>
                                  </div>
                                  <div className="p-4 rounded-md border border-input bg-transparent">
                                    <p className="text-xs font-medium mb-3">Large Text</p>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline">3:1</Badge>
                                      <span className="text-xs text-gray-500">Required</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                      <Badge variant="green">7.2:1</Badge>
                                      <span className="text-xs text-gray-500">Current</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </SheetContent>
                          </Sheet>
                        </div>
                        <p className="text-sm font-medium mb-1">900</p>
                        <small className="text-xs font-mono text-gray-400 font-light">#003152</small>
                      </div>
                    </div>
                  </div>
                  <Separator className="my-14" />
                  <div className="pb-32">
                    <h2 className="text-2xl font-medium mb-3">Typography</h2>
                    <p className="mb-8">Typographic system establishes scale, sizes and weight of text.</p>
                    <div className="rounded-lg bg-gray-50 p-7">
                      <p className="text-sm font-medium mb-3">Typeface</p>
                      <p className="text-sm text-gray-600 leading-relaxed mb-8">Inter</p>
                      <p className="text-sm text-gray-600 leading-relaxed mb-8">ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz</p>
                      <p>1234567890&apos;?&quot;!&quot;(%)[#]@/&amp;\-+÷×=®©$€£¥¢:;,.*</p>
                    </div>
                    <h3 className="text-lg font-medium mb-2 mt-6">Hierarchy</h3>
                    <p className="mb-8">Use for palette of colors containing many shades.</p>
                    
                    {[1, 2, 3].map((_, index) => (
                      <div key={index} className="">
                        <div className="grid grid-cols-[200px,1fr] gap-4 relative group py-8 hover:bg-gray-50 duration-200 rounded-lg">
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 inline-flex items-center justify-center gap-0 p-1 rounded-md border border-input bg-background shadow-sm">
                            <button className="p-2 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800">
                              <Copy className="h-3 w-3 text-gray-500" />
                            </button>
                            <button className="p-2 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800">
                              <Link className="h-3 w-3 text-gray-500" />
                            </button>
                            <button 
                              onClick={() => setOpenType(true)} 
                              className="p-2 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                              <TooltipProvider delayDuration={0}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Type className="h-3 w-3 text-gray-500" />
                                  </TooltipTrigger>
                                  <TooltipContent className="px-2 py-1 text-xs">Text Info</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </button>
                          </div>
                          <div>
                            <h3 className="text-base font-semibold">Heading 1</h3>
                            <small>Inter / Regular</small>
                            <small>16px / 24px</small>
                          </div>
                          <div>
                            <p className={`text-${3 - index}xl font-medium`}>Almost before we knew it, we had left the ground.</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    <Sheet
                      open={openType}
                      onOpenChange={setOpenType}
                    >
                      <SheetContent className="w-[400px] sm:w-[540px] overflow-auto  [&>button]:opacity-0 [&>button:hover]:opacity-0">
                        <SheetHeader className="px-2 space-y-2">
                        <div className="flex justify-between mb-4">
                          <TooltipProvider delayDuration={0}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="disabled:opacity-100 h-7 [&_svg]:size-3"
                                  onClick={handleCopy}
                                  aria-label={copied ? "Copied" : "Copy Link"}
                                  disabled={copied}
                                >
                                  <div
                                    className={cn(
                                      "transition-all",
                                      copied ? "scale-100 opacity-100" : "scale-0 opacity-0",
                                    )}
                                  >
                                    <Check className="stroke-emerald-500" size={12} strokeWidth={1.5} aria-hidden="true" />
                                  </div>
                                  <div
                                    className={cn(
                                      "absolute transition-all",
                                      copied ? "scale-0 opacity-0" : "scale-100 opacity-100",
                                    )}
                                  >
                                    <Link size={12} strokeWidth={1.5} aria-hidden="true" />
                                  </div>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="px-2 py-1 text-xs">Copy Link</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <SheetClose asChild>
                            <Button variant="outline" size="sm" className="h-7 [&_svg]:size-3">
                              <ArrowRightToLine />
                            </Button>
                          </SheetClose>
                        </div>
                          <div className="bg-gray-50 rounded-md h-48 mb-2 w-full flex items-center justify-center">
                            <span className="text-8xl font-medium">Ag</span>
                          </div>
                          <SheetTitle>Heading 1</SheetTitle>
                          <SheetDescription className="leading-relaxed">
                            Description from Figma, usually usage guideline like "Use for background" or "Use for text".
                          </SheetDescription>
                          <div className="flex items-center gap-2 mt-2 pt-3">
                            <svg className="w-2.5 h-2.5 text-slate-700" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>Figma</title><path d="M15.852 8.981h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.491-4.49 4.491zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019h-3.117V7.51zm0 1.471H8.148c-2.476 0-4.49-2.014-4.49-4.49S5.672 0 8.148 0h4.588v8.981zm-4.587-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.02 3.019 3.02h3.117V1.471H8.148zm4.587 15.019H8.148c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v8.98zM8.148 8.981c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h3.117V8.981H8.148zM8.172 24c-2.489 0-4.515-2.014-4.515-4.49s2.014-4.49 4.49-4.49h4.588v4.441c0 2.503-2.047 4.539-4.563 4.539zm-.024-7.51a3.023 3.023 0 0 0-3.019 3.019c0 1.665 1.365 3.019 3.044 3.019 1.705 0 3.093-1.376 3.093-3.068v-2.97H8.148zm7.704 0h-.098c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h.098c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.49-4.49 4.49zm-.097-7.509c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h.098c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019h-.098z"/></svg>
                            <Breadcrumb>
                              <BreadcrumbList className="text-xs text-gray-500">
                                <BreadcrumbItem>
                                  <BreadcrumbPage className="text-gray-500">Primitives</BreadcrumbPage>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator>
                                  /
                                </BreadcrumbSeparator>
                                <BreadcrumbItem>
                                  <BreadcrumbPage className="text-gray-500">Text</BreadcrumbPage>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator>
                                  /
                                </BreadcrumbSeparator>
                                <BreadcrumbItem>
                                  <BreadcrumbPage className="text-gray-500">Heading</BreadcrumbPage>
                                </BreadcrumbItem>
                              </BreadcrumbList>
                            </Breadcrumb>
                          </div>
                        </SheetHeader>
                        <Separator className="my-4" />
                        <div className="px-2">
                          <p className="flex items-center gap-3 mb-3">
                            <BookType className="text-slate-700 opacity-70 w-[14px] h-[14px]" strokeWidth={1.5} />
                            <span className="font-normal text-sm">Style Details</span>
                          </p>
                          <ul className="flex flex-col gap-3">
                            <li className="px-4 py-2 w-full bg-gray-100 flex justify-between rounded-md border border-input bg-transparent shadow-sm border-t-[#f3f3f3]">
                              <p className="font-mono text-xs text-gray-400">Font Size</p>
                              <p className="font-mono text-xs">64px</p>
                            </li>
                            <li className="px-4 py-2 w-full bg-gray-100 flex justify-between rounded-md border border-input bg-transparent shadow-sm border-t-[#f3f3f3]">
                              <p className="font-mono text-xs text-gray-400">Line Height</p>
                              <p className="font-mono text-xs">1.2</p>
                            </li>
                            <li className="px-4 py-2 w-full bg-gray-100 flex justify-between rounded-md border border-input bg-transparent shadow-sm border-t-[#f3f3f3]">
                              <p className="font-mono text-xs text-gray-400">Font Family</p>
                              <p className="font-mono text-xs">Inter</p>
                            </li>
                            <li className="px-4 py-2 w-full bg-gray-100 flex justify-between rounded-md border border-input bg-transparent shadow-sm border-t-[#f3f3f3]">
                              <p className="font-mono text-xs text-gray-400">Font Weight</p>
                              <p className="font-mono text-xs">Medium</p>
                            </li>
                          </ul>
                          <div className="flex justify-end hidden">
                            <div className="inline-flex h-7 rounded-lg bg-input/50 p-0.5 mt-3">
                              <RadioGroup
                                value={selectedValue}
                                onValueChange={setSelectedValue}
                                className="group relative inline-grid grid-cols-[1fr_1fr] items-center gap-0 text-xs font-medium after:absolute after:inset-y-0 after:w-1/2 after:rounded-md after:bg-background after:shadow-sm after:shadow-black/5 after:outline-offset-2 after:transition-transform after:duration-300 after:[transition-timing-function:cubic-bezier(0.16,1,0.3,1)] has-[:focus-visible]:after:outline has-[:focus-visible]:after:outline-2 has-[:focus-visible]:after:outline-ring/70 data-[state=off]:after:translate-x-0 data-[state=on]:after:translate-x-full"
                                data-state={selectedValue}
                              >
                                <label className="relative z-10 inline-flex h-full min-w-6 cursor-pointer select-none items-center justify-center whitespace-nowrap px-3 transition-colors group-data-[state=on]:text-muted-foreground/70">
                                  Raw Value
                                  <RadioGroupItem value="off" className="sr-only" />
                                </label>
                                <label className="relative z-10 inline-flex h-full min-w-8 cursor-pointer select-none items-center justify-center whitespace-nowrap px-4 transition-colors group-data-[state=off]:text-muted-foreground/70">
                                  <span>
                                    CSS
                                  </span>
                                  <RadioGroupItem value="on" className="sr-only" />
                                </label>
                              </RadioGroup>
                            </div>
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                  <Separator className="my-14" />
                  <div>
                    <h2 className="text-2xl font-medium mb-3">Do and Don't cards</h2>
                    <p className="mb-8">Should be used to highlight best practices and common mistakes.</p>
                    <div className="grid grid-cols-[repeat(auto-fit,minmax(100%,1fr))] sm:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6">
                      <div className="relative p-6 rounded-lg bg-slate-50 text-gray-600 ring-slate-500/20 ring-1 ring-inset">
                        <h2 className="font-medium mb-3 text-green-700">Best Practices</h2>
                        <ul className="space-y-3 text-emerald-800">
                          <li className="flex items-start gap-3">
                            <Check className="w-3 h-3 mt-1.5 text-emerald-600" strokeWidth={4}/>
                            <p className="text-sm">Use sufficient color contrast ratios (minimum 4.5:1) for text readability</p>
                          </li>
                          <li className="flex items-start gap-3">
                            <Check className="w-3 h-3 mt-1.5 text-emerald-600" strokeWidth={4}/>
                            <p className="text-sm">Provide text alternatives for non-text content</p>
                          </li>
                          <li className="flex items-start gap-3">
                            <Check className="w-3 h-3 mt-1.5 text-emerald-600" strokeWidth={4}/>
                            <p className="text-sm">Ensure keyboard navigation for all interactive elements</p>
                          </li>
                        </ul>
                      </div>
                      
                      <div className="relative p-6 rounded-lg bg-slate-50 text-gray-600 ring-slate-500/20 ring-1 ring-inset">
                        <h2 className="font-medium mb-3 text-red-900">Common Mistakes</h2>
                        <ul className="space-y-3 text-red-800">
                          <li className="flex items-start gap-2">
                            <X className="w-3 h-3 mt-1 text-red-600" />
                            <p className="text-sm leading-relaxed">Rely solely on color to convey information or indicate state</p>
                          </li>
                          <li className="flex items-start gap-2">
                            <X className="w-3 h-3 mt-1 text-red-600" />
                            <p className="text-sm leading-relaxed">Use low contrast color combinations that make text hard to read</p>
                          </li>
                          <li className="flex items-start gap-2">
                            <X className="w-3 h-3 mt-1 text-red-600" />
                            <p className="text-sm leading-relaxed">Skip proper heading hierarchy in document structure</p>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </SidebarInset>
            </div>
          </SidebarProvider>
        </div>
      </ThemeProvider>
    </div>
  )
}
