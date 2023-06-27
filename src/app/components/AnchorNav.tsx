import React from 'react';
import AnchorNavLink from './AnchorNavLink';

export interface AnchorNavProps {
  title?: string,
  groups?: { [name: string]: string }[]
}

export const AnchorNav: React.FC<AnchorNavProps> = ({ title, groups }) => {
  return (
    <ul className="c-anchor-nav">
      <li>
        <p>{title ?? 'Contents'}</p>
      </li>
      {groups?.map((linkGroup, i) => (
        <React.Fragment key={`link-group-${i}`}>
          {Object.entries(linkGroup).map(([key, value]) => (
            <li key={`link-${key}`}>
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
    </ul>
  )
};

export default AnchorNav;
