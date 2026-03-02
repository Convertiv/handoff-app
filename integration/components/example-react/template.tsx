import React from 'react';

type Props = {
  /** The title of the example @default 'TSX Component' */
  title: string;
  /** The body of the example @default 'This component is rendered from template.tsx' */
  body: string;
  /** Whether the example is featured @default false @optional */
  featured: boolean;
};

const ExampleReactTemplate: React.FC<Props> = ({ title, body, featured }) => {
  return (
    <section className={`example-react-template ${featured ? 'is-featured' : ''}`}>
      <h2>{title}</h2>
      <p>{body}</p>
    </section>
  );
};

export default ExampleReactTemplate;
