import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Textarea } from '../../ui/textarea';
import { Label } from '../../ui/label';
import { Alert, AlertDescription } from '../../ui/alert';
import { Badge } from '../../ui/badge';
import { AlertTriangleIcon, Loader2Icon, SparklesIcon, SettingsIcon, ArrowLeftIcon } from 'lucide-react';
import { usePlayground, BulkComponentEntry } from '../PlaygroundContext';
import { callLLM, getApiKey } from './llm-client';
import { buildSystemPrompt, buildUserPrompt } from './prompt-builder';
import { parseWizardResponse, enrichWithTitles, ProposedComponent } from './response-parser';
import ApiKeySettings from './ApiKeySettings';

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
      const systemPrompt = buildSystemPrompt(components);
      const userPrompt = buildUserPrompt(description, content);
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
      <DialogContent className="max-w-2xl">
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
              <Label htmlFor="wizard-content">
                Content <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
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
          </div>
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">Analyzing your design system and generating layout...</p>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4 py-2">
            {warnings.length > 0 && (
              <Alert variant="warning">
                <AlertTriangleIcon className="h-4 w-4" />
                <AlertDescription>
                  {warnings.map((w, i) => (
                    <p key={i}>{w}</p>
                  ))}
                </AlertDescription>
              </Alert>
            )}

            <div className="max-h-[300px] space-y-2 overflow-y-auto rounded-lg border p-3">
              {proposed.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 rounded-md border p-3">
                  <Badge variant="default" className="mt-0.5 shrink-0">
                    {idx + 1}
                  </Badge>
                  <div className="min-w-0">
                    <p className="font-medium">{item.title}</p>
                    {item.description && (
                      <p className="truncate text-sm text-muted-foreground">{item.description}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {Object.keys(item.data).length} properties populated
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter className="flex-row gap-2 sm:justify-between">
              <Button variant="ghost" onClick={() => setStep('describe')}>
                <ArrowLeftIcon className="mr-1 h-4 w-4" />
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleGenerate} disabled={applying}>
                  Regenerate
                </Button>
                {selectedComponents.length > 0 && (
                  <Button variant="outline" onClick={() => handleApply(false)} disabled={applying}>
                    {applying ? <Loader2Icon className="mr-1 h-4 w-4 animate-spin" /> : null}
                    Append
                  </Button>
                )}
                <Button onClick={() => handleApply(true)} disabled={applying}>
                  {applying ? <Loader2Icon className="mr-1 h-4 w-4 animate-spin" /> : null}
                  {selectedComponents.length > 0 ? 'Replace All' : 'Apply'}
                </Button>
              </div>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
