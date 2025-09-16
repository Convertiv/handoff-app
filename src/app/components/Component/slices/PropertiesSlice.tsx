import { PreviewObject } from '@handoff/types';
import React from 'react';
import HeadersType from '../../Typography/Headers';
import { ComponentProperties } from '../Preview';

export interface PropertiesSliceProps {
  preview: PreviewObject;
  properties?: boolean;
}

const PropertiesSlice: React.FC<PropertiesSliceProps> = ({ preview, properties = true }) => {
  return properties && preview?.properties ? (
    <>
      <HeadersType.H3 id="properties">Properties</HeadersType.H3>
      <ComponentProperties
        fields={Object.keys(preview.properties).map((key) => {
          return { ...preview.properties[key], key };
        })}
      />
    </>
  ) : null;
};

export default PropertiesSlice;
