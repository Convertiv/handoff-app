import React, { useCallback, useEffect } from 'react';
import { CodeHighlight } from '../Markdown/CodeHighlight';

import { ComponentInstance } from '@handoff/exporters/components/types';
import { SlotMetadata } from '@handoff/transformers/preview/component';
import { PreviewObject } from '@handoff/types';
import { Breakpoints } from '@handoff/types/config';
import { startCase } from 'lodash';
import { Component, File, FolderOpenIcon, Fullscreen, MoveHorizontal, RefreshCcw, Text } from 'lucide-react';
import { usePreviewContext } from '../context/PreviewContext';
import RulesSheet from '../Foundations/RulesSheet';
import HeadersType from '../Typography/Headers';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import BestPracticesCard from './BestPracticesCard';

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
  const [height, setHeight] = React.useState('100px');
  const [previewUrl, setPreviewUrl] = React.useState('');
  const [width, setWidth] = React.useState(breakpoints[sortedBreakpoints[1]].size + 'px');
  const [breakpoint, setBreakpoint] = React.useState(breakpoints ? sortedBreakpoints[1] : '');

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
              <div className="flex items-center gap-2">
                <Select defaultValue={previewUrl} onValueChange={setPreviewUrl}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Preview" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(component.previews).map((key) => (
                      <SelectItem
                        key={`/api/component/` + component.previews[key].url}
                        value={`/api/component/` + component.previews[key].url}
                      >
                        {component.previews[key].title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  onClick={() => {
                    if (ref.current) {
                      ref.current.contentWindow.location.reload();
                    }
                  }}
                  variant="outline"
                >
                  <RefreshCcw />
                </Button>
                <Button
                  onClick={() => {
                    // make div fullscreen
                    if (ref.current) {
                      ref.current.requestFullscreen();
                    }
                  }}
                  variant="outline"
                >
                  <Fullscreen />
                </Button>
                <Button
                  onClick={() => {
                    // open in new tab
                    window.open(previewUrl, '_blank');
                  }}
                  variant="outline"
                >
                  <FolderOpenIcon />
                </Button>
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
        <BestPracticesCard component={preview} />
        <ComponentDisplay component={preview} breakpoints={config.app.breakpoints} defaultHeight={height} />
        <CodeHighlight title={title} data={preview} collapsible={true} />
      </div>
      {preview?.properties && (
        <>
          <HeadersType.H3>Properties</HeadersType.H3>
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
      const parts = window.location.hash.replace('#', '').split('.');
      if (parts.length > 1) {
        const field = fields.find((field) => field.key === parts[0]);
        if (field && field.properties) {
          const subField = field.properties[parts[1]];
          if (subField) {
            setSelectedField(subField);
            setOpen(true);
          }
        } else if (field && field.items && field.items.properties) {
          const subField = field.items.properties[parts[1]];
          if (subField) {
            setSelectedField(subField);
            setOpen(true);
          }
        } else {
          setSelectedField(field);
          setOpen(true);
        }
      }
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
      <p className="mb-5">These are the properties associated with the component.</p>
      <Table>
        <TableHeader className="border-b-0 border-l-[0.5px] border-r-[0.5px] border-t-[0.5px] bg-gray-50/80 dark:bg-gray-800/80 ">
          <TableRow className="!border-b-[0.5px]">
            <TableHead className="border-r-[0.5px] px-4 text-xs font-light text-gray-900 dark:text-gray-100">
              <Component className="float-left mr-2 mt-0.5 h-3 w-3 stroke-2 opacity-80" />
              Name
            </TableHead>
            <TableHead className="border-r-[0.5px] px-4 text-xs font-light text-gray-900 dark:text-gray-100">
              <File className="float-left mr-2 mt-0.5 h-3 w-3 stroke-2 opacity-80" />
              Type
            </TableHead>
            <TableHead className="border-r-[0.5px] px-4 text-xs font-light text-gray-900 dark:text-gray-100">
              <MoveHorizontal className="float-left mr-2 mt-0.5 h-3 w-3 stroke-2 opacity-80" />
              Size
            </TableHead>
            <TableHead className="border-r-[0.5px] px-4 text-xs font-light text-gray-900 dark:text-gray-100">
              <Text className="float-left mr-2 mt-0.5 h-3 w-3 stroke-2 opacity-80" />
              Description
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRows rows={fields} openSheet={openSheet} />
        </TableBody>
      </Table>
    </>
  );
};

export const getVariantForType = (type: string) => {
  switch (type.toLowerCase()) {
    case 'text':
      return 'green';
    case 'image':
      return 'info';
    case 'video_file':
    case 'video_embed':
      return 'warning';
    default:
      return 'default';
  }
};

const TableRows: React.FC<{ rows: SlotMetadata[]; openSheet: (SlotMetadata) => void; hasParent?: boolean | undefined }> = ({
  rows,
  openSheet,
  hasParent,
}) => {
  return (
    <>
      {rows.map((row, i) => {
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

const humanReadableSizeRule = (rule: string, value: any) => {
  switch (rule) {
    case 'required':
      return value ? 'Required' : 'Optional';
    case 'content':
      return `${value.min || '-'} - ${value.max || '-'} characters`;
    case 'dimensions':
      if (!value || !value.min || !value.max) {
        return 'Not specified.';
      }
      return `${value.min.width}x${value.min.height} - ${value.max.width}x${value.max.height}`;
    case 'maxSize':
      if (value < 1024) {
        return `${value} bytes`;
      }
      if (value < 1024 * 1024) {
        return `${Math.floor(value / 1024)} KB`;
      }
      return `${Math.floor(value / (1024 * 1024))} MB`;
    default:
      return '-';
  }
};

const TableRowInstance: React.FC<{ row: SlotMetadata; openSheet: (SlotMetadata) => void; hasParent?: boolean | undefined }> = ({
  row,
  openSheet,
  hasParent,
}) => {
  const getSizeDisplay = (row: SlotMetadata) => {
    if (!row.rules) return '-';

    // Find the first applicable size rule
    const sizeRules = ['dimensions', 'content', 'maxSize'];
    const rule = Object.keys(row.rules).find((r) => sizeRules.includes(r));

    return rule ? humanReadableSizeRule(rule, row.rules[rule]) : '-';
  };

  return (
    <TableRow className="h-10 cursor-pointer border-b-[0.5px]" onClick={() => openSheet(row)}>
      <TableCell className="whitespace-nowrap border-l-[0.5px] border-r-[0.5px] px-4 py-1">{startCase(row.name)}</TableCell>
      <TableCell className="border-r-[0.5px] px-3.5 py-1">
        <Badge variant={getVariantForType(row.type)} className="rounded-xl px-2.5">
          {row.type}
        </Badge>
      </TableCell>
      <TableCell className="whitespace-nowrap border-l-[0.5px] border-r-[0.5px] px-4 py-1 text-gray-600 dark:text-gray-300">
        {getSizeDisplay(row)}
      </TableCell>
      <TableCell className="border-r-[0.5px] px-4 py-1 text-gray-600 dark:text-gray-300">
        <span className="slot-description line-clamp-1">{row.description}</span>
      </TableCell>
    </TableRow>
  );
};
