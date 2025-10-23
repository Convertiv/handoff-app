import { ReactNode, useEffect, useState } from 'react';
import { Link } from 'react-scroll';

export interface AnchorNavLinkProps {
  children: ReactNode;
  className?: string;
  to: string;
}

export const AnchorNavLink: React.FC<AnchorNavLinkProps> = ({ to, className, children }) => {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    setOffset(document.getElementById('site-header')?.clientHeight ?? 0);
  }, []);

  return (
    <>
      {/* @ts-ignore */}
      <Link
        href="#"
        className={`${className ?? ''} transition-all duration-200 ease-in-out`}
        activeClass="text-sidebar-accent-foreground font-semibold "
        smooth
        spy
        to={to}
        duration={300}
        offset={-100}
        onClick={() => {
          history.pushState ? history.pushState(null, '', `#${to}`) : (location.hash = `#${to}`);
        }}
      >
        {children}
      </Link>
    </>
  );
};

export default AnchorNavLink;
