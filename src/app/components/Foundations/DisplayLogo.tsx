import { AssetObject } from '@handoff/api';
import React from 'react';

export const DisplayLogo: React.FC<{ logo: AssetObject; content?: string; correct?: boolean }> = ({ logo, content }) => {
  const htmlData = React.useMemo(() => {
    // For SSR
    if (typeof window === 'undefined') {
      return logo.data.replace('<svg', '<svg class="o-icon c-logo-preview"');
    }

    const element = document.createElement('div');
    element.innerHTML = logo.data;

    const svgElement = element.querySelector('svg');

    if (!svgElement) return '';

    svgElement.classList.add('o-icon', 'c-logo-preview');

    return svgElement.outerHTML;
  }, [logo.data]);

  return (
    <div className="flex flex-col gap-5">
      {logo.data}
      <img src={`${process.env.HANDOFF_APP_BASE_PATH ?? ''}/assets/images/usage-correct.png`} alt="Usage Cards" className="rounded-3xl" />
      <div className="flex flex-row gap-4">
        {}
        <img src={`${process.env.HANDOFF_APP_BASE_PATH ?? ''}/assets/images/check-circle.svg`} alt="Do" className="h-6 w-6" />
        <p className="leading-normal text-gray-500">
          {content} {logo.description}.
        </p>
      </div>
    </div>
  );
};
