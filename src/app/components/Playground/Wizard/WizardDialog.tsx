import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';
import { Alert, AlertDescription } from '../../ui/alert';
import { Badge } from '../../ui/badge';
import { AlertTriangleIcon, GlobeIcon, Loader2Icon, SparklesIcon, SettingsIcon, ArrowLeftIcon } from 'lucide-react';
import { usePlayground, BulkComponentEntry } from '../PlaygroundContext';
import { callLLM, getApiKey } from './llm-client';
import { buildSystemPrompt, buildUserPrompt } from './prompt-builder';
import { parseWizardResponse, enrichWithTitles, ProposedComponent } from './response-parser';
import ApiKeySettings from './ApiKeySettings';
import PageImporter from './PageImporter';

type WizardStep = 'settings' | 'describe' | 'loading' | 'review';

interface WizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function WizardDialog({ open, onOpenChange }: WizardDialogProps) {
  const { components, bulkAddComponents, selectedComponents } = usePlayground();

  const [step, setStep] = useState<WizardStep>(() => (getApiKey() ? 'describe' : 'settings'));
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [proposed, setProposed] = useState<Array<BulkComponentEntry & { title: string; description: string }>>([]);
  const [applying, setApplying] = useState(false);
  const [importerOpen, setImporterOpen] = useState(false);

  const reset = useCallback(() => {
    setStep(getApiKey() ? 'describe' : 'settings');
    setDescription('');
    setContent('');
    setError(null);
    setWarnings([]);
    setProposed([]);
    setApplying(false);
  }, []);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) reset();
      onOpenChange(next);
    },
    [onOpenChange, reset]
  );

  const handleGenerate = useCallback(async () => {
    if (!description.trim()) return;
    setError(null);
    setWarnings([]);
    setStep('loading');

    try {
      const systemPrompt = buildSystemPrompt(components, selectedComponents);
      const userPrompt = buildUserPrompt(description, content, selectedComponents);
      const response = await callLLM({ systemPrompt, userPrompt });
      const { entries, warnings: parseWarnings } = parseWizardResponse(response.content, components);

      if (entries.length === 0) {
        setError(parseWarnings.join(' ') || 'No valid components were generated. Try a different description.');
        setStep('describe');
        return;
      }

      setWarnings(parseWarnings);
      setProposed(enrichWithTitles(entries, components));
      setStep('review');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setStep('describe');
    }
  }, [description, content, components]);

  const handleApply = useCallback(
    async (replace: boolean) => {
      setApplying(true);
      try {
        await bulkAddComponents(proposed, replace);
        handleOpenChange(false);
      } catch (err: any) {
        setError(err.message || 'Failed to apply components.');
        setApplying(false);
      }
    },
    [proposed, bulkAddComponents, handleOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] w-full max-w-[min(42rem,calc(100vw-2rem))] min-w-0 overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5" />
            {step === 'settings' && 'AI Settings'}
            {step === 'describe' && 'Generate Page with AI'}
            {step === 'loading' && 'Generating...'}
            {step === 'review' && 'Review Generated Layout'}
          </DialogTitle>
          <DialogDescription>
            {step === 'settings' && 'Configure your AI provider to get started.'}
            {step === 'describe' && 'Describe the page you want and the AI will select and populate components from your design system.'}
            {step === 'loading' && 'The AI is selecting components and populating them with your content.'}
            {step === 'review' && `${proposed.length} component${proposed.length !== 1 ? 's' : ''} selected for your page.`}
          </DialogDescription>
        </DialogHeader>

        {step === 'settings' && (
          <div className="py-2">
            <ApiKeySettings onConfigured={() => setStep('describe')} />
          </div>
        )}

        {step === 'describe' && (
          <div className="space-y-4 py-2">
            {error && (
              <Alert variant="destructive">
                <AlertTriangleIcon className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="wizard-description">Page Description</Label>
              <Textarea
                id="wizard-description"
                placeholder="A landing page for a project management tool with a hero section, feature cards, and a call-to-action..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="wizard-content">
                  Content <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => setImporterOpen(true)}>
                  <GlobeIcon className="h-3.5 w-3.5" />
                  Import from URL
                </Button>
              </div>
              <Textarea
                id="wizard-content"
                placeholder="Provide headings, body copy, image URLs, or any content you want used in the page..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
              />
            </div>

            <DialogFooter className="flex-row justify-between sm:justify-between">
              <Button variant="ghost" size="sm" onClick={() => setStep('settings')}>
                <SettingsIcon className="mr-1 h-4 w-4" />
                AI Settings
              </Button>
              <Button onClick={handleGenerate} disabled={!description.trim()}>
                <SparklesIcon className="mr-1 h-4 w-4" />
                Generate
              </Button>
            </DialogFooter>

            <PageImporter
              open={importerOpen}
              onOpenChange={setImporterOpen}
              onImport={(imported) => setContent((prev) => (prev ? `${prev}\n\n${imported}` : imported))}
            />
          </div>
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">Analyzing your design system and generating layout...</p>
          </div>
        )}

        {step === 'review' && (
          <div className="flex min-h-0 w-full min-w-0 max-h-[min(60vh,calc(90vh-12rem))] flex-col gap-4 py-2">
            {warnings.length > 0 && (
              <Alert variant="warning" className="shrink-0">
                <AlertTriangleIcon className="h-4 w-4" />
                <AlertDescription>
                  {warnings.map((w, i) => (
                    <p key={i}>{w}</p>
                  ))}
                </AlertDescription>
              </Alert>
            )}

            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden rounded-lg border p-3">
              <div className="space-y-2">
                {proposed.map((item, idx) => (
                  <div key={idx} className="flex min-w-0 items-start gap-3 rounded-md border p-3">
                    <Badge variant="default" className="mt-0.5 shrink-0">
                      {idx + 1}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="break-words font-medium">{item.title}</p>
                      {item.description && (
                        <p className="break-words text-sm text-muted-foreground">{item.description}</p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {Object.keys(item.data).length} properties populated
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex shrink-0 flex-col gap-3 border-t pt-2 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="ghost" className="w-full shrink-0 sm:w-auto" onClick={() => setStep('describe')}>
                <ArrowLeftIcon className="mr-1 h-4 w-4" />
                Back
              </Button>
              <div className="flex min-w-0 flex-1 flex-wrap justify-end gap-2 sm:flex-initial">
                <Button variant="outline" onClick={handleGenerate} disabled={applying}>
                  Regenerate
                </Button>
                {selectedComponents.length > 0 && (
                  <Button variant="outline" onClick={() => handleApply(false)} disabled={applying}>
                    {applying ? <Loader2Icon className="mr-1 h-4 w-4 animate-spin" /> : null}
                    Append to Page
                  </Button>
                )}
                <Button onClick={() => handleApply(true)} disabled={applying}>
                  {applying ? <Loader2Icon className="mr-1 h-4 w-4 animate-spin" /> : <SparklesIcon className="mr-1 h-4 w-4" />}
                  Create This Page
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
