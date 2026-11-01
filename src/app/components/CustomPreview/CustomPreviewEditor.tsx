'use client';

import { buildArtifactUrl } from '@handoff/artifacts/url';
import { assessArgs, type ComponentContract, type CustomPreviewIssue } from '@handoff/custom-previews';
import type { PreviewObject } from '@handoff/types/preview';
import { AlertCircle, ArrowLeft, Braces, CircleCheck, Loader2, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import * as React from 'react';

import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Button } from '../ui/button';
import { followWithDepth, guardPopState, markViewReady, navigateWithDepth, PREVIEW_STAGE_TRANSITION } from '../../lib/depth-transition';
import { PreviewStage } from '../Component/PreviewStage';
import HeadersType from '../Typography/Headers';
import { ConfirmDialog } from '../ui/confirm-dialog';
import {
  componentRoute,
  customPreviewEditorRoute,
  customPreviewUrl,
  deleteCustomPreview,
  readError,
  saveCustomPreview,
  type CustomPreview,
} from './api';
import { EditableTitle } from './EditableTitle';
import { onCustomPreviewChange, setCustomPreviewDraft } from './events';
import { JsonEditor } from './JsonEditor';
import { canEditCustomPreview, useRegistryViewer } from './useRegistryViewer';

const RENDER_DELAY_MS = 250;

type Stored = { title: string; argsText: string };

const formatArgs = (args: unknown): string => JSON.stringify(args ?? {}, null, 2);

const parseArgsText = (text: string): { args: Record<string, unknown> } | { error: string } => {
  try {
    const value = JSON.parse(text);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return { error: 'Args must be a JSON object.' };
    return { args: value };
  } catch (error) {
    return { error: (error as Error).message };
  }
};

type ArgsState = { kind: 'invalid'; error: string } | { kind: 'issues'; issues: CustomPreviewIssue[] } | { kind: 'ok' };

const STATUS_STYLES = {
  invalid: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-950/40 dark:text-red-300',
  issues: 'bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-300',
  ok: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-300',
} as const;

