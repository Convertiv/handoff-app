import { PreviewObject } from '@handoff/types';
import { Filter, evaluateFilter } from '@handoff/utils/filter';
import React from 'react';
import { CodeHighlight } from '../../Markdown/CodeHighlight';
import { ComponentDisplay } from '../Preview';

export interface ComponentDisplaySliceProps {
  preview: PreviewObject;
  title: string;
  height?: string;
  currentValues?: Record<string, string>;
  onValuesChange?: (values: Record<string, string>) => void;
  showPreview?: boolean;
  showCodeHighlight?: boolean;
  defaultHeight?: string;
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
  currentValues,
  onValuesChange,
  showPreview = true,
  showCodeHighlight,
  defaultHeight,
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

  return (
    <div id={filteredPreview.id}>
      {showPreview && (
        <ComponentDisplay title={title} component={filteredPreview} defaultHeight={finalDefaultHeight} onValuesChange={onValuesChange} />
      )}
      {finalShowCodeHighlight && (
        <>
          <a id="code-highlight" />
          <CodeHighlight title={title} data={filteredPreview} collapsible={true} currentValues={currentValues} />
        </>
      )}
    </div>
  );
};

export default ComponentDisplaySlice;
