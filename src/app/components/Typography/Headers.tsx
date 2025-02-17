interface HeaderProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

const H1: React.FC<HeaderProps> = ({ children, ...props }) => (
  <h1 className="text-3xl font-medium" {...props}>
    {children}
  </h1>
);

const H2: React.FC<HeaderProps> = ({ children, ...props }) => (
  <h2 className="mb-3 text-2xl font-semibold tracking-tight" {...props}>
    {children}
  </h2>
);

const H3: React.FC<HeaderProps> = ({ children, ...props }) => (
  <h3 className="mb-3 text-xl font-semibold tracking-tight" {...props}>
    {children}
  </h3>
);

const H4: React.FC<HeaderProps> = ({ children, ...props }) => (
  <h4 className="mb-2 text-lg font-medium" {...props}>
    {children}
  </h4>
);

const H5: React.FC<HeaderProps> = ({ children, ...props }) => (
  <h5 className="mb-2 text-base font-medium" {...props}>
    {children}
  </h5>
);

const H6: React.FC<HeaderProps> = ({ children, ...props }) => (
  <h6 className="mb-2 text-sm font-medium" {...props}>
    {children}
  </h6>
);

const HeadersType = {
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
};

export default HeadersType;
