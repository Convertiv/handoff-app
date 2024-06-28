export const Hero: React.FC<{ title: string; image: string; children: React.ReactNode }> = ({ title, image, children }) => {
  return (
    <div className="c-hero c-hero--boxed c-hero--bg-yellow">
      <div>
        <h1>{title}</h1>
        {children}
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
