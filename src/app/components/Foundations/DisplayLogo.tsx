import React from 'react';
import type { DisplayableAsset } from '../util/useCollectionAssets';

export const DisplayLogo: React.FC<{ logo: DisplayableAsset; content?: string; correct?: boolean }> = ({ logo, content }) => {
  // Registry serves the individual asset content URL; workspace/static serves the mirrored file.
  const src = logo.src ?? `${process.env.HANDOFF_APP_BASE_PATH ?? ''}/api/assets/logos/${logo.path}`;
  return (
    <div className="flex flex-col gap-5">
      <img src={src} alt="Usage Cards" className="rounded-3xl" />
      <div className="flex flex-row gap-4">
        <img src={`${process.env.HANDOFF_APP_BASE_PATH ?? ''}/assets/images/check-circle.svg`} alt="Do" className="h-6 w-6" />
        <p className="leading-normal text-gray-500">
          {content} {logo.description}.
        </p>
      </div>
    </div>
  );
};
