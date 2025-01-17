const HeadersType = {
  H1: ({ children }) => <h1 className="text-3xl font-normal">{children}</h1>,
  H2: ({ children }) => <h2 className="mb-3 text-2xl font-medium">{children}</h2>,
  H3: ({ children }) => <h3 className="mb-2 text-xl font-medium">{children}</h3>,
  H4: ({ children }) => <h4 className="mb-2 text-lg font-medium">{children}</h4>,
  H5: ({ children }) => <h5 className="mb-2 text-base font-medium">{children}</h5>,
  H6: ({ children }) => <h6 className="mb-2 text-sm font-medium">{children}</h6>,
};
export default HeadersType;
