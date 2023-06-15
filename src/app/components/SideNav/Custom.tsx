import * as React from 'react';
import NavLink from '../NavLink';
import { SectionLink } from '../util';
import Icon from '../Icon';

const CustomNav = ({ menu }: { menu: SectionLink }) => {
  return (
    <nav className="c-sidenav">
      <ul>
        {menu.subSections.map((item) => (
          <li className="u-animation-fadein" key={`${item.path}-${item.title}`}>
            {!item.path ? (
              <small>{item.title}</small>
            ) : (
              <NavLink href={`/${item.path}`}>
                {item.image && <Icon name={item.image}/>}
                {item.title}
              </NavLink>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
};
export default CustomNav;
