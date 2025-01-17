import { usePathname } from 'next/navigation';
import NavLink from '../NavLink';
import { SectionLink } from '../util';

const CustomNav = ({ menu }: { menu: SectionLink }) => {
  const pathname = usePathname();
  return (
    <nav className="c-sidenav">
      <ul>
        {menu.subSections.map((item) => (
          <li className={`u-animation-fadein ${item.menu ? ' has_children' : ''}`} key={`${item.path}-${item.title}`}>
            {!item.path ? (
              <small>{item.title}</small>
            ) : (
              <>
                <NavLink href={`/${item.path}`}>
                  {item.title}
                </NavLink>
                {item.menu && (
                  <ul className={`c-sidenav__sub${pathname.includes(item.path) ? ' is-active' : ''}`}>
                    {item.menu.map((subItem) => (
                      <li key={subItem.path}>
                        <NavLink key={subItem.path} href={`/${subItem.path}`} className="c-sidenav__sub-item">
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
