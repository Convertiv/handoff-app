'use client';

import * as React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JsonTreeViewProps {
  data: unknown;
  className?: string;
  defaultExpanded?: boolean;
  maxInitialDepth?: number;
}

interface JsonNodeProps {
  name: string | null;
  value: unknown;
  depth: number;
  isLast: boolean;
  defaultExpanded: boolean;
  maxInitialDepth: number;
}

const getValueType = (value: unknown): string => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
};

const getValuePreview = (value: unknown, type: string): string => {
  switch (type) {
    case 'string':
      const str = value as string;
      if (str.length > 50) {
        return `"${str.substring(0, 50)}..."`;
      }
      return `"${str}"`;
    case 'number':
    case 'boolean':
      return String(value);
    case 'null':
      return 'null';
    case 'array':
      return `Array(${(value as unknown[]).length})`;
    case 'object':
      const keys = Object.keys(value as object);
      return `{${keys.length} ${keys.length === 1 ? 'key' : 'keys'}}`;
    default:
      return String(value);
  }
};

const getTypeColor = (type: string): string => {
  switch (type) {
    case 'string':
      return 'text-green-600 dark:text-green-400';
    case 'number':
      return 'text-blue-600 dark:text-blue-400';
    case 'boolean':
      return 'text-purple-600 dark:text-purple-400';
    case 'null':
      return 'text-gray-500 dark:text-gray-400';
    case 'array':
    case 'object':
      return 'text-gray-700 dark:text-gray-300';
    default:
      return 'text-gray-600 dark:text-gray-300';
  }
};

const JsonNode: React.FC<JsonNodeProps> = ({ name, value, depth, isLast, defaultExpanded, maxInitialDepth }) => {
  const type = getValueType(value);
  const isExpandable = type === 'object' || type === 'array';
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded && depth < maxInitialDepth);

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const renderValue = () => {
    if (!isExpandable) {
      return (
        <span className={cn('font-mono text-sm', getTypeColor(type))}>
          {getValuePreview(value, type)}
        </span>
      );
    }

    if (type === 'array') {
      const arr = value as unknown[];
      if (arr.length === 0) {
        return <span className="font-mono text-sm text-gray-500">[]</span>;
      }
      
      return (
        <>
          <span className="font-mono text-sm text-gray-500">
            [{arr.length}]
          </span>
          {isExpanded && (
            <div className="ml-4 border-l border-gray-200 pl-2 dark:border-gray-700">
              {arr.map((item, index) => (
                <JsonNode
                  key={index}
                  name={String(index)}
                  value={item}
                  depth={depth + 1}
                  isLast={index === arr.length - 1}
                  defaultExpanded={defaultExpanded}
                  maxInitialDepth={maxInitialDepth}
                />
              ))}
            </div>
          )}
        </>
      );
    }

    if (type === 'object') {
      const obj = value as Record<string, unknown>;
      const keys = Object.keys(obj);
      if (keys.length === 0) {
        return <span className="font-mono text-sm text-gray-500">{'{}'}</span>;
      }

      return (
        <>
          <span className="font-mono text-sm text-gray-500">
            {'{'}
            {keys.length}
            {'}'}
          </span>
          {isExpanded && (
            <div className="ml-4 border-l border-gray-200 pl-2 dark:border-gray-700">
              {keys.map((key, index) => (
                <JsonNode
                  key={key}
                  name={key}
                  value={obj[key]}
                  depth={depth + 1}
                  isLast={index === keys.length - 1}
                  defaultExpanded={defaultExpanded}
                  maxInitialDepth={maxInitialDepth}
                />
              ))}
            </div>
          )}
        </>
      );
    }

    return null;
  };

  return (
    <div className={cn('py-0.5', !isLast && 'border-b border-gray-100 dark:border-gray-800')}>
      <div
        className={cn(
          'flex items-start gap-1 rounded px-1 py-0.5',
          isExpandable && 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50'
        )}
        onClick={isExpandable ? toggleExpand : undefined}
      >
        {isExpandable ? (
          <button
            className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            onClick={toggleExpand}
          >
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
        ) : (
          <span className="w-4 flex-shrink-0" />
        )}
        
        {name !== null && (
          <span className="flex-shrink-0 font-mono text-sm font-medium text-gray-800 dark:text-gray-200">
            {name}
            <span className="text-gray-400">:</span>
          </span>
        )}
        
        <div className="min-w-0 flex-1">{renderValue()}</div>
      </div>
    </div>
  );
};

export const JsonTreeView: React.FC<JsonTreeViewProps> = ({
  data,
  className,
  defaultExpanded = false,
  maxInitialDepth = 0,
}) => {
  const type = getValueType(data);

  if (type !== 'object' && type !== 'array') {
    // For primitive values, just render them directly
    return (
      <div className={cn('rounded-lg bg-gray-50 p-4 dark:bg-gray-900', className)}>
        <span className={cn('font-mono text-sm', getTypeColor(type))}>
          {getValuePreview(data, type)}
        </span>
      </div>
    );
  }

  if (type === 'array') {
    const arr = data as unknown[];
    return (
      <div className={cn('rounded-lg bg-gray-50 p-4 dark:bg-gray-900', className)}>
        <div className="space-y-0">
          {arr.map((item, index) => (
            <JsonNode
              key={index}
              name={String(index)}
              value={item}
              depth={0}
              isLast={index === arr.length - 1}
              defaultExpanded={defaultExpanded}
              maxInitialDepth={maxInitialDepth}
            />
          ))}
        </div>
      </div>
    );
  }

  const obj = data as Record<string, unknown>;
  const keys = Object.keys(obj);

  return (
    <div className={cn('rounded-lg bg-gray-50 p-4 dark:bg-gray-900', className)}>
      <div className="space-y-0">
        {keys.map((key, index) => (
          <JsonNode
            key={key}
            name={key}
            value={obj[key]}
            depth={0}
            isLast={index === keys.length - 1}
            defaultExpanded={defaultExpanded}
            maxInitialDepth={maxInitialDepth}
          />
        ))}
      </div>
    </div>
  );
};

export default JsonTreeView;