const ArgsStatus: React.FC<{ state: ArgsState }> = ({ state }) => {
  const label =
    state.kind === 'invalid'
      ? 'Invalid JSON'
      : state.kind === 'issues'
        ? `${state.issues.length} ${state.issues.length === 1 ? 'issue' : 'issues'}`
        : 'Matches contract';
  const Icon = state.kind === 'ok' ? CircleCheck : AlertCircle;
  const isOk = state.kind === 'ok';
  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={isOk ? label : undefined}
      title={isOk ? label : undefined}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${STATUS_STYLES[state.kind]}`}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {isOk ? 'OK' : label}
    </span>
  );
};

const ArgsFooter: React.FC<{ state: ArgsState; contractChanged: boolean }> = ({ state, contractChanged }) => {
  if (state.kind === 'ok' && !contractChanged) return null;
  // `text-inherit` overrides the docs theme's gray `p` and `li` colors.
  const tone =
    state.kind === 'invalid'
      ? 'border-red-200 bg-red-50 text-red-700'
      : state.kind === 'issues'
        ? 'border-amber-200 bg-amber-50 text-amber-800'
        : 'border-gray-200 bg-gray-50 text-gray-600';
  return (
    <div className={`space-y-1 border-t px-4 py-2.5 text-xs ${tone}`}>
      {state.kind === 'invalid' && <p className="font-mono text-inherit">{state.error}</p>}
      {state.kind === 'issues' && (
        <ul className="space-y-1">
          {state.issues.map((issue, index) => (
            <li key={`${issue.path}-${index}`} className="flex items-start gap-1.5 text-inherit">
              <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
              <span>{issue.message}</span>
            </li>
          ))}
        </ul>
      )}
      {contractChanged && (
        <p className={state.kind === 'ok' ? 'text-inherit' : 'text-gray-600'}>
          The component changed since these args were saved.{state.kind === 'ok' ? ' They still match it.' : ''}
        </p>
      )}
    </div>
  );
};

export const CustomPreviewEditor: React.FC<{ componentId: string; componentTitle: string; customPreviewId: string | null }> = ({
  componentId,
  componentTitle,
  customPreviewId,
}) => {
  const router = useRouter();
  const viewer = useRegistryViewer();
  const frameRef = React.useRef<HTMLIFrameElement | null>(null);
  const frameReady = React.useRef(false);
  const navigatingAway = React.useRef(false);

  const [component, setComponent] = React.useState<PreviewObject | null>(null);
  const [record, setRecord] = React.useState<CustomPreview | null>(null);
  const [stored, setStored] = React.useState<Stored | null>(null);
  const [title, setTitle] = React.useState('');
  const [argsText, setArgsText] = React.useState('{}');
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [renderError, setRenderError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [changedElsewhere, setChangedElsewhere] = React.useState(false);

  const from = typeof router.query.from === 'string' ? router.query.from : undefined;
  const parsed = parseArgsText(argsText);
  const args = 'args' in parsed ? parsed.args : null;
  const contract = (component?.properties ?? {}) as ComponentContract;
  const assessment = args ? assessArgs(contract, args) : null;
  const issues = assessment?.issues ?? [];
  const argsState: ArgsState =
    'error' in parsed ? { kind: 'invalid', error: parsed.error } : issues.length ? { kind: 'issues', issues } : { kind: 'ok' };
  const renderPath = component?.customPreview?.renderUrl;
  const dirty = stored !== null && (stored.title !== title || stored.argsText !== argsText);
  const canEdit = customPreviewId === null ? Boolean(viewer) : canEditCustomPreview(viewer, record?.createdBy ?? null);

  // The frame renders what the saved preview renders: the args plus defaults for missing required props.
  const renderKey = assessment ? JSON.stringify(assessment.renderArgs) : null;
  const renderKeyRef = React.useRef(renderKey);
  renderKeyRef.current = renderKey;
  const dirtyRef = React.useRef(dirty);
  dirtyRef.current = dirty;

  const showStored = React.useCallback((next: Stored) => {
    setStored(next);
    setTitle(next.title);
    setArgsText(next.argsText);
  }, []);

  const loadRecord = React.useCallback(async () => {
    if (!customPreviewId) return;
    const response = await fetch(customPreviewUrl(componentId, customPreviewId), { cache: 'no-store' });
    if (!response.ok) throw new Error(await readError(response, 'This custom preview could not be loaded.'));
    const body = (await response.json()) as { customPreview: CustomPreview };
    setRecord(body.customPreview);
    showStored({ title: body.customPreview.title, argsText: formatArgs(body.customPreview.args) });
    setChangedElsewhere(false);
  }, [componentId, customPreviewId, showStored]);

  React.useEffect(() => {
    if (!router.isReady) return;
    let cancelled = false;
    (async () => {
      const response = await fetch(buildArtifactUrl(`component/${componentId}.json`, process.env.HANDOFF_APP_BASE_PATH ?? ''));
      if (!response.ok) throw new Error('This component has no published build.');
      const data = (await response.json()) as PreviewObject;
      if (cancelled) return;
      setComponent(data);
      if (customPreviewId) {
        await loadRecord();
      } else {
        const start = from ? data.previews?.[from] : undefined;
        showStored({ title: start ? `${start.title} (custom)` : `${componentTitle} (custom)`, argsText: formatArgs(start?.values ?? {}) });
      }
    })().catch((error: Error) => !cancelled && setLoadError(error.message));
    return () => {
      cancelled = true;
    };
  }, [componentId, componentTitle, customPreviewId, from, router.isReady, loadRecord, showStored]);

  const postArgs = React.useCallback((next: Record<string, unknown>) => {
    if (!frameReady.current) return;
    // The sandboxed shell has an opaque origin, which only the target origin '*' matches.
    frameRef.current?.contentWindow?.postMessage({ type: 'handoff:render', args: next }, '*');
  }, []);

  const argsKey = args ? JSON.stringify(args) : null;
  React.useEffect(() => {
    if (!renderKey) return;
    const timer = window.setTimeout(() => postArgs(JSON.parse(renderKey)), RENDER_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [renderKey, postArgs]);

  // The shell's origin is 'null', so `event.source` identifies it. Its messages are trusted only as display text.
  React.useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      if (event.data?.type === 'handoff:ready') {
        frameReady.current = true;
        setRenderError(null);
        if (renderKeyRef.current) postArgs(JSON.parse(renderKeyRef.current));
      } else if (event.data?.type === 'handoff:render-error') {
        setRenderError(typeof event.data.message === 'string' ? event.data.message : 'The component could not render.');
      } else if (event.data?.type === 'handoff:rendered') {
        setRenderError(null);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [postArgs]);

  const loaded = Boolean(component && stored);
  React.useEffect(() => {
    if (loaded) markViewReady();
  }, [loaded]);

  React.useEffect(() => {
    setCustomPreviewDraft(args);
  }, [argsKey]); // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => () => setCustomPreviewDraft(null), []);

  React.useEffect(
    () =>
      onCustomPreviewChange((change) => {
        if (change.componentId !== componentId) return;
        if (!customPreviewId && change.action === 'created') {
          navigatingAway.current = true;
          void router.push(customPreviewEditorRoute(componentId, change.id));
          return;
        }
        if (change.id !== customPreviewId) return;
        if (change.action === 'deleted') {
          navigatingAway.current = true;
          navigateWithDepth(componentRoute(componentId));
        } else if (dirtyRef.current) {
          setChangedElsewhere(true);
        } else {
          void loadRecord().catch((error: Error) => setLoadError(error.message));
        }
      }),
    [componentId, customPreviewId, loadRecord, router]
  );

  React.useEffect(() => {
    if (!dirty || saving) return;
    const confirmLeave = () => navigatingAway.current || window.confirm('Leave without saving this custom preview?');
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!navigatingAway.current) event.preventDefault();
    };
    // A capture listener runs before React, so a kept page never starts navigating. Link does not handle a `routeChangeStart` throw.
    const onLinkClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!anchor || anchor.target || anchor.hasAttribute('download')) return;
      const target = new URL(anchor.href, window.location.href);
      const samePage = target.pathname + target.search === window.location.pathname + window.location.search;
      if (target.origin !== window.location.origin || samePage) return;
      if (confirmLeave()) {
        navigatingAway.current = true;
        return;
      }
      event.preventDefault();
      event.stopPropagation();
    };
    const onRouteChange = (url: string, { shallow }: { shallow: boolean }) => {
      if (confirmLeave()) return;
      router.events.emit('routeChangeError', Object.assign(new Error('Route change cancelled'), { cancelled: true }), url, { shallow });
      // Next has no cancel API; throwing is the documented way to abort a client-side navigation.
      throw 'Navigation cancelled to keep unsaved changes.';
    };
    // Back and forward move the URL before the guard runs, so staying pushes this entry back.
    const entry = { state: window.history.state, url: window.location.href };
    const unguard = guardPopState(() => {
      if (!confirmLeave()) {
        window.history.pushState(entry.state, '', entry.url);
        return false;
      }
      navigatingAway.current = true;
      return true;
    });
    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('click', onLinkClick, true);
    router.events.on('routeChangeStart', onRouteChange);
    return () => {
      unguard();
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('click', onLinkClick, true);
      router.events.off('routeChangeStart', onRouteChange);
    };
  }, [dirty, saving, router]);

  const save = async () => {
    if (!args) return;
    setSaving(true);
    setSaveError(null);
    try {
      const saved = await saveCustomPreview(
        customPreviewId,
        customPreviewId ? { title, args } : { componentId, title, args },
        'The custom preview could not be saved.'
      );
      showStored({ title: saved.title, argsText: formatArgs(saved.args) });
      setRecord(saved);
      setChangedElsewhere(false);
      if (!customPreviewId) {
        navigatingAway.current = true;
        await router.replace(customPreviewEditorRoute(componentId, saved.id));
      }
    } catch (error) {
      setSaveError((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const saveTitle = async (next: string) => {
    if (!customPreviewId) {
      setTitle(next);
      return;
    }
    const saved = await saveCustomPreview(customPreviewId, { title: next }, 'The title could not be saved.');
    setRecord(saved);
    setTitle(saved.title);
    setStored((current) => (current ? { ...current, title: saved.title } : current));
  };

  const remove = async () => {
    await deleteCustomPreview(customPreviewId!);
    navigatingAway.current = true;
    navigateWithDepth(componentRoute(componentId));
  };

  const backHref = `${componentRoute(componentId)}${
    customPreviewId ? `?preview=${encodeURIComponent(`custom:${customPreviewId}`)}` : from ? `?preview=${encodeURIComponent(from)}` : ''
  }`;

  const eyebrow = <small className="text-sm font-medium text-sky-600 dark:text-gray-300">{componentTitle} · Custom preview</small>;

  if (loadError || !component || !stored) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          {eyebrow}
          <HeadersType.H1>{customPreviewId ? 'Custom preview' : `New ${componentTitle} preview`}</HeadersType.H1>
        </div>
        {loadError ? (
          <Alert variant="destructive">
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground" aria-busy="true">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        {eyebrow}
        <EditableTitle title={title} placeholder="Untitled preview" maxLength={120} canEdit={canEdit} onSave={saveTitle} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 [&_svg]:size-3.5">
          <Link href={backHref} onClick={followWithDepth}>
            <ArrowLeft /> {componentTitle}
          </Link>
        </Button>
        <div className="ml-auto flex items-center gap-2">
          {customPreviewId && canEdit && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          )}
          {canEdit && (
            <Button size="sm" className="gap-1.5" disabled={!args || !title.trim() || saving || !renderPath || (!dirty && Boolean(customPreviewId))} onClick={() => void save()}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save
            </Button>
          )}
        </div>
      </div>

      {!viewer && <Alert><AlertDescription>Sign in to create custom previews.</AlertDescription></Alert>}
      {viewer && !canEdit && (
        <Alert>
          <AlertDescription>Only the author or an administrator can change this custom preview.</AlertDescription>
        </Alert>
      )}
      {!renderPath && (
        <Alert variant="destructive">
          <AlertDescription>This component was published without a client render shell. Republish it to enable custom previews.</AlertDescription>
        </Alert>
      )}
      {changedElsewhere && (
        <Alert>
          <AlertTitle>Updated by the assistant</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-2">
            This custom preview changed while you were editing it.
            <Button size="sm" variant="outline" onClick={() => void loadRecord()}>
              Load
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setChangedElsewhere(false)}>
              Keep mine
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {saveError && (
        <Alert variant="destructive">
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      <div className="min-w-0">
        <PreviewStage
          src={renderPath ? buildArtifactUrl(renderPath, process.env.HANDOFF_APP_BASE_PATH ?? '') : null}
          frameKey={renderPath ?? 'none'}
          frameRef={frameRef}
          sandboxed
          transitionName={PREVIEW_STAGE_TRANSITION}
          title={`${componentTitle}: ${title || 'custom preview'}`}
          leading={<p className="flex h-8 items-center font-mono text-[11px] text-accent-foreground">Live preview</p>}
          emptyMessage="This component cannot render custom previews."
        />
        {renderError && (
          <p className="mt-2 flex items-start gap-1.5 text-xs text-destructive">
            <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" /> {renderError}
          </p>
        )}
      </div>

      <div className="min-w-0">
        <div className="flex w-full items-center justify-between rounded-t-lg border border-gray-200 bg-gray-50 px-6 py-2 pr-3 dark:border-gray-900 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <label htmlFor="custom-preview-args" className="font-mono text-[11px] text-accent-foreground">
              Args (JSON)
            </label>
            <ArgsStatus state={argsState} />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs hover:bg-gray-300 [&_svg]:size-3"
            disabled={!args || !canEdit}
            onClick={() => args && setArgsText(formatArgs(args))}
          >
            <Braces /> Format
          </Button>
        </div>
        <JsonEditor
          id="custom-preview-args"
          value={argsText}
          readOnly={!canEdit}
          onChange={setArgsText}
          footer={<ArgsFooter state={argsState} contractChanged={Boolean(record?.contractChanged) && !dirty} />}
        />
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete custom preview?"
        description={`“${record?.title ?? title}” is removed for every reader.`}
        confirmLabel="Delete"
        pendingLabel="Deleting"
        variant="destructive"
        onConfirm={remove}
      />
    </div>
  );
};
