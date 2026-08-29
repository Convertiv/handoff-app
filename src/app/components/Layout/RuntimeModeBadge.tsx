import type { RuntimeMode } from '@handoff/types/config';
import { Badge } from '../ui/badge';

const LABEL: Record<RuntimeMode, string> = {
  workspace: 'Workspace',
  registry: 'Registry',
};

/**
 * The Workspace/Registry marker, shared by the header and the MCP connect dialog. `mode` is a prop
 * because the header reads the projected client config while the dialog reads the mode baked into
 * the bundle.
 */
export const RuntimeModeBadge: React.FC<{ mode: RuntimeMode; className?: string }> = ({ mode, className }) => (
  <Badge variant={mode === 'registry' ? 'info' : 'default'} className={className} aria-label={`Runtime mode: ${LABEL[mode]}`}>
    {LABEL[mode]}
  </Badge>
);
