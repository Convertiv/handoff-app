export type QueryValue = string | string[] | undefined;

export const singleQueryValue = (value: QueryValue): string | undefined => (Array.isArray(value) ? value[0] : value);

export const joinedQueryValue = (value: QueryValue): string | undefined =>
  Array.isArray(value) ? (value.length > 0 ? value.join('/') : undefined) : value;
