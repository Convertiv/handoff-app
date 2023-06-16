import classNames from 'classnames';
import Image from 'next/image';
import * as React from 'react';

export interface IconProps {
  name: string;
  className?: string;
  width?: number;
  height?: number;
}

export const Icon: React.FC<IconProps> = ({ name, className, width, height }) => {
  return (
    <div className={`icon-wrapper ${className ? className : ''}`}>
      <Image
        src={`/assets/svg/${name}.svg`}
        className={className}
        alt={`Icon for ${name}`}
        width={width ?? '100%'}
        height={height ?? '100%'}
      />
    </div>
  );
};

export default Icon;
