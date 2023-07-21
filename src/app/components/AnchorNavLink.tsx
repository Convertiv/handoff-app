import { useEffect, useState, ReactNode } from 'react';
import { Link } from 'react-scroll';

export interface AnchorNavLinkProps {
  children: ReactNode;
  to: string;
}

export const AnchorNavLink: React.FC<AnchorNavLinkProps> = ({ to, children }) => {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    setOffset(document.getElementById('site-header')?.clientHeight ?? 0);
  }, [])

  return (
    <Link href="#" activeClass='is-selected' smooth spy to={to} offset={offset * -1.5} onClick={() => {
      history.pushState ? history.pushState(null, '', `#${to}`) : location.hash = `#${to}`;
    }}>
      {children}
    </Link>
  );
};

export default AnchorNavLink;
