import { useState } from 'react';
import { useEditContext } from '../EditContext';

export function RichTextField({ identifier }: { identifier: string[]; value: any; data: any }) {
  const { getData, handleInputChange } = useEditContext();
  const [localData] = useState(getData(identifier));

  return (
    <div>
      <div className="mb-1 flex space-x-1">
        <button type="button" title="Bold" className="rounded border px-2 py-1 text-sm" onClick={() => document.execCommand('bold')} tabIndex={-1}>
          <b>B</b>
        </button>
        <button type="button" title="Italic" className="rounded border px-2 py-1 text-sm" onClick={() => document.execCommand('italic')} tabIndex={-1}>
          <i>I</i>
        </button>
        <button type="button" title="Underline" className="rounded border px-2 py-1 text-sm" onClick={() => document.execCommand('underline')} tabIndex={-1}>
          <u>U</u>
        </button>
        <button type="button" title="List" className="rounded border px-2 py-1 text-sm" onClick={() => document.execCommand('insertUnorderedList')} tabIndex={-1}>
          &bull; List
        </button>
      </div>
      <div
        id={identifier[identifier.length - 1]}
        contentEditable
        suppressContentEditableWarning
        className="min-h-[80px] rounded-md border bg-background px-3 py-2 focus:outline-hidden focus:ring-2 focus:ring-ring"
        dangerouslySetInnerHTML={{ __html: localData || '' }}
        onInput={(e) => handleInputChange([...identifier], (e.target as HTMLDivElement).innerHTML)}
      />
    </div>
  );
}
