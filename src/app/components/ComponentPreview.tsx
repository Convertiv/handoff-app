import React from 'react';
import { CodeHighlight } from './Markdown/CodeHighlight';

import { ComponentInstance } from '@handoff/exporters/components/types';
import { set, startCase } from 'lodash';
import { PreviewObject } from '@handoff/types';
import { Breakpoints } from '@handoff/types/config';

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

export const OverviewComponentPreview: React.FC<{ components: ComponentPreviews; breakpoints?: Breakpoints }> = ({ components, breakpoints }) => {
  return (
    <>
      {components.map((previewableComponent) => {
        const component = previewableComponent.component;
        return (
          <div key={`${component.id}`} id={component.id}>
            <h4>{getComponentPreviewTitle(previewableComponent)}</h4>
            <p>{component.description}</p>
            <div className="c-component-preview">
              <ComponentDisplay component={previewableComponent.preview} breakpoints={breakpoints}/>
            </div>
            <CodeHighlight data={previewableComponent.preview} />
            <hr />
          </div>
        );
      })}
    </>
  );
};

export const ComponentDisplay: React.FC<{ component: PreviewObject | undefined; breakpoints?: Breakpoints }> = ({
  component,
  breakpoints,
}) => {
  const ref = React.useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = React.useState('100px');
  const [width, setWidth] = React.useState('100%');
  const [breakpoint, setBreakpoint] = React.useState(breakpoints ? Object.keys(breakpoints)[0] : '');
  const sortedBreakpoints = breakpoints ? Object.keys(breakpoints).sort((a, b) => breakpoints[b].size - breakpoints[a].size) : [];
  const onLoad = () => {
    if (ref.current) {
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
  };
  React.useEffect(() => {
    onLoad();
    window.addEventListener('resize', onLoad);
    return () => {
      window.removeEventListener('resize', onLoad);
    };
  }, [onLoad]);
  return (
    <>
      <div className="breakpoint-width">
        {breakpoints && Object.keys(breakpoints).map((key) => (
          <div
            key={key}
            className={['breakpoint-width__item', key === breakpoint ? 'active' : ''].join(' ')}
            onClick={() => {
              setBreakpoint(key);
              setWidth(`${breakpoints[key].size}px`);
            }}
          >
            {key}
            <div className="breakpoint-width__item__label">
              <span>{breakpoints[key].name}</span> - &nbsp;
              <span>{breakpoints[key].size}px</span>
            </div>
          </div>
        ))}
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
        srcDoc={component?.preview}
      />
    </>
  );
};

export const CustomComponentPreview: React.FC<{ preview: PreviewObject; code: string; title: string; children: React.ReactNode; breakpoints?: Breakpoints }> = ({
  preview,
  title,
  children,
  breakpoints
}) => {
  return (
    <div id={preview.id}>
      <h4>{title}</h4>
      {children}
      <div className="c-component-preview">
        <ComponentDisplay component={preview} breakpoints={breakpoints} />
      </div>
      <CodeHighlight data={preview} collapsible={true} />
      <hr />
    </div>
  );
};
