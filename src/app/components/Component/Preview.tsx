import React, { useCallback, useContext } from 'react';
import { CodeHighlight } from '../Markdown/CodeHighlight';

import { ComponentInstance } from '@handoff/exporters/components/types';
import { set, startCase } from 'lodash';
import { PreviewObject } from '@handoff/types';
import { Breakpoints } from '@handoff/types/config';
import { usePreviewContext } from '../context/PreviewContext';
import { SlotMetadata } from '../../../transformers/preview/component';
import { Button } from '../ui/button';
import { RadioGroup, RadioGroupItem } from '@radix-ui/react-radio-group';

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
  const ref = React.useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = React.useState('500px');
  const [previewUrl, setPreviewUrl] = React.useState('');
  const [width, setWidth] = React.useState('100%');
  const [breakpoint, setBreakpoint] = React.useState(breakpoints ? Object.keys(breakpoints)[0] : '');
  const sortedBreakpoints = breakpoints ? Object.keys(breakpoints).sort((a, b) => breakpoints[b].size - breakpoints[a].size) : [];

  const onLoad = useCallback(() => {
    if (defaultHeight) {
      setHeight(defaultHeight);
    } else if (ref.current) {
      if (ref.current.contentWindow.document.body) {
        setHeight(ref.current.contentWindow.document.body.scrollHeight + 'px');
      }
      if (window.document.body.clientWidth) {
        sortedBreakpoints.some((key, index) => {
          if (window.document.body.clientWidth > breakpoints[key].size) {
            setBreakpoint(key);
            return true;
          }
        });
      }
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
            <div className="flex justify-end">
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
      <ul className="flex-column space-y mb-4 space-y-4 text-sm font-medium text-gray-500 dark:text-gray-400 md:mb-0 md:me-4">
        {breakpoints &&
          Object.keys(breakpoints).map((key) => (
            <li
              key={key}
              onClick={() => {
                setBreakpoint(key);
                setWidth(`${breakpoints[key].size}px`);
              }}
            >
              <Button variant="outline">{breakpoints[key].name}</Button>
            </li>
          ))}
        <li
          onClick={() => {
            setBreakpoint('full');
            setWidth(`100%`);
          }}
        >
          <Button variant="outline">Full</Button>
        </li>
      </ul>
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
        <CodeHighlight data={preview} collapsible={true} />
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
  const humanReadableRule = (rule: string, value: any) => {
    switch (rule) {
      case 'required':
        return value ? 'Required' : 'Optional';
      case 'content':
        let type = 'characters';
        if (value.type) {
          type = value.type;
        }
        return `Contents should at least ${value.min} and at most ${value.max} ${type} long`;
      case 'minValue':
        return 'This field must be at least ' + value;
      case 'maxValue':
        return 'This field must be at most ' + value;
      case 'pattern':
        return 'This field must match the pattern ' + value;
      case 'dimensions':
        return `Use a minimum size of ${value.minW}x${value.minHeight} and a maximum size of ${value.maxWidth}x${value.maxHeight}`;
      case 'maxSize':
        // translate to human readable byte size
        if (value < 1024) {
          return `This field must be at most ${value} bytes`;
        }
        if (value < 1024 * 1024) {
          return `This field must be at most ${Math.floor(value / 1024)} KB`;
        }
        return `This field must be at most ${Math.floor(value / (1024 * 1024))} MB`;
      case 'enum':
        return 'Enumeration';
      default:
        return rule;
    }
  };
  return (
    <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400 rtl:text-right">
      <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
        <tr>
          <th>id</th>
          <th>Field</th>
          <th>Type</th>
          <th>Example</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {fields.map((field) => {
          return (
            <tr key={field.key}>
              <td>{field.key}</td>
              <td>{startCase(field.name)}</td>
              <td>{field.type}</td>
              <td>
                <span className="slot-description">{field.description}</span>
                <ul className="c-component-preview__slot__content__example">
                  {field.rules &&
                    Object.keys(field.rules).map((rule) => (
                      <li key={field.key + rule} className="c-component-preview__slot__content__example__label">
                        {humanReadableRule(rule, field.rules[rule])}
                      </li>
                    ))}
                </ul>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
