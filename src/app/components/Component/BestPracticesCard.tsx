import { PreviewObject } from '@handoff/types';
import { Check, X } from 'lucide-react';
import React from 'react';

const PracticeLine: React.FC<{ rule: string; yes: boolean }> = ({ rule, yes }) => (
  <li className="flex items-start gap-3">
    {yes ? (
      <Check className="mt-[5px] h-3 w-3 shrink-0 text-emerald-600" strokeWidth={3} />
    ) : (
      <X className="mt-[5px] h-3 w-3 shrink-0 text-gray-400" strokeWidth={3} />
    )}
    <p className="text-sm">{rule}</p>
  </li>
);

const BestPracticesCard: React.FC<{ component: PreviewObject }> = ({ component }) => {
  return (
    <div id="best-practices" className="flex flex-col gap-2 pb-7">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(100%,1fr))] gap-6 sm:grid-cols-[repeat(auto-fit,minmax(300px,1fr))]">
        {component.should_do && component.should_do.length > 0 && (
          <div className="relative rounded-lg border bg-gray-50 p-8 text-gray-600 dark:bg-gray-800">
            <h2 className="mb-3 font-normal text-gray-700">Best Practices</h2>
            <ul className="space-y-3 text-emerald-800">
              {component.should_do.map((rule, index) => (
                <PracticeLine rule={rule} yes={true} key={`do-rule-${index}`} />
              ))}
            </ul>
          </div>
        )}
        {component.should_not_do && component.should_not_do.length > 0 && (
          <div className="relative rounded-lg border bg-gray-50 p-8 text-gray-600 dark:bg-gray-800">
            <h2 className="mb-3 font-normal text-gray-900">Common Mistakes</h2>
            <ul className="space-y-3 text-red-800">
              {component.should_not_do.map((rule, index) => (
                <PracticeLine rule={rule} yes={false} key={`dont-rule-${index}`} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
export default BestPracticesCard;
