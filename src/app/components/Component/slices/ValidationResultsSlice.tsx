import { PreviewObject } from '@handoff/types';
import React from 'react';
import HeadersType from '../../Typography/Headers';
import { ValidationResults } from '../../Validation/ValidationResults';

export interface ValidationResultsSliceProps {
  preview: PreviewObject;
  validations?: boolean;
}

const ValidationResultsSlice: React.FC<ValidationResultsSliceProps> = ({ preview, validations = true }) => {
  return validations && preview?.validations ? (
    <div className="mb-5">
      <HeadersType.H3 id="validations">Validation results</HeadersType.H3>
      <ValidationResults
        validations={Object.fromEntries(
          Object.entries(preview.validations).map(([key, value]) => [
            key,
            {
              ...value,
              description: value.description || '',
              passed: value.passed,
            },
          ])
        )}
      />
    </div>
  ) : null;
};

export default ValidationResultsSlice;
