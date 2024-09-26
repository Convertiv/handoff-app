export const Hero: React.FC<{
  title: string;
  image: string;
  children: React.ReactNode;
  toc?: {
    title: string;
    link: string;
  }[];
}> = ({ title, image, children, toc }) => {
  return (
    <div className="c-hero">
      <div>
        <h1>{title}</h1>
        <div className="u-mb-2">{children}</div>
        {toc && toc.length > 0 && (
          <ul className="c-hero__toc">
            {toc.map((item, i) => (
              <li key={`toc-item-${i}`}>
                <a href={item.link}>{item.title}</a>
              </li>
            ))}
          </ul>
        )}
      </div>
      {image && (
        <img
          alt="Icon for component-button"
          loading="lazy"
          width="100"
          height="100"
          decoding="async"
          data-nimg="1"
          className="c-hero__img"
          style={{ color: 'transparent' }}
          src={image}
        />
      )}
    </div>
  );
};
