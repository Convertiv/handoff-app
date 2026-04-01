import { useState, useEffect } from 'react';
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
import { ChevronDown, FileCodeIcon, SaveIcon, SparklesIcon } from 'lucide-react';
import { usePlayground } from './PlaygroundContext';
import SortableItem from './SortableItem';
import Preview from './Preview';
import ComponentLibrary from './ComponentLibrary';
import TemplateManager from './TemplateManager';
import WizardDialog from './Wizard/WizardDialog';
import { constructComponentPreview } from './Preview';
import type { PlaygroundPageExport, SelectedPlaygroundComponent } from './types';

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

export default function PlaygroundBuilder() {
  const { selectedComponents, loading, error, onDragEnd, removeComponent, templates, saveAsTemplate } = usePlayground();
  const [html, setHtml] = useState('');
  const [loadingHtml, setLoadingHtml] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const basePath = process.env.HANDOFF_APP_BASE_PATH ?? '';

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const render = async () => {
      setLoadingHtml(true);
      const result = await constructComponentPreview(selectedComponents, basePath);
      setHtml(result);
      setLoadingHtml(false);
    };
    render();
  }, [selectedComponents, basePath]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Loading components...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="mb-4 text-destructive">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  const handleDownload = async () => {
    const downloadHtml = await constructComponentPreview(selectedComponents, basePath);
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
    <div className="h-full p-6">
      <nav className="mb-8 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Playground</h2>
        <div className="flex items-center gap-4">
          {templates.length > 0 && <TemplateManager />}
          {selectedComponents.length > 0 && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={handleSaveTemplate}>
                    <SaveIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Save as Template</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        <FileCodeIcon className="h-4 w-4" />
                        <ChevronDown className="h-4 w-4 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleDownload}>
                        Download as HTML
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleDownloadPage}>
                        Download as Handoff page
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TooltipTrigger>
                <TooltipContent>Download page</TooltipContent>
              </Tooltip>
            </>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" onClick={() => setWizardOpen(true)}>
                <SparklesIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Generate with AI</TooltipContent>
          </Tooltip>
          <ComponentLibrary />
          <WizardDialog open={wizardOpen} onOpenChange={setWizardOpen} />
        </div>
      </nav>

      <div className="h-full">
        <div className="grid h-full grid-cols-1 gap-8 lg:grid-cols-10">
          <div className="col-span-2 h-full">
            <div className="mb-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Selected ({selectedComponents.length})</h3>
              </div>
              {selectedComponents.length === 0 && <p className="text-muted-foreground">No components selected. Add some from the library!</p>}
            </div>

            {selectedComponents.length > 0 && (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={selectedComponents.map((c) => c.uniqueId)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {selectedComponents.map((component) => (
                      <SortableItem key={component.uniqueId} component={component} onRemove={removeComponent} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>

          <div className="col-span-8 h-full">
            <div className="mb-6 h-full">
              <div className="flex h-full items-center justify-between">
                {loadingHtml ? (
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                ) : (
                  <Preview html={html} className="min-h-[600px] rounded-lg border" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
