import { PreviewWidth } from '@handoff/transformers/preview/types';
import { PreviewObject } from '@handoff/types/preview';
import { Filter, evaluateFilter } from '@handoff/utils/filter';
import React from 'react';
import { CodeHighlight } from '../../Markdown/CodeHighlight';
import { ComponentDisplay } from '../Preview';

export interface ComponentDisplaySliceProps {
  preview: PreviewObject;
  title: string;
  height?: string;
  currentPreviewUrl?: string;
  onPreviewChange?: (previewUrl: string) => void;
  showPreview?: boolean;
  showCodeHighlight?: boolean;
  defaultHeight?: string;
  defaultWidth?: PreviewWidth;
  filterBy?: Filter;
  codeHighlight?: boolean;
}

/**
 * Filters previews based on a filter configuration
 */
function filterPreviews(previews: Record<string, any>, filter: Filter): Record<string, any> {
  return Object.fromEntries(
    Object.entries(previews).filter(([_, preview]) => {
      const result = evaluateFilter(preview.values, filter);
      return result.matches;
    })
  );
}

const ComponentDisplaySlice: React.FC<ComponentDisplaySliceProps> = ({
  preview,
  title,
  height,
  currentPreviewUrl,
  onPreviewChange,
  showPreview = true,
  showCodeHighlight,
  defaultHeight,
  defaultWidth,
  filterBy,
  codeHighlight = true,
}) => {
  const finalShowCodeHighlight = showCodeHighlight ?? codeHighlight;
  const finalDefaultHeight = defaultHeight ?? height;

  // Apply slice-level filtering if specified
  let filteredPreview = preview;
  if (filterBy) {
    const filteredPreviews = filterPreviews(preview.previews, filterBy);

    // If no previews match the filter, fall back to original previews
    if (Object.keys(filteredPreviews).length === 0) {
      // Don't apply filtering, use original previews
      filteredPreview = preview;
    } else {
      filteredPreview = {
        ...preview,
        previews: filteredPreviews,
      };
    }
  }

  // Under a preview the code sits inside its card, as one block; with no preview it stands on its own.
  const attachCode = finalShowCodeHighlight && showPreview;
  const codeSample = (attached: boolean) => (
    <>
      <a id="code-highlight" />
      <CodeHighlight data={filteredPreview} collapsible={true} attached={attached} currentPreviewUrl={currentPreviewUrl} />
    </>
  );

  // `mb-10` separates the code sample from the next slice, which has no top margin.
  return (
    <div id={filteredPreview.id} className={finalShowCodeHighlight ? 'mb-10' : undefined}>
      {showPreview && (
        <ComponentDisplay
          title={title}
          component={filteredPreview}
          defaultHeight={finalDefaultHeight}
          defaultWidth={defaultWidth}
          onPreviewChange={onPreviewChange}
          footer={attachCode ? codeSample(true) : undefined}
        />
      )}
      {finalShowCodeHighlight && !attachCode && codeSample(false)}
    </div>
  );
};

export default ComponentDisplaySlice;
