'use client';

import { Pencil, Plus } from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { followWithDepth } from '../../lib/depth-transition';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { customPreviewEditorRoute, type CustomPreview } from './api';
import { canEditCustomPreview, useRegistryViewer } from './useRegistryViewer';

export const CustomPreviewAction: React.FC<{
  componentId: string;
  builtPreviewKey: string | null;
  customPreview: CustomPreview | null;
  supported: boolean;
}> = ({ componentId, builtPreviewKey, customPreview, supported }) => {
  const viewer = useRegistryViewer();
  if (!viewer) return null;

  if (customPreview) {
    if (!canEditCustomPreview(viewer, customPreview.createdBy)) return null;
    return (
      <Button asChild variant="ghost" className="h-8 gap-1.5 px-2.5 text-xs [&_svg]:size-3">
        <Link href={customPreviewEditorRoute(componentId, customPreview.id)} onClick={followWithDepth}>
          <Pencil /> Edit
        </Link>
      </Button>
    );
  }

  if (!supported) {
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            {/* A disabled button gets no pointer events, so the span carries the tooltip. */}
            <span tabIndex={0}>
              <Button variant="ghost" disabled className="h-8 gap-1.5 px-2.5 text-xs [&_svg]:size-3">
                <Plus /> Create
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent className="rounded-sm px-2 py-1 text-[11px]">Republish this component to enable custom previews.</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button asChild variant="ghost" className="h-8 gap-1.5 px-2.5 text-xs [&_svg]:size-3">
      <Link href={customPreviewEditorRoute(componentId, null, builtPreviewKey ?? undefined)} onClick={followWithDepth}>
        <Plus /> Create
      </Link>
    </Button>
  );
};
