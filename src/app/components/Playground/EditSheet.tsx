import { PencilIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { EditContextProvider, useEditContext } from './EditContext';
import { renderFormFields } from './fields/Field';
import MediaBrowser from './MediaBrowser';
import Preview, { previewRenderedHtml } from './Preview';
import { SelectedPlaygroundComponent } from './types';

interface EditSheetProps {
  component: SelectedPlaygroundComponent | null;
  onClose: () => void;
}

export default function EditSheet({ component, onClose }: EditSheetProps) {
  const [open, setOpen] = useState(false);

  const closeSheet = () => {
    setOpen(false);
    onClose();
  };

  if (!component) return null;

  return (
    <EditContextProvider component={component}>
      <Sheet
        open={open}
        onOpenChange={(value) => {
          if (!value) closeSheet();
        }}
      >
        <SheetTrigger asChild onClick={() => setOpen(true)}>
          <Button variant="ghost" size="sm" className="cursor-pointer px-4">
            <PencilIcon className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="max-w-[400px] overflow-y-auto sm:max-w-[90vw]">
          <SheetHeader className="mb-4">
            <SheetTitle>Edit {component.title}</SheetTitle>
            <SheetDescription className="w-1/2 text-sm text-muted-foreground">{component.description}</SheetDescription>
          </SheetHeader>
          <EditSheetContent closeSheet={closeSheet} />
        </SheetContent>
      </Sheet>
      <MediaBrowser />
    </EditContextProvider>
  );
}

function EditSheetContent({ closeSheet }: { closeSheet: () => void }) {
  const { component, properties, data, previewHtml, iframeRef, handleSave } = useEditContext();
  const basePath = process.env.HANDOFF_APP_BASE_PATH ?? '';
  const isReact = component?.format === 'react';

  const saveHandler = () => {
    handleSave();
    closeSheet();
  };

  const previewContent = isReact ? previewHtml : previewRenderedHtml(previewHtml, basePath);

  return (
    <>
      <div className="grid grid-cols-1 gap-8 px-6 lg:grid-cols-10">
        <div className="col-span-3 max-h-[80vh] space-y-4 overflow-y-auto px-5">{renderFormFields(properties, data)}</div>
        <div className="col-span-7 h-[80vh] overflow-hidden rounded-lg border">
          <Preview html={previewContent} iframeRef={isReact ? iframeRef : undefined} />
        </div>
      </div>
      <div className="ms-6 flex justify-start space-x-2">
        <Button variant="outline" onClick={closeSheet}>
          Cancel
        </Button>
        <Button onClick={saveHandler}>Save Changes</Button>
      </div>
    </>
  );
}
