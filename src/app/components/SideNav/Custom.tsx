import { usePathname } from 'next/navigation';
import { normalizePathForMatch, toAbsolutePath } from '../../lib/utils';
import NavLink from '../NavLink';
import { SectionLink } from '../util';

const CustomNav = ({ menu }: { menu: SectionLink }) => {
  const pathname = usePathname();
  const normalizedPathname = normalizePathForMatch(pathname ?? '');
  return (
    <nav className="c-sidenav">
      <ul>
        {menu.subSections.map((item) => (
          <li className={`u-animation-fadein ${item.menu ? ' has_children' : ''}`} key={`${item.path}-${item.title}`}>
            {!item.path ? (
              <small>{item.title}</small>
            ) : (
              <>
                <NavLink href={toAbsolutePath(item.path)}>
                  {item.title}
                </NavLink>
                {item.menu && (
                  <ul className={`c-sidenav__sub${normalizedPathname.startsWith(normalizePathForMatch(item.path)) ? ' is-active' : ''}`}>
                    {item.menu.map((subItem) => (
                      <li key={subItem.path}>
                        <NavLink key={subItem.path} href={toAbsolutePath(subItem.path)} className="c-sidenav__sub-item">
                          {subItem.title}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
};
export default CustomNav;
