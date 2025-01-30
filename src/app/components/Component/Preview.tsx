import React, { useCallback, useEffect } from 'react';
import { CodeHighlight } from '../Markdown/CodeHighlight';

import { ComponentInstance } from '@handoff/exporters/components/types';
import { SlotMetadata } from '@handoff/transformers/preview/component';
import { PreviewObject } from '@handoff/types';
import { Breakpoints } from '@handoff/types/config';
import { startCase } from 'lodash';
import { PencilRuler } from 'lucide-react';
import { usePreviewContext } from '../context/PreviewContext';
import RulesSheet from '../Foundations/RulesSheet';
import { Button } from '../ui/button';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCaption, TableHead, TableHeader, TableRow } from '../ui/table';

export type ComponentPreview = {
  component: ComponentInstance;
  name: string;
  preview: PreviewObject | undefined;
  overrides?: { states?: string[] | undefined };
};

export type ComponentPreviews = ComponentPreview[];

export const getComponentPreviewTitle = (previewableComponent: ComponentPreview): string => {
  return previewableComponent.name ? `${previewableComponent.name}` : `${startCase(previewableComponent.component.name)}`;
};

export const OverviewComponentPreview: React.FC<{ components: ComponentPreviews; breakpoints?: Breakpoints }> = ({
  components,
  breakpoints,
}) => {
  return (
    <>
      {components.map((previewableComponent) => {
        const component = previewableComponent.component;
        return (
          <div key={`${component.id}`} id={component.id}>
            <h4>{getComponentPreviewTitle(previewableComponent)}</h4>
            <p>{component.description}</p>
            <div className="c-component-preview">
              <ComponentDisplay component={previewableComponent.preview} breakpoints={breakpoints} />
            </div>
            <CodeHighlight data={previewableComponent.preview} />
            <hr />
          </div>
        );
      })}
    </>
  );
};

