import React from "react";
import { PreviewObject } from "../../types.js";

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
