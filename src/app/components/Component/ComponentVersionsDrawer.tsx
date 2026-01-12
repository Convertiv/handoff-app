'use client';

import { PreviewObject } from '@handoff/types';
import { ChevronLeft, Clock, ExternalLink, History } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { CodeHighlight } from '../Markdown/CodeHighlight';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '../ui/drawer';
import { Skeleton } from '../ui/skeleton';

interface ComponentVersionEntry {
    version: number;
    hash: string;
    timestamp: string;
    filename: string;
}

interface ComponentVersions {
    id: string;
    currentVersion: number;
    versions: ComponentVersionEntry[];
}

interface ComponentVersionsDrawerProps {
    componentId: string;
    currentComponent: PreviewObject;
}

const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const formatRelativeTime = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours === 0) {
            const diffMins = Math.floor(diffMs / (1000 * 60));
            return diffMins <= 1 ? 'just now' : `${diffMins} minutes ago`;
        }
        return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    }
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
};

export const ComponentVersionsDrawer: React.FC<ComponentVersionsDrawerProps> = ({
    componentId,
    currentComponent,
}) => {
    const [versions, setVersions] = useState<ComponentVersions | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedVersion, setSelectedVersion] = useState<ComponentVersionEntry | null>(null);
    const [archivedComponent, setArchivedComponent] = useState<PreviewObject | null>(null);
    const [loadingArchive, setLoadingArchive] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const fetchVersions = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/component/${componentId}/versions.json`);
            if (response.ok) {
                const data = await response.json();
                setVersions(data);
            } else if (response.status === 404) {
                setVersions(null);
            } else {
                setError('Failed to fetch versions');
            }
        } catch (err) {
            setError('Failed to fetch versions');
        } finally {
            setLoading(false);
        }
    };

    const fetchArchivedVersion = async (entry: ComponentVersionEntry) => {
        setLoadingArchive(true);
        setSelectedVersion(entry);
        try {
            const response = await fetch(`/api/component/${componentId}/${entry.filename}`);
            if (response.ok) {
                const data = await response.json();
                setArchivedComponent(data);
            } else {
                setError('Failed to fetch archived version');
            }
        } catch (err) {
            setError('Failed to fetch archived version');
        } finally {
            setLoadingArchive(false);
        }
    };

    const handleBack = () => {
        setSelectedVersion(null);
        setArchivedComponent(null);
    };

    useEffect(() => {
        if (isOpen) {
            fetchVersions();
        }
    }, [isOpen, componentId]);

    // Reset state when drawer closes
    useEffect(() => {
        if (!isOpen) {
            setSelectedVersion(null);
            setArchivedComponent(null);
        }
    }, [isOpen]);

    const currentVersionInfo = currentComponent && {
        version: currentComponent.version ?? 1,
        hash: currentComponent.hash ?? '',
        lastModified: currentComponent.lastModified ?? new Date().toISOString(),
    };

    return (
        <Drawer direction="right" open={isOpen} onOpenChange={setIsOpen}>
            <DrawerTrigger asChild>
                <Button variant="outline" size="sm" className="font-normal gap-1.5 [&_svg]:size-3.5!">
                    <History className="h-3.5 w-3.5" />
                    Version History
                </Button>
            </DrawerTrigger>
            <DrawerContent className="w-[450px] max-w-[90vw]">
                <div className="flex h-full flex-col">
                    <DrawerHeader className="border-b">
                        {selectedVersion ? (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleBack}
                                    className="h-8 w-8 p-0"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div>
                                    <DrawerTitle>Version {selectedVersion.version}</DrawerTitle>
                                    <DrawerDescription>
                                        {formatDate(selectedVersion.timestamp)}
                                    </DrawerDescription>
                                </div>
                            </div>
                        ) : (
                            <>
                                <DrawerTitle className="flex items-center gap-2">
                                    <History className="h-5 w-5" />
                                    Version History
                                </DrawerTitle>
                                <DrawerDescription>
                                    View and compare previous versions of this component
                                </DrawerDescription>
                            </>
                        )}
                    </DrawerHeader>

                    <div className="flex-1 overflow-y-auto p-4">
                        {loading ? (
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
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <p className="text-sm text-muted-foreground">{error}</p>
                                <Button variant="outline" size="sm" onClick={fetchVersions} className="mt-4">
                                    Try Again
                                </Button>
                            </div>
                        ) : selectedVersion && archivedComponent ? (
                            <div className="space-y-4">
                                <div className="rounded-lg border bg-muted/30 p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium">Version {selectedVersion.version}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDate(selectedVersion.timestamp)}
                                            </p>
                                        </div>
                                        <Badge variant="secondary">Archived</Badge>
                                    </div>
                                    <div className="mt-3 pt-3 border-t">
                                        <p className="text-xs text-muted-foreground font-mono truncate">
                                            Hash: {selectedVersion.hash.substring(0, 16)}...
                                        </p>
                                    </div>
                                </div>
                                <CodeHighlight
                                    title={`${componentId} v${selectedVersion.version}`}
                                    language="json"
                                    type="json"
                                    data={JSON.stringify(archivedComponent, null, 2)}
                                    dark={true}
                                    height="calc(100vh - 350px)"
                                />
                            </div>
                        ) : selectedVersion && loadingArchive ? (
                            <div className="space-y-4">
                                <Skeleton className="h-24 w-full rounded-lg" />
                                <Skeleton className="h-[400px] w-full rounded-lg" />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {/* Current Version */}
                                {currentVersionInfo && (
                                    <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                    <span className="text-sm font-semibold">v{currentVersionInfo.version}</span>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium">Current Version</p>
                                                        <Badge variant="default" className="text-xs">Latest</Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {formatRelativeTime(currentVersionInfo.lastModified)}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDate(currentVersionInfo.lastModified)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Previous Versions */}
                                {versions && versions.versions.length > 0 ? (
                                    <>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide pt-4 pb-2">
                                            Previous Versions
                                        </p>
                                        {[...versions.versions]
                                            .sort((a, b) => b.version - a.version)
                                            .map((entry) => (
                                                <button
                                                    key={entry.version}
                                                    onClick={() => fetchArchivedVersion(entry)}
                                                    className="w-full rounded-lg border p-4 text-left transition-colors hover:bg-muted/50 hover:border-muted-foreground/20"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                                            <span className="text-sm font-semibold">v{entry.version}</span>
                                                        </div>
                                                        <div className="flex-1 space-y-1">
                                                            <p className="font-medium">Version {entry.version}</p>
                                                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {formatRelativeTime(entry.timestamp)}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {formatDate(entry.timestamp)}
                                                            </p>
                                                        </div>
                                                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                </button>
                                            ))}
                                    </>
                                ) : !loading && (
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
                        )}
                    </div>

                    <DrawerFooter className="border-t">
                        <DrawerClose asChild>
                            <Button variant="outline">Close</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    );
};

export default ComponentVersionsDrawer;
