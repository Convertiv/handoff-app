import { Types as CoreTypes } from 'handoff-core';
import React from 'react';

import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '../ui/breadcrumb';

type ColorInfoProps = {
  color: CoreTypes.IColorObject;
};

const ColorInfo: React.FC<ColorInfoProps> = ({ color }) => {
  if (!color) {
    return null;
  }

  return (
    <>
      <div className="relative mb-3 block h-32 w-full rounded-md" style={{ background: color.value }}>
        <div className="absolute bottom-0 left-0 flex flex-col px-4 py-4">
          <p className="font-medium text-white text-shadow-xs">{color.name}</p>
          <p className="font-mono text-xs text-white text-shadow-xs">{color.value}</p>
        </div>
      </div>
      <p className="leading-relaxed text-sm text-gray-500">
        Color description coming from Figma variable or style description. Usually usage guideline like &quot;Use for background&quot; or &quot;Use for
        text&quot;.
      </p>
      <div className="mt-2 flex items-center gap-2">
        <svg className="h-2.5 w-2.5 text-slate-700" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <title>Figma</title>
          <path d="M15.852 8.981h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.491-4.49 4.491zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019h-3.117V7.51zm0 1.471H8.148c-2.476 0-4.49-2.014-4.49-4.49S5.672 0 8.148 0h4.588v8.981zm-4.587-7.51c-1.665 0-3.019 1.355-3.019 3.019s1.354 3.02 3.019 3.02h3.117V1.471H8.148zm4.587 15.019H8.148c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v8.98zM8.148 8.981c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h3.117V8.981H8.148zM8.172 24c-2.489 0-4.515-2.014-4.515-4.49s2.014-4.49 4.49-4.49h4.588v4.441c0 2.503-2.047 4.539-4.563 4.539zm-.024-7.51a3.023 3.023 0 0 0-3.019 3.019c0 1.665 1.365 3.019 3.044 3.019 1.705 0 3.093-1.376 3.093-3.068v-2.97H8.148zm7.704 0h-.098c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h.098c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.49-4.49 4.49zm-.097-7.509c-1.665 0-3.019 1.355-3.019 3.019s1.355 3.019 3.019 3.019h.098c1.665 0 3.019-1.355 3.019-3.019s-1.355-3.019-3.019-3.019h-.098z" />
        </svg>
        {color.groups && (
          <Breadcrumb>
            <BreadcrumbList className="text-xs text-gray-500">
              {color.groups.map((group, index) => (
                <BreadcrumbItem key={group}>
                  <BreadcrumbPage className="text-gray-500">{group}</BreadcrumbPage>
                  {color.groups.length - 1 !== index && <BreadcrumbSeparator>/</BreadcrumbSeparator>}
                </BreadcrumbItem>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}
      </div>
    </>
  );
};

export default ColorInfo;

