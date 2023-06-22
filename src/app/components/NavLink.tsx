import * as React from 'react';
import Link, { LinkProps } from 'next/link';
import { useRouter } from 'next/router';
import classNames from 'classnames';

const NavLink = React.forwardRef<
  HTMLAnchorElement,
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> &
    LinkProps & {
      children?: React.ReactNode;
      activeClassName?: string;
    }
>(({ activeClassName = 'is-selected', className, children, ...props }, ref) => {
  const router = useRouter();

  return (
    <Link {...props} ref={ref} className={classNames(className, { [activeClassName]: router.asPath.startsWith(props.href.toString()) })}>
      {children}
    </Link>
  );
});

NavLink.displayName = 'NavLink';

export default NavLink;
