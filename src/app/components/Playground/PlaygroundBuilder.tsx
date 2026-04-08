import { useState, useEffect, useRef, useCallback } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import {
  ChevronDown,
  FileCodeIcon,
  Layers,
  Maximize,
  Minimize,
  Monitor,
  PanelLeft,
  PanelRight,
  Plus,
  SaveIcon,
  Settings2,
  Smartphone,
  SparklesIcon,
  Tablet,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { usePlayground } from './PlaygroundContext';
import { EditContextProvider, useEditContext } from './EditContext';
import SortableItem from './SortableItem';
import Preview, { constructComponentPreview } from './Preview';
import ComponentLibrary from './ComponentLibrary';
import TemplateManager from './TemplateManager';
import WizardDialog from './Wizard/WizardDialog';
import MediaBrowser from './MediaBrowser';
import { renderFormFields } from './fields/Field';
import type { PlaygroundPageExport, SelectedPlaygroundComponent } from './types';

const VIEWPORTS = {
  desktop: { width: '100%', icon: Monitor, label: 'Desktop' },
  tablet: { width: '768px', icon: Tablet, label: 'Tablet' },
  mobile: { width: '375px', icon: Smartphone, label: 'Mobile' },
} as const;

type ViewportKey = keyof typeof VIEWPORTS;

function buildHandoffPageExport(selectedComponents: SelectedPlaygroundComponent[]): PlaygroundPageExport {
  return {
    title: 'Playground Page',
    description: '',
    group: 'Playground',
    components: selectedComponents.map((c) => c.id),
    previews: {
      default: {
        title: 'Default',
        values: selectedComponents.map((c) => c.data ?? {}),
      },
    },
  };
}

function RightPanelContent() {
  const { component, properties, data, handleSave } = useEditContext();
  if (!component) return null;

  return (
    <>
      <div className="border-b px-4 py-3">
        <h3 className="truncate text-sm font-semibold">{component.title}</h3>
        {component.description && (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{component.description}</p>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {renderFormFields(properties, data)}
      </div>
      <div className="border-t p-3">
        <Button onClick={handleSave} size="sm" className="w-full">
          Apply Changes
        </Button>
      </div>
    </>
  );
}

export default function PlaygroundBuilder() {
  const {
    selectedComponents,
    loading,
    error,
    onDragEnd,
    removeComponent,
    templates,
    saveAsTemplate,
    activeComponentId,
    setActiveComponentId,
  } = usePlayground();

  const [html, setHtml] = useState('');
  const [loadingHtml, setLoadingHtml] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [viewport, setViewport] = useState<ViewportKey>('desktop');
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const basePath = process.env.HANDOFF_APP_BASE_PATH ?? '';
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (!previewContainerRef.current) return;
    if (!document.fullscreenElement) {
      previewContainerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const activeComponent = selectedComponents.find((c) => c.uniqueId === activeComponentId) ?? null;

  useEffect(() => {
    if (activeComponentId && !rightPanelOpen) {
      setRightPanelOpen(true);
    }
  }, [activeComponentId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const render = async () => {
      setLoadingHtml(true);
      const result = await constructComponentPreview(selectedComponents, basePath, { injectBlockControls: true });
      setHtml(result);
      setLoadingHtml(false);
    };
    render();
  }, [selectedComponents, basePath]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'playground-block-action') {
        const { action, blockId } = event.data;
        if (action === 'edit') {
          setActiveComponentId(blockId);
        } else if (action === 'delete') {
          removeComponent(blockId);
        }
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [setActiveComponentId, removeComponent]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary"></div>
          <p className="mt-3 text-sm text-muted-foreground">Loading components…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-sm text-destructive">{error}</p>
          <Button onClick={() => window.location.reload()} size="sm">Try Again</Button>
        </div>
      </div>
    );
  }

  const handleDownload = async () => {
    const downloadHtml = await constructComponentPreview(selectedComponents, basePath, { injectBlockControls: false });
    const blob = new Blob([downloadHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'page.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPage = () => {
    const pageExport = buildHandoffPageExport(selectedComponents);
    const blob = new Blob([JSON.stringify(pageExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'playground-page.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveTemplate = () => {
    const name = prompt('Enter a name for the template');
    if (name) {
      if (templates.some((t) => t.name === name)) {
        alert('A template with this name already exists.');
        return;
      }
      saveAsTemplate(name);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* ── Top Toolbar ── */}
      <div className="relative flex h-12 shrink-0 items-center border-b bg-background px-2">
        {/* Left group */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setLeftPanelOpen(!leftPanelOpen)}>
                <PanelLeft className={cn('h-4 w-4 transition-colors', leftPanelOpen && 'text-primary')} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{leftPanelOpen ? 'Hide blocks' : 'Show blocks'}</TooltipContent>
          </Tooltip>

          <div className="mx-1 h-4 w-px bg-border" />

          {templates.length > 0 && <TemplateManager />}

          {selectedComponents.length > 0 && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleSaveTemplate}>
                    <SaveIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Save as template</TooltipContent>
              </Tooltip>

              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 gap-1 px-2">
                        <FileCodeIcon className="h-4 w-4" />
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Export</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={handleDownload}>Download as HTML</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownloadPage}>Download as Handoff page</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setWizardOpen(true)}>
                <SparklesIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Generate with AI</TooltipContent>
          </Tooltip>
        </div>

        {/* Center group — viewport controls */}
        <div className="absolute left-1/2 flex -translate-x-1/2 items-center rounded-lg border bg-muted/50 p-0.5">
          {(Object.entries(VIEWPORTS) as [ViewportKey, (typeof VIEWPORTS)[ViewportKey]][]).map(([key, { icon: Icon, label }]) => (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setViewport(key)}
                  className={cn(
                    'rounded-md px-3 py-1.5 transition-colors',
                    viewport === key
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{label}</TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Right group */}
        <div className="ml-auto flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={toggleFullscreen}>
                {isFullscreen
                  ? <Minimize className="h-4 w-4" />
                  : <Maximize className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{isFullscreen ? 'Exit fullscreen' : 'Fullscreen preview'}</TooltipContent>
          </Tooltip>

          <div className="mx-1 h-4 w-px bg-border" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setRightPanelOpen(!rightPanelOpen)}>
                <PanelRight className={cn('h-4 w-4 transition-colors', rightPanelOpen && 'text-primary')} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{rightPanelOpen ? 'Hide settings' : 'Show settings'}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* ── Main content area ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Panel — Blocks ── */}
        {leftPanelOpen && (
          <div className="flex w-[260px] shrink-0 flex-col border-r bg-background">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Blocks</span>
              </div>
              {selectedComponents.length > 0 && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                  {selectedComponents.length}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {selectedComponents.length === 0 ? (
                <div className="flex flex-1 items-center justify-center px-4">
                  <ComponentLibrary
                    trigger={
                      <button className="flex w-full flex-col items-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/20 px-4 py-10 text-center transition-colors hover:border-primary/30 hover:bg-muted/30">
                        <div className="rounded-full bg-muted p-3">
                          <Plus className="h-6 w-6 text-muted-foreground/50" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Add your first block</p>
                          <p className="mt-1 text-xs text-muted-foreground/70">Browse the component library</p>
                        </div>
                      </button>
                    }
                  />
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                  <SortableContext items={selectedComponents.map((c) => c.uniqueId)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-0.5">
                      {selectedComponents.map((component) => (
                        <SortableItem
                          key={component.uniqueId}
                          component={component}
                          isActive={component.uniqueId === activeComponentId}
                          onClick={() => setActiveComponentId(
                            component.uniqueId === activeComponentId ? null : component.uniqueId
                          )}
                          onRemove={removeComponent}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>

            <div className="border-t p-3">
              <ComponentLibrary
                trigger={
                  <Button variant="outline" size="sm" className="w-full gap-2 border-dashed">
                    <Plus className="h-4 w-4" />
                    Add Block
                  </Button>
                }
              />
            </div>
          </div>
        )}

        {/* ── Center — Preview Canvas ── */}
        <div ref={previewContainerRef} className="flex flex-1 flex-col overflow-hidden bg-background">
          <div
            className={cn(
              'flex flex-1 overflow-auto',
              viewport === 'desktop'
                ? 'p-0'
                : 'items-start justify-center bg-muted/30 p-6 dark:bg-muted/10'
            )}
          >
            <div
              className={cn(
                'h-full w-full transition-[max-width] duration-300',
                viewport !== 'desktop' && 'mx-auto overflow-hidden rounded-lg border bg-background shadow-md'
              )}
              style={{
                maxWidth: VIEWPORTS[viewport].width,
              }}
            >
              {loadingHtml ? (
                <div className="flex h-full items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary"></div>
                </div>
              ) : (
                <Preview html={html} className="h-full" />
              )}
            </div>
          </div>
        </div>

        {/* ── Right Panel — Settings ── */}
        {rightPanelOpen && (
          <div className="flex w-[300px] shrink-0 flex-col border-l bg-background">
            {activeComponent ? (
              <EditContextProvider key={activeComponent.uniqueId} component={activeComponent}>
                <RightPanelContent />
                <MediaBrowser />
              </EditContextProvider>
            ) : (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                <Settings2 className="mb-3 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">No block selected</p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Click a block in the left panel to edit its properties here.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <WizardDialog open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
}
