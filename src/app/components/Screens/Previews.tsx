'use client';

import { buildArtifactUrl } from '@handoff/artifacts/url';
import { contractFields, assessArgs } from '@handoff/custom-previews';
import { CUSTOM_PREVIEW_FRAME_SANDBOX } from '@handoff/custom-previews/sandbox';
import type { ArgsFormProps, ComponentPreviewProps, CustomPreviewProps, ViewportToggleProps } from '@handoff/screens/client-api';
import { Component as ComponentIcon } from 'lucide-react';
import * as React from 'react';
import { useComponentArtifact } from '../../lib/screens/client/docs';
import { cn } from '../../lib/utils';
import { ArgsForm as ContractArgsForm } from '../CustomPreview/ArgsForm';
import { customPreviewRenderUrl, customPreviewsEnabled } from '../CustomPreview/api';
import { SegmentedControl } from './primitives';

const THUMBNAIL_SCALE = 0.25;

/**
 * A component's built preview document. The docs pages show the same documents, so it loads
 * same-origin here too. Only reader-supplied args need the sandboxed canvas.
 */
export const ComponentPreview: React.FC<ComponentPreviewProps> = ({ id, previewKey, thumbnail, className }) => {
  const artifact = useComponentArtifact(id);
  const previews = Object.entries(artifact.data?.previews ?? {}).filter(([, preview]) => preview.url);
  const preview = (previews.find(([key]) => key === previewKey) ?? previews[0])?.[1];
  const src = preview?.url ? buildArtifactUrl(`component/${preview.url}`, process.env.HANDOFF_APP_BASE_PATH ?? '') : null;
  const title = `${artifact.data?.title ?? id} preview`;

  if (!src) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-md border bg-muted/40 text-muted-foreground',
          thumbnail ? 'h-28' : 'h-48',
          className
        )}
        aria-label={artifact.status === 'loading' ? 'Loading the preview' : 'No preview'}
      >
        <ComponentIcon className={cn('h-5 w-5', artifact.status === 'loading' && 'animate-pulse')} />
      </div>
    );
  }

  if (thumbnail) {
    return (
      <div className={cn('relative h-28 overflow-hidden rounded-md border bg-background', className)} aria-hidden>
        <iframe
          src={src}
          title={title}
          loading="lazy"
          tabIndex={-1}
          className="pointer-events-none absolute top-0 left-0 origin-top-left border-0"
          style={{ width: `${100 / THUMBNAIL_SCALE}%`, height: `${100 / THUMBNAIL_SCALE}%`, transform: `scale(${THUMBNAIL_SCALE})` }}
        />
      </div>
    );
  }

  return <iframe src={src} title={title} loading="lazy" className={cn('block h-64 w-full rounded-md border bg-background', className)} />;
};

/** A saved custom preview, rendered by its sandboxed render route. Registry only. */
export const CustomPreview: React.FC<CustomPreviewProps> = ({ componentId, id, className }) => {
  const frameRef = React.useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = React.useState<number | null>(null);

  React.useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      if (event.data?.type === 'handoff:resize' && typeof event.data.height === 'number') setHeight(Math.min(event.data.height, 2000));
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  if (!customPreviewsEnabled()) {
    return (
      <div className={cn('rounded-md border border-dashed p-4 text-center text-[13px] text-muted-foreground', className)}>
        Custom previews are saved in a registry.
      </div>
    );
  }
  return (
    <iframe
      ref={frameRef}
      src={customPreviewRenderUrl(componentId, id)}
      sandbox={CUSTOM_PREVIEW_FRAME_SANDBOX}
      title="Custom preview"
      className={cn('block w-full rounded-md border bg-background', className)}
      style={{ height: height ?? 160 }}
    />
  );
};

/** A form for args, built from a component's contract. Issues show under their fields. */
export const ArgsForm: React.FC<ArgsFormProps> = ({ contract, value, onChange, fields: shown, disabled }) => {
  const shownKey = shown?.join('\n');
  const fields = React.useMemo(() => {
    const all = contract ?? {};
    const names = shownKey === undefined ? null : shownKey.split('\n').filter((name) => name in all);
    return contractFields(names ? Object.fromEntries(names.map((name) => [name, all[name]])) : all);
  }, [contract, shownKey]);
  const issues = React.useMemo(() => assessArgs(contract, value ?? {}).issues, [contract, value]);
  if (fields.length === 0) return <p className="px-1 py-2 text-[13px] text-muted-foreground">This component declares no properties.</p>;
  return (
    // The form pads itself for the docs editor; a panel already pads its body.
    <div className="-mx-3 -my-2 [&>div]:px-3">
      <ContractArgsForm fields={fields} args={value ?? {}} onChange={onChange} issues={issues} disabled={Boolean(disabled)} />
    </div>
  );
};

export const ViewportToggle: React.FC<ViewportToggleProps> = ({ value, onChange, zoom, onZoomChange, zoomLevels = [1, 0.7] }) => (
  <div className="flex shrink-0 items-center gap-1.5">
    <SegmentedControl
      value={value}
      onChange={onChange}
      options={[
        { value: 'desktop', label: 'Desktop', icon: 'monitor' },
        { value: 'mobile', label: 'Mobile', icon: 'smartphone' },
      ]}
    />
    {onZoomChange && (
      <SegmentedControl
        value={String(zoom ?? 1)}
        onChange={(next) => onZoomChange(Number(next))}
        options={zoomLevels.map((level) => ({
          value: String(level),
          label: `${Math.round(level * 100)}%`,
          title: `Zoom to ${Math.round(level * 100)}%`,
        }))}
      />
    )}
  </div>
);
