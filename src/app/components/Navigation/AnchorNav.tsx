import React from 'react';
import AnchorNavLink from './AnchorNavLink';
import { TextQuote } from 'lucide-react';

export interface AnchorNavProps {
  title?: string;
  groups?: { [name: string]: string }[];
}

export const AnchorNav: React.FC<AnchorNavProps> = ({ title, groups }) => {
  return (
    <div className="hidden text-sm xl:block">
      <div className="sticky top-24">
        <p className="relative mb-6 flex items-center gap-3 text-sm text-gray-500 after:absolute after:bottom-[-12px] after:left-0 after:h-[1px] after:w-[130px] after:bg-gray-200 dark:text-gray-400 dark:after:bg-gray-800">
          <TextQuote className="h-[14px] w-[14px] opacity-50" strokeWidth={2} /> {title ?? 'On This Page'}
        </p>
        <ul className="space-y-2">
          {groups?.map((linkGroup, i) => (
            <React.Fragment key={`link-group-${i}`}>
              {Object.entries(linkGroup).map(([key, value]) => (
                <li>
                  <AnchorNavLink to={key}>{value}</AnchorNavLink>
                </li>
              ))}
              {i !== groups.length - 1 && (
                <li>
                  <hr />
                </li>
              )}
            </React.Fragment>
          ))}
          <li>
            <a href="">Foundations</a>
            <ul className="space-y-2 pl-4 pt-2">
              <li>
                <a href="">Typography</a>
              </li>
              <li>
                <a href="">Colors</a>
              </li>
              <li>
                <a href="">Icons</a>
              </li>
            </ul>
          </li>
          <li>
            <a href="">Sections</a>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default AnchorNav;
