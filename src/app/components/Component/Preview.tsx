import React, { useCallback, useContext } from 'react';
import { CodeHighlight } from '../Markdown/CodeHighlight';

import { ComponentInstance } from '@handoff/exporters/components/types';
import { set, startCase } from 'lodash';
import { PreviewObject } from '@handoff/types';
import { Breakpoints } from '@handoff/types/config';
import { usePreviewContext } from '../context/PreviewContext';
import { SlotMetadata } from '../../../transformers/preview/component';

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
            <ul className="hidden rounded-lg text-center text-sm font-medium text-gray-500 shadow dark:divide-gray-700 dark:text-gray-400 sm:flex">
              {Object.keys(component.previews).map((key) => (
                <li key={key} className="w-full focus-within:z-10">
                  <button
                    className="active inline-block w-full rounded-s-lg border-r border-gray-200 bg-gray-100 p-4 text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                    onClick={() => setPreviewUrl(`/api/component/` + component.previews[key].url)}
                  >
                    {component.previews[key].title}
                  </button>
                </li>
              ))}
            </ul>

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
              <a
                href="#"
                aria-current="page"
                className="active inline-flex w-full items-center rounded-lg bg-blue-700 px-4 py-3 text-white dark:bg-blue-600"
              >
                {breakpoints[key].name}
              </a>
            </li>
          ))}
        <li
          onClick={() => {
            setBreakpoint('full');
            setWidth(`100%`);
          }}
        >
          <a
            href="#"
            aria-current="page"
            className="active inline-flex w-full items-center rounded-lg bg-blue-700 px-4 py-3 text-white dark:bg-blue-600"
          >
            Full
          </a>
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
