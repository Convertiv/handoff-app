import { PreviewObject } from '@handoff/types';
import { Check, X } from 'lucide-react';

const PracticeLine: React.FC<{ rule: string; yes: boolean }> = ({ rule, yes }) => (
  <li className="flex items-start gap-3">
    {yes ? (
      <Check className="mt-1.5 h-3 w-3 text-emerald-600" strokeWidth={4} />
    ) : (
      <X className="mt-1.5 h-3 w-3 text-red-600" strokeWidth={4} />
    )}
    <p className="text-sm">{rule}</p>
  </li>
);

const BestPracticesCard: React.FC<{ component: PreviewObject }> = ({ component }) => {
  return (
    <div className="flex flex-col gap-2 pb-7">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(100%,1fr))] gap-6 sm:grid-cols-[repeat(auto-fit,minmax(300px,1fr))]">
        {component.should_do && component.should_do.length > 0 && (
          <div className="relative rounded-lg bg-slate-50 p-6 text-gray-600 ring-1 ring-inset ring-slate-500/20">
            <h2 className="mb-3 font-medium text-green-700">Best Practices</h2>
            <ul className="space-y-3 text-emerald-800">
              {component.should_do.map((rule) => (
                <PracticeLine rule={rule} yes={true} />
              ))}
            </ul>
          </div>
        )}
        {component.should_not_do && component.should_not_do.length > 0 && (
          <div className="relative rounded-lg bg-slate-50 p-6 text-gray-600 ring-1 ring-inset ring-slate-500/20">
            <h2 className="mb-3 font-medium text-red-900">Common Mistakes</h2>
            <ul className="space-y-3 text-red-800">
              {component.should_not_do.map((rule) => (
                <PracticeLine rule={rule} yes={false} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
export default BestPracticesCard;
