import React from 'react';
import type { DisplayableAsset } from '../util/useCollectionAssets';

export const DisplayLogo: React.FC<{ logo: DisplayableAsset; content?: string; correct?: boolean }> = ({ logo, content }) => {
  // Workspace/static ships the SVG body inline in tokens.json (`data`), so render it directly and
  // avoid depending on the fetch-only `/api/assets/logos/*` files that a static host won't have.
  // Registry has no inline body, so it falls back to the individual asset content URL (`src`).
  const src = logo.src ?? `${process.env.HANDOFF_APP_BASE_PATH ?? ''}/api/assets/logos/${logo.path}`;
  return (
    <div className="flex flex-col gap-5">
      {logo.data ? (
        <div className="rounded-3xl" dangerouslySetInnerHTML={{ __html: logo.data }} />
      ) : (
        <img src={src} alt={logo.name} className="rounded-3xl" />
      )}
      <div className="flex flex-row gap-4">
        <img src={`${process.env.HANDOFF_APP_BASE_PATH ?? ''}/assets/images/check-circle.svg`} alt="Do" className="h-6 w-6" />
        <p className="leading-normal text-gray-500">
          {content} {logo.description}.
        </p>
      </div>
    </div>
  );
};