export const ComponentDisplay: React.FC<{
  component: PreviewObject | undefined;
  breakpoints?: Breakpoints;
  defaultHeight?: string | undefined;
}> = ({ component, breakpoints, defaultHeight }) => {
  const sortedBreakpoints = breakpoints ? Object.keys(breakpoints).sort((a, b) => breakpoints[b].size - breakpoints[a].size) : [];
  const ref = React.useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = React.useState('500px');
  const [previewUrl, setPreviewUrl] = React.useState('');
  const [width, setWidth] = React.useState(breakpoints[sortedBreakpoints[0]].size + 'px');
  const [breakpoint, setBreakpoint] = React.useState(breakpoints ? sortedBreakpoints[0] : '');

  const onLoad = useCallback(() => {
    if (defaultHeight) {
      setHeight(defaultHeight);
    } else if (ref.current) {
      if (ref.current.contentWindow.document.body) {
        setHeight(ref.current.contentWindow.document.body.scrollHeight + 'px');
      }
      // if (window.document.body.clientWidth) {
      //   sortedBreakpoints.some((key, index) => {
      //     if (window.document.body.clientWidth > breakpoints[key].size) {
      //       setBreakpoint(key);
      //       return true;
      //     }
      //   });
      // }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultHeight, ref, breakpoints]);

  React.useEffect(() => {
    onLoad();
    window.addEventListener('resize', onLoad);
    return () => {
      window.removeEventListener('resize', onLoad);
    };
  }, [onLoad]);

  React.useEffect(() => {
    if (component) {
      if (component.previews) {
        const keys = Object.keys(component.previews);
        // check the environment
        setPreviewUrl(`/api/component/` + component.previews[keys[0]].url);
      }
    }
  }, [component]);
  return (
    <div className="md:flex">
      <div className="text-medium w-full rounded-lg bg-gray-50 p-6 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
        {component?.previews ? (
          <>
            <div className="flex items-center justify-between py-1 align-middle">
              <Select
                defaultValue={breakpoint}
                onValueChange={(key) => {
                  setBreakpoint(key);
                  setWidth(`${breakpoints[key].size}px`);
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Breakpoint" />
                </SelectTrigger>
                <SelectContent>
                  {breakpoints &&
                    Object.keys(breakpoints).map((key) => (
                      <SelectItem key={'breakpoint_' + key} value={key}>
                        {breakpoints[key].name}
                      </SelectItem>
                    ))}
                  <SelectItem value="full">Full Width</SelectItem>
                </SelectContent>
              </Select>

              <div className="mt-3 inline-flex h-7 rounded-lg bg-input/50 p-0.5">
                <RadioGroup
                  value={previewUrl}
                  onValueChange={setPreviewUrl}
                  className="group relative inline-grid grid-cols-[1fr_1fr] items-center gap-0 text-xs font-medium after:absolute after:inset-y-0 after:w-1/2 after:rounded-md after:bg-background after:shadow-sm after:shadow-black/5 after:outline-offset-2 after:transition-transform after:duration-300 after:[transition-timing-function:cubic-bezier(0.16,1,0.3,1)] has-[:focus-visible]:after:outline has-[:focus-visible]:after:outline-2 has-[:focus-visible]:after:outline-ring/70 data-[state=off]:after:translate-x-0 data-[state=on]:after:translate-x-full"
                  data-state={previewUrl}
                >
                  {Object.keys(component.previews).map((key) => (
                    <label className="relative z-10 inline-flex h-full min-w-6 cursor-pointer select-none items-center justify-center whitespace-nowrap px-3 transition-colors group-data-[state=on]:text-muted-foreground/70">
                      {component.previews[key].title}
                      <RadioGroupItem value={`/api/component/` + component.previews[key].url} className="sr-only" />
                    </label>
                  ))}
                </RadioGroup>
              </div>
            </div>

            <iframe
              onLoad={onLoad}
              ref={ref}
              height={height}
              style={{
                width: '1px',
                minWidth: width,
                height: height,
              }}
              src={previewUrl}
            />
          </>
        ) : (
          <iframe
            onLoad={onLoad}
            ref={ref}
            height={height}
            style={{
              width: '1px',
              minWidth: width,
              height: height,
            }}
            srcDoc={component?.preview}
          />
        )}
      </div>
    </div>
  );
};

export const ComponentPreview: React.FC<{
  defaultPreview?: PreviewObject;
  id: string;
  code?: string;
  title: string;
  children: React.ReactNode;
  height?: string;
}> = ({ defaultPreview, title, children, id, height }) => {
  const context = usePreviewContext();
  const config = context.config;
  const [loaded, setLoaded] = React.useState(false);
  const [preview, setPreview] = React.useState<PreviewObject | undefined>(defaultPreview);
  React.useEffect(() => {
    async function loadPreview() {
      if (!preview && context && id) {
        let previewData = await context.getPreview(id);
        if (previewData) {
          setPreview(previewData);
        }
      }
      setLoaded(true);
    }
    loadPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, setLoaded]);

  if (!preview) {
    return null;
  }
  if (!loaded) {
    return <div id={preview.id}>Loading Previews</div>;
  }
  return (
    <div id={preview.id}>
      <div>
        <ComponentDisplay component={preview} breakpoints={config.app.breakpoints} defaultHeight={height} />
        <CodeHighlight title={title} data={preview} collapsible={true} />
      </div>
      {preview?.properties && (
        <>
          <h3>Properties</h3>
          <ComponentProperties
            fields={Object.keys(preview.properties).map((key) => {
              return { ...preview.properties[key], key };
            })}
          />
        </>
      )}
      <hr />
    </div>
  );
};

export const ComponentProperties: React.FC<{ fields: SlotMetadata[] }> = ({ fields }) => {
  const [open, setOpen] = React.useState(false);
  const [selectedField, setSelectedField] = React.useState(null);
  const openSheet = (field) => {
    setSelectedField(field);
    setOpen(true);
  };
  const openFromHash = () => {
    if (window.location.hash) {
      const field = fields.find((field) => field.key === window.location.hash.replace('#', ''));
      if (field) {
        setSelectedField(field);
        setOpen(true);
      }
    }
  };
  useEffect(() => {
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
  }, [fields]);
  return (
    <>
      <RulesSheet open={open} setOpen={setOpen} field={selectedField} />
      <Table>
        <TableCaption>These are the fields associated with the component</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Id</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRows rows={fields} openSheet={openSheet} />
        </TableBody>
      </Table>
    </>
  );
};

const TableRows: React.FC<{ rows: SlotMetadata[]; openSheet: (SlotMetadata) => void; hasParent?: boolean | undefined }> = ({
  rows,
  openSheet,
  hasParent,
}) => {
  return (
    <>
      {rows.map((row, i) => {
        console.log(row);
        if (!row) return null;
        if (row.type === 'array') {
          return (
            <>
              <TableRowInstance row={row} openSheet={openSheet} hasParent={hasParent} key={`row-${i}`} />
              {row.items && row.items.properties && (
                <TableRows
                  rows={Object.keys(row.items.properties).map((key) => {
                    return { ...row.items.properties[key], key };
                  })}
                  openSheet={openSheet}
                  hasParent={true}
                  key={`row-${i}-items`}
                />
              )}
            </>
          );
        }
        return <TableRowInstance row={row} openSheet={openSheet} hasParent={hasParent} key={`row-${i}`} />;
      })}
    </>
  );
};

const TableRowInstance: React.FC<{ row: SlotMetadata; openSheet: (SlotMetadata) => void; hasParent?: boolean | undefined }> = ({
  row,
  openSheet,
  hasParent,
}) => {
  return (
    <TableRow>
      <TableHead>
        {hasParent && '- '}
        {row.key}
      </TableHead>
      <TableHead>{startCase(row.name)}</TableHead>
      <TableHead>{row.type}</TableHead>
      <TableHead>
        <span className="slot-description">{row.description}</span>
      </TableHead>
      <TableHead className="text-right">
        <Button variant="ghost" onClick={() => openSheet(row)}>
          <PencilRuler />
        </Button>
      </TableHead>
    </TableRow>
  );
};
