import Link from 'next/link';
import { getConfig } from '../../config';
import NavLink from './NavLink';
import { SectionLink } from './util';
import React from 'react';
import { Config } from '../../types/config';

interface HeaderProps {
  menu: SectionLink[];
  config: Config;
}

function Header({ menu, config }: HeaderProps) {
  const [mobile, setMobile] = React.useState('');
  const toggle = () => {
    if (mobile === 'is-active') {
      setMobile('');
    } else {
      setMobile('is-active');
    }
  };

  return (
    <>
      <header id="site-header" className="c-site-header">
        <div className="o-container-fluid">
          <div className="c-site-header__wrapper">
            <div>
              <div className="c-site-menu">
                <button className={`c-hamburger-icon c-hamburger-icon--slider ${mobile}`} onClick={toggle}>
                  <div className="c-hamburger-icon__box">
                    <div className="c-hamburger-icon__inner"></div>
                  </div>
                </button>
              </div>
              <div className="c-site-title">
                <Link href="/" className="c-site-logo c-site-logo--basic" title="" rel="home" aria-label="logo">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`${process.env.NEXT_BASE_PATH}${config?.logo}` || `${process.env.NEXT_BASE_PATH}/logo.svg`} alt={config?.title} />
                </Link>
              </div>

              <nav className="c-site-nav">
                <ul>
                  {menu.map((item) => (
                    <li key={item.path}>
                      <NavLink href={`${item.path}`}>{item.title}</NavLink>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
            <div>
              {
                // TODO: Reimpliment cmd k search
                false && <small>hit cmd+k to search</small>
              }
            </div>
          </div>
        </div>
      </header>
      <div className={`c-offcanvas c-offcanvas--menu ${mobile}`}>
        <div className="c-offcanvas__inner">
          <nav className="c-mobilenav">
            <ul className="c-mobilenav__menu">
              {menu.map((item) => (
                <li key={`mobile-${item.path}`}>
                  <NavLink href={`${item.path}`}>{item.title}</NavLink>
                  {item.subSections.length > 0 && (
                    <ul className="c-mobilenav__submenu">
                      {item.subSections.filter(sub => sub.path).map((sub) => (
                        <li key={sub.path}>
                          <NavLink href={`${sub.path}`}>{sub.title}</NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}

export default Header;
