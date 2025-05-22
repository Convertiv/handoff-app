import { Types as CoreTypes } from 'handoff-core';
import React from 'react';

export const DisplayLogo: React.FC<{ logo: CoreTypes.IAssetObject; content?: string; correct?: boolean }> = ({ logo, content }) => {
  return (
    <div className="flex flex-col gap-5">
      <img src={`${process.env.HANDOFF_APP_BASE_PATH ?? ''}/api/assets/logos/${logo.path}`} alt="Usage Cards" className="rounded-3xl" />
      <div className="flex flex-row gap-4">
        <img src={`${process.env.HANDOFF_APP_BASE_PATH ?? ''}/assets/images/check-circle.svg`} alt="Do" className="h-6 w-6" />
        <p className="leading-normal text-gray-500">
          {content} {logo.description}.
        </p>
      </div>
    </div>
  );
};
