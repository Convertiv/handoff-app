import classNames from 'classnames';
import * as React from 'react';

export interface IconProps {
  name: string;
  className?: string;
}

export const Icon: React.FC<IconProps> = ({ name, className }) => {
  return (
    <svg className={classNames('o-icon', className)}>
      <use xmlnsXlink="http://www.w3.org/1999/xlink" xlinkHref={`/assets/icons.svg#icon-${name}`} />
    </svg>
  );
};

export default Icon;
