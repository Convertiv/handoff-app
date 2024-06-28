import React from 'react';
import { CodeHighlight } from './Markdown/CodeHighlight';
import { PreviewObject } from '../../types';
import { ComponentInstance } from '../../exporters/components/types';
import { startCase } from 'lodash';

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

export const OverviewComponentPreview: React.FC<{ components: ComponentPreviews }> = ({ components }) => {
  return (
    <>
      {components.map((previewableComponent) => {
        const component = previewableComponent.component;
        return (
          <div key={`${component.id}`} id={component.id}>
            <h4>{getComponentPreviewTitle(previewableComponent)}</h4>
            <p>{component.description}</p>
            <div className="c-component-preview">
              <ComponentDisplay component={previewableComponent.preview} />
            </div>
            <CodeHighlight data={previewableComponent.preview} />
            <hr />
          </div>
        );
      })}
    </>
  );
};

export const ComponentDisplay: React.FC<{ component: PreviewObject | undefined }> = ({ component }) => {
  const ref = React.useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = React.useState('0px');
  const onLoad = () => {
    if (ref.current) {
      setHeight(ref.current.contentWindow.document.body.scrollHeight + 'px');
    }
  };
  React.useEffect(() => {
    onLoad();
  }, []);
  return (
    <iframe
      onLoad={onLoad}
      ref={ref}
      height={height}
      style={{
        width: '1px',
        minWidth: '100%',
        height: height,
      }}
      srcDoc={component?.preview}
    />
  );
};

export const CustomComponentPreview: React.FC<{ preview: PreviewObject; code: string; title: string; children: React.ReactNode }> = ({
  preview,
  title,
  children,
}) => {
  return (
    <div id={preview.id}>
      <h4>{title}</h4>
      {children}
      <div className="c-component-preview">
        <ComponentDisplay component={preview} />
      </div>
      <CodeHighlight data={preview} collapsible={true} />
      <hr />
    </div>
  );
};
