import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '../ui/sheet';
import { Button } from '../ui/button';
import { FileOutput, ListIcon, TrashIcon } from 'lucide-react';
import { usePlayground } from './PlaygroundContext';

export default function TemplateManager() {
  const { templates, deleteTemplate, loadTemplate } = usePlayground();
  const [open, setOpen] = useState(false);

  const handleDelete = (templateName: string) => {
    if (confirm(`Delete template "${templateName}"?`)) {
      deleteTemplate(templateName);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ListIcon className="h-4 w-4" />
          Templates
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="max-w-[400px] overflow-y-auto sm:max-w-[30vw]">
        <SheetHeader>
          <SheetTitle>Your Templates</SheetTitle>
          <SheetDescription>Saved page layouts you can load or remove.</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {templates.length === 0 ? (
            <p className="text-sm text-muted-foreground">You haven&apos;t created any templates yet.</p>
          ) : (
            templates.map((template) => (
              <div key={template.name} className="flex flex-col gap-2 rounded border border-border px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {template.name}
                    <span className="pl-2 text-xs text-muted-foreground">{new Date(template.created_at).toLocaleDateString()}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm('Load this template? This will replace your current components.')) {
                          loadTemplate(template.name);
                          setOpen(false);
                        }
                      }}
                      title="Load template"
                    >
                      <FileOutput className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(template.name)} title="Delete template">
                      <TrashIcon className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <details>
                  <summary className="mt-1 cursor-pointer text-sm text-muted-foreground hover:underline">
                    Components ({template.components.length})
                  </summary>
                  <ul className="ml-4 mt-2 list-disc space-y-1 text-xs text-muted-foreground">
                    {template.components.length === 0 ? (
                      <li>No components in this template.</li>
                    ) : (
                      template.components.map((comp, idx) => (
                        <li key={comp.uniqueId || `${comp.id}-${idx}`}>{comp.title || `Component ${idx + 1}`}</li>
                      ))
                    )}
                  </ul>
                </details>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
