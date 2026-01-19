'use client';

import { PreviewObject } from '@handoff/types';
import { History } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';

export interface ComponentVersionEntry {
    version: number;
    hash: string;
    timestamp: string;
    filename: string;
}

export interface ComponentVersions {
    id: string;
    currentVersion: number;
    versions: ComponentVersionEntry[];
}

interface ComponentVersionHistoryProps {
    componentId: string;
    currentComponent: PreviewObject;
    versions?: ComponentVersions | null;
    onVersionsLoaded?: (versions: ComponentVersions | null) => void;
}

const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

export const ComponentVersionHistory: React.FC<ComponentVersionHistoryProps> = ({
    componentId,
    currentComponent,
    versions: versionsProp,
    onVersionsLoaded,
}) => {
    const [versions, setVersions] = useState<ComponentVersions | null>(versionsProp ?? null);
    const [loading, setLoading] = useState(!versionsProp);
    const [error, setError] = useState<string | null>(null);

    const fetchVersions = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/component/${componentId}/versions.json`);
            if (response.ok) {
                const data = await response.json();
                setVersions(data);
                onVersionsLoaded?.(data);
            } else if (response.status === 404) {
                setVersions(null);
                onVersionsLoaded?.(null);
            } else {
                setError('Failed to fetch versions');
            }
        } catch {
            setError('Failed to fetch versions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!versionsProp) {
            fetchVersions();
        }
    }, [componentId, versionsProp]);

    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button variant="outline" size="sm" onClick={fetchVersions} className="mt-4">
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {versions && versions.versions.length > 0 ? (
                <div className="space-y-8">
                    {[...versions.versions]
                        .sort((a, b) => b.version - a.version)
                        .slice(0, 2)
                        .map((entry) => (
                            <div key={entry.version} id={`v${entry.version}`} className="grid gap-2 md:grid-cols-[120px_minmax(0,1fr)]">
                                <p className="text-sm font-medium text-primary">{formatDate(entry.timestamp)}</p>
                                <ul className="pl-0 md:pl-4 space-y-3 text-sm text-muted-foreground">
                                    <li>Properties added: icon, size</li>
                                    <li>Variants updated: primary, secondary</li>
                                    <li>Preview URLs updated</li>
                                </ul>
                            </div>
                        ))}
                </div>
            ) : (
                <div className="rounded-lg border border-dashed p-8 text-center">
                    <History className="mx-auto h-8 w-8 text-muted-foreground/50" />
                    <p className="mt-3 text-sm text-muted-foreground">
                        No previous versions found
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground/70">
                        Version history will appear here when changes are made
                    </p>
                </div>
            )}
        </div>
    );
};

export default ComponentVersionHistory;
