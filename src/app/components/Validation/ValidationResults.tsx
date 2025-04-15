import { ValidationResult } from '@handoff/types/config';
import { CheckCircle2, ChevronDown, XCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';

interface ValidationResultsProps {
  validations?: Record<string, ValidationResult>;
}

const getStatusIcon = (passed: boolean) => {
  if (passed) {
    return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  }
  return <XCircle className="h-4 w-4 text-red-500" />;
};

export const ValidationResults = ({ validations }: ValidationResultsProps) => {
  if (!validations || Object.keys(validations).length === 0) {
    return null;
  }

  const validationEntries = Object.entries(validations);

  return (
    <div className="space-y-2">
      {validationEntries.map(([key, validation]) => (
        <Collapsible key={key} className="rounded-lg border p-2">
          <div className="flex flex-col gap-2">
            <CollapsibleTrigger className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(validation.passed)}
                <span className="font-medium">{key}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={validation.passed ? 'green' : 'destructive'}>
                  {validation.passed ? 'Passed' : `${validation.messages?.length || 0} Errors`}
                </Badge>
                <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </div>
            </CollapsibleTrigger>
            <p className="pl-6 text-sm text-gray-500">{validation.description}</p>
            <CollapsibleContent className="mt-2 space-y-1 pl-6">
              {validation.messages && validation.messages.length > 0 && (
                <div className="rounded-md bg-gray-50 p-3 dark:bg-gray-800">
                  <ul className="list-inside list-disc space-y-1 text-sm">
                    {validation.messages.map((message, index) => (
                      <li key={index} className="text-gray-600 dark:text-gray-300">
                        {message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CollapsibleContent>
          </div>
        </Collapsible>
      ))}
    </div>
  );
};
