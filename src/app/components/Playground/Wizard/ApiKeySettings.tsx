import { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { KeyIcon, Trash2Icon } from 'lucide-react';
import { getApiKey, setApiKey, clearApiKey, getModel, setModel, AVAILABLE_MODELS } from './llm-client';

interface ApiKeySettingsProps {
  onConfigured?: () => void;
  compact?: boolean;
}

export default function ApiKeySettings({ onConfigured, compact }: ApiKeySettingsProps) {
  const [key, setKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState(getModel());

  useEffect(() => {
    setHasKey(!!getApiKey());
  }, []);

  const handleSave = () => {
    if (!key.trim()) return;
    setApiKey(key.trim());
    setHasKey(true);
    setKey('');
    onConfigured?.();
  };

  const handleClear = () => {
    clearApiKey();
    setHasKey(false);
    setKey('');
  };

  const handleModelChange = (value: string) => {
    setSelectedModel(value);
    setModel(value);
  };

  if (hasKey && compact) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <KeyIcon className="h-3 w-3" />
        <span>API key configured</span>
        <Button variant="ghost" size="sm" onClick={handleClear} className="h-6 px-1">
          <Trash2Icon className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hasKey ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <KeyIcon className="h-4 w-4 text-green-600" />
              <span>OpenAI API key configured</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClear}>
              <Trash2Icon className="h-4 w-4" />
              <span className="ml-1">Remove</span>
            </Button>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="model-select">Model</Label>
            <Select value={selectedModel} onValueChange={handleModelChange}>
              <SelectTrigger id="model-select" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_MODELS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Enter your OpenAI API key to use the AI wizard. Your key is stored locally in your browser and only sent to
            OpenAI.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="api-key-input">OpenAI API Key</Label>
            <div className="flex gap-2">
              <Input
                id="api-key-input"
                type="password"
                placeholder="sk-..."
                value={key}
                onChange={(e) => setKey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
              <Button onClick={handleSave} disabled={!key.trim()}>
                Save
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="model-select">Model</Label>
            <Select value={selectedModel} onValueChange={handleModelChange}>
              <SelectTrigger id="model-select" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_MODELS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
