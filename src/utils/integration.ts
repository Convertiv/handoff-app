export const toLowerCaseKeysAndValues = (obj: Record<string, any>): Record<string, any> => {
  const loweredObj: Record<string, any> = {};
  for (const key in obj) {
    const lowerKey = key.toLowerCase();
    const value = obj[key];

    if (typeof value === 'string') {
      loweredObj[lowerKey] = value.toLowerCase();
    } else if (typeof value === 'object' && value !== null) {
      loweredObj[lowerKey] = toLowerCaseKeysAndValues(value);
    } else {
      loweredObj[lowerKey] = value; // For non-string values
    }
  }
  return loweredObj;
};
