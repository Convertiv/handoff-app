import { DownloadIcon, KeyIcon, LayoutTemplate, RotateCcwIcon, SquareDashedMousePointer, Trash2Icon, XIcon, ZoomInIcon, ZoomOutIcon } from 'lucide-react';
import type { GetStaticProps } from 'next';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import ApiKeySettings from '../../components/Design/ApiKeySettings';
import { getApiKey, getImageModel } from '../../components/Design/llm-client';
import Layout from '../../components/Layout/Main';
import { Button } from '../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { DocumentationProps, fetchDocPageMarkdown, getClientRuntimeConfig } from '../../components/util';

type GeneratedImage = {
  id: string;
  src?: string;
  prompt: string;
  status: 'pending' | 'completed' | 'error';
  error?: string;
};

type AnnotationRect = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type DraftAnnotation = {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
};

const DESIGN_CLIENTS = ['ssc', '8x8'] as const;

type DesignClient = (typeof DESIGN_CLIENTS)[number];

const DESIGN_ASSETS = [
  { name: 'carousel.png' },
  { name: 'container.png' },
  { name: 'hero.png' },
];

const DESIGN_SYSTEM_IMAGE = { name: 'design-system.png' };

const CANVAS_SIZE = 1024;
const MIN_ANNOTATION_SIZE = 8;

const getDesignAssetSrc = (client: DesignClient, name: string) => `/assets/design/${client}/${name}`;

const DESIGN_SYSTEM_PROMPT = `Create a design for a new section based on the reference image. Follow the typography and color palette of the reference image. Use spacing and padding of the reference image. Use text and color styles from the design system file. Use the user's prompt as the main direction. Treat the provided 1024x1024 image size as the full canvas. OpenAI will always return a 1024x1024 image, but the section itself should only use the vertical height it needs on that canvas, leaving unused space plain and unobtrusive instead of stretching the section to fill the whole square.`;

export const getStaticProps: GetStaticProps = async () => {
  const config = getClientRuntimeConfig();
  return {
    props: {
      config,
      ...fetchDocPageMarkdown('docs/', 'design', `/design`).props,
    } as DocumentationProps,
  };
};

const DesignPage = ({ menu, metadata, current, config }: DocumentationProps) => {
  const referenceImageInputRef = useRef<HTMLInputElement>(null);
  const layoutReferenceInputRef = useRef<HTMLInputElement>(null);
  const [selectedClient, setSelectedClient] = useState<DesignClient>('ssc');
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [additionalImage, setAdditionalImage] = useState<File | null>(null);
  const [layoutReferenceImages, setLayoutReferenceImages] = useState<File[]>([]);
  const [selectedAssetName, setSelectedAssetName] = useState<string | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [annotations, setAnnotations] = useState<AnnotationRect[]>([]);
  const [draftAnnotation, setDraftAnnotation] = useState<DraftAnnotation | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedGeneratedImageId, setSelectedGeneratedImageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClientChange = (client: DesignClient) => {
    setSelectedClient(client);
    setReferenceImage(null);
    setSelectedAssetName(null);
    setSelectedGeneratedImageId(null);
  };

  const handleSelectAsset = async (asset: (typeof DESIGN_ASSETS)[number]) => {
    try {
      const assetSrc = getDesignAssetSrc(selectedClient, asset.name);
      const response = await fetch(assetSrc);
      if (!response.ok) {
        throw new Error(`Could not load ${asset.name}. Add it to src/app/public/assets/design/${selectedClient} first.`);
      }

      const blob = await response.blob();
      setReferenceImage(new File([blob], asset.name, { type: blob.type || 'image/png' }));
      setSelectedAssetName(asset.name);
      setSelectedGeneratedImageId(null);
      setImageSrc(assetSrc);
      setAnnotations([]);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to select asset.');
    }
  };

  const handleAddLayoutReferences = (files: FileList | null) => {
    if (!files?.length) return;

    setLayoutReferenceImages((current) => [...current, ...Array.from(files)]);
    if (layoutReferenceInputRef.current) {
      layoutReferenceInputRef.current.value = '';
    }
  };

  const handleClearAdditionalImage = () => {
    setAdditionalImage(null);
    if (referenceImageInputRef.current) {
      referenceImageInputRef.current.value = '';
    }
  };

  const loadDesignSystemImage = async (client: DesignClient) => {
    const response = await fetch(getDesignAssetSrc(client, DESIGN_SYSTEM_IMAGE.name));
    if (!response.ok) {
      throw new Error(`Could not load ${DESIGN_SYSTEM_IMAGE.name}. Add it to src/app/public/assets/design/${client} first.`);
    }

    const blob = await response.blob();
    return new File([blob], DESIGN_SYSTEM_IMAGE.name, { type: blob.type || 'image/png' });
  };

  const loadReferenceImageFromSrc = async (src: string, name: string) => {
    const response = await fetch(src);
    if (!response.ok) {
      throw new Error('Could not load selected image as a reference.');
    }

    const blob = await response.blob();
    return new File([blob], name, { type: blob.type || 'image/png' });
  };

  const selectCanvasReferenceImage = async (src: string, name: string, generatedImageId?: string) => {
    setImageSrc(src);
    setAnnotations([]);
    setSelectedAssetName(null);
    setSelectedGeneratedImageId(generatedImageId ?? null);

    try {
      setReferenceImage(await loadReferenceImageFromSrc(src, name));
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Could not load selected image as a reference.');
    }
  };

  const handleDeleteGeneratedImage = (imageId: string) => {
    setGeneratedImages((current) => current.filter((image) => image.id !== imageId));
    if (selectedGeneratedImageId === imageId) {
      setSelectedGeneratedImageId(null);
      setImageSrc(null);
      setReferenceImage(null);
      setAnnotations([]);
    }
  };

  const getCanvasPoint = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.min(Math.max(((event.clientX - rect.left) / rect.width) * CANVAS_SIZE, 0), CANVAS_SIZE),
      y: Math.min(Math.max(((event.clientY - rect.top) / rect.height) * CANVAS_SIZE, 0), CANVAS_SIZE),
    };
  };

  const getAnnotationRect = (annotation: DraftAnnotation): Omit<AnnotationRect, 'id'> => {
    const x = Math.min(annotation.startX, annotation.currentX);
    const y = Math.min(annotation.startY, annotation.currentY);

    return {
      x,
      y,
      width: Math.abs(annotation.currentX - annotation.startX),
      height: Math.abs(annotation.currentY - annotation.startY),
    };
  };

  const handleAnnotationStart = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isAnnotating || !imageSrc) return;

    event.preventDefault();
    const point = getCanvasPoint(event);
    setAnnotations([]);
    setDraftAnnotation({
      startX: point.x,
      startY: point.y,
      currentX: point.x,
      currentY: point.y,
    });
  };

  const handleAnnotationMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!draftAnnotation) return;

    const point = getCanvasPoint(event);
    setDraftAnnotation((current) => current ? { ...current, currentX: point.x, currentY: point.y } : current);
  };

  const handleAnnotationEnd = () => {
    if (!draftAnnotation) return;

    const rect = getAnnotationRect(draftAnnotation);
    setDraftAnnotation(null);

    if (rect.width < MIN_ANNOTATION_SIZE || rect.height < MIN_ANNOTATION_SIZE) return;

    setIsAnnotating(false);
    setAnnotations((current) => [
      ...current,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        ...rect,
      },
    ]);
  };

  const downloadHref = (href: string, filename: string) => {
    const link = document.createElement('a');
    link.href = href;
    link.download = filename;
    link.click();
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    downloadHref(url, filename);
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const loadImageForCanvas = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new window.Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Could not load image for export.'));
      image.src = src;
    });

  const createAnnotatedImageBlob = async (src: string, imageAnnotations: AnnotationRect[]) => {
    const sourceImage = await loadImageForCanvas(src);
    const imageWidth = sourceImage.naturalWidth || CANVAS_SIZE;
    const imageHeight = sourceImage.naturalHeight || CANVAS_SIZE;
    const displayedImageWidth = CANVAS_SIZE;
    const displayedImageHeight = (imageHeight / imageWidth) * displayedImageWidth;
    const displayedImageX = (CANVAS_SIZE - displayedImageWidth) / 2;
    const displayedImageY = (CANVAS_SIZE - displayedImageHeight) / 2;
    const scaleX = imageWidth / displayedImageWidth;
    const scaleY = imageHeight / displayedImageHeight;
    const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
    const canvas = document.createElement('canvas');
    canvas.width = imageWidth;
    canvas.height = imageHeight;

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not create canvas context.');

    context.drawImage(sourceImage, 0, 0, imageWidth, imageHeight);
    imageAnnotations.forEach((annotation) => {
      const x = clamp((annotation.x - displayedImageX) * scaleX, 0, imageWidth);
      const y = clamp((annotation.y - displayedImageY) * scaleY, 0, imageHeight);
      const width = clamp(annotation.width * scaleX, 0, imageWidth - x);
      const height = clamp(annotation.height * scaleY, 0, imageHeight - y);

      context.strokeStyle = 'rgb(239, 68, 68)';
      context.lineWidth = 2;
      context.strokeRect(x, y, width, height);
    });

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error('Could not export annotated image.'));
      }, 'image/png');
    });
  };

  const handleDownloadImage = async (src = imageSrc) => {
    if (!src) return;

    try {
      const response = await fetch(src);
      if (!response.ok) throw new Error('Could not fetch image.');
      downloadBlob(await response.blob(), 'design-image.png');
    } catch {
      downloadHref(src, 'design-image.png');
    }
  };

  const handleDownloadAnnotatedImage = async () => {
    if (!imageSrc) return;

    try {
      downloadBlob(await createAnnotatedImageBlob(imageSrc, annotations), 'design-image-annotated.png');
    } catch (err: any) {
      setError(err.message || 'Could not export annotated image.');
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    const apiKey = getApiKey();
    if (!apiKey) {
      setSettingsOpen(true);
      setError('Add your OpenAI API key before generating an image.');
      return;
    }

    setError(null);
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const submittedPrompt = prompt.trim();
    const requestClient = selectedClient;
    const requestReferenceImage = referenceImage;
    const requestAdditionalImage = additionalImage;
    const requestLayoutReferenceImages = [...layoutReferenceImages];
    const requestImageSrc = imageSrc;
    const requestAnnotations = [...annotations];
    const hasAnnotations = !!requestImageSrc && requestAnnotations.length > 0;
    const layoutReferencePrompt = requestLayoutReferenceImages.length
      ? `\n\nLayout reference: Use the ${requestLayoutReferenceImages.length} uploaded layout reference image${requestLayoutReferenceImages.length === 1 ? '' : 's'} to guide the section structure and composition.`
      : '';
    const apiPrompt = `${DESIGN_SYSTEM_PROMPT}${layoutReferencePrompt}\n\nUser request: ${submittedPrompt}`;

    setImageSrc(null);
    setAnnotations([]);
    setSelectedAssetName(null);
    setSelectedGeneratedImageId(requestId);
    setGeneratedImages((current) => [
      {
        id: requestId,
        prompt: submittedPrompt,
        status: 'pending',
      },
      ...current,
    ]);

    try {
      const designSystemImage = await loadDesignSystemImage(requestClient);
      const annotatedReferenceImage = hasAnnotations && requestImageSrc
        ? new File([await createAnnotatedImageBlob(requestImageSrc, requestAnnotations)], `annotated-reference-${requestId}.png`, { type: 'image/png' })
        : null;
      const response = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: (() => {
          const formData = new FormData();
          formData.append('model', getImageModel());
          formData.append('prompt', apiPrompt);
          formData.append('size', '1024x1024');
          formData.append('image[]', designSystemImage, `system-prompt-${DESIGN_SYSTEM_IMAGE.name}`);
          if (annotatedReferenceImage) {
            formData.append('image[]', annotatedReferenceImage);
          } else if (requestReferenceImage) {
            formData.append('image[]', requestReferenceImage);
          }
          if (requestAdditionalImage) {
            formData.append('image[]', requestAdditionalImage);
          }
          requestLayoutReferenceImages.forEach((image, index) => {
            formData.append('image[]', image, `layout-reference-${index + 1}-${image.name}`);
          });
          return formData;
        })(),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`OpenAI image API error (${response.status}): ${body}`);
      }

      const json = await response.json();
      const image = json.data?.[0];
      const nextImageSrc = image?.b64_json ? `data:image/png;base64,${image.b64_json}` : image?.url;

      if (!nextImageSrc) {
        throw new Error('OpenAI did not return an image.');
      }

      setGeneratedImages((current) =>
        current.map((image) => image.id === requestId ? { ...image, src: nextImageSrc, status: 'completed' } : image)
      );
      setSelectedGeneratedImageId((currentSelectedId) => {
        if (currentSelectedId !== requestId) return currentSelectedId;

        setImageSrc(nextImageSrc);
        setAnnotations([]);
        loadReferenceImageFromSrc(nextImageSrc, `generated-${requestId}.png`)
          .then((nextReferenceImage) => {
            setReferenceImage(nextReferenceImage);
            setError(null);
          })
          .catch((err: any) => {
            setError(err.message || 'Could not load generated image as a reference.');
          });

        return currentSelectedId;
      });
    } catch (err: any) {
      const message = err.message || 'Failed to generate image.';
      setError(message);
      setGeneratedImages((current) =>
        current.map((image) => image.id === requestId ? { ...image, status: 'error', error: message } : image)
      );
    }
  };

  return (
    <Layout config={config} menu={menu} current={current} metadata={metadata} fullBleed>
      <TooltipProvider>
        <div className="flex h-full min-h-0 flex-col">
          <div className="relative flex h-12 shrink-0 items-center border-b bg-muted/30 px-2">
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => layoutReferenceInputRef.current?.click()}>
                    <LayoutTemplate className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Layout reference</TooltipContent>
              </Tooltip>
              <Input
                ref={layoutReferenceInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                onChange={(event) => handleAddLayoutReferences(event.target.files)}
                className="hidden"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 w-8 p-0 ${isAnnotating ? 'bg-foreground text-background hover:bg-foreground hover:text-background' : ''}`}
                    onClick={() => setIsAnnotating((current) => !current)}
                  >
                    <SquareDashedMousePointer className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">{isAnnotating ? 'Disable' : 'Select area'}</TooltipContent>
              </Tooltip>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Select value={selectedClient} onValueChange={(value) => handleClientChange(value as DesignClient)}>
                <SelectTrigger className="h-8 w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  {DESIGN_CLIENTS.map((client) => (
                    <SelectItem key={client} value={client}>
                      {client}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex min-h-0 flex-1">
            <aside className="flex w-40 shrink-0 flex-col border-r bg-background">
              <div className="border-b px-3 py-3">
                <h2 className="text-xs font-semibold">Design Library</h2>
              </div>
              <div className="flex-1 space-y-2 overflow-visible p-3">
                {DESIGN_ASSETS.map((asset) => (
                  <button
                    key={asset.name}
                    type="button"
                    onClick={() => handleSelectAsset(asset)}
                    className="group relative block w-full rounded-md border bg-muted/20 p-1 text-left transition hover:border-primary data-[selected=true]:border-primary"
                    data-selected={selectedAssetName === asset.name}
                    title={asset.name}
                  >
                    <Image
                      src={getDesignAssetSrc(selectedClient, asset.name)}
                      alt={asset.name}
                      width={128}
                      height={128}
                      unoptimized
                      className="h-auto w-full rounded"
                    />
                    <div className="pointer-events-none absolute left-full top-0 z-50 ml-3 hidden w-96 rounded-lg border bg-background p-2 shadow-xl group-hover:block">
                      <Image
                        src={getDesignAssetSrc(selectedClient, asset.name)}
                        alt={asset.name}
                        width={512}
                        height={512}
                        unoptimized
                        className="h-auto w-full rounded"
                      />
                    </div>
                    <span className="mt-1 block truncate px-1 text-xs text-muted-foreground">{asset.name}</span>
                  </button>
                ))}
              </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-auto p-6">
              <div className="relative flex min-h-0 flex-1 overflow-hidden rounded-lg border bg-muted/20">
                <TransformWrapper
                  initialScale={0.75}
                  minScale={0.25}
                  maxScale={4}
                  centerOnInit
                  limitToBounds={false}
                  panning={{ disabled: isAnnotating }}
                  wheel={{ step: 0.08 }}
                  doubleClick={{ mode: 'reset' }}
                >
                  {({ zoomIn, zoomOut, resetTransform }) => (
                    <>
                      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 rounded-md border bg-background/95 p-1 shadow-sm">
                        <Button variant="ghost" size="sm" className="h-8 w-8 px-0" onClick={() => zoomOut()} aria-label="Zoom out">
                          <ZoomOutIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 px-0" onClick={() => resetTransform()} aria-label="Reset zoom">
                          <RotateCcwIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 px-0" onClick={() => zoomIn()} aria-label="Zoom in">
                          <ZoomInIcon className="h-4 w-4" />
                        </Button>
                      </div>

                      <TransformComponent wrapperClass="!h-full !w-full" contentClass="!h-fit !w-fit">
                        <div
                          className={`relative flex h-[1024px] w-[1024px] items-center justify-center p-8 ${isAnnotating ? 'cursor-crosshair' : ''}`}
                          onMouseDown={handleAnnotationStart}
                          onMouseMove={handleAnnotationMove}
                          onMouseUp={handleAnnotationEnd}
                          onMouseLeave={handleAnnotationEnd}
                          style={{
                            backgroundImage: 'radial-gradient(hsl(var(--border)) 1px, transparent 1px)',
                            backgroundSize: '18px 18px',
                          }}
                        >
                          {imageSrc ? (
                            <Image
                              src={imageSrc}
                              alt={prompt || 'Generated design'}
                              width={1024}
                              height={1024}
                              unoptimized
                              className="h-auto w-[1024px] max-w-none rounded-md bg-background object-contain shadow-lg"
                            />
                          ) : (
                            <div className="rounded-md border border-dashed bg-background/80 px-4 py-3 text-sm text-muted-foreground shadow-sm">
                              Generated design will appear here.
                            </div>
                          )}
                          {annotations.map((annotation) => (
                            <div
                              key={annotation.id}
                              className="pointer-events-none absolute border-2 border-dashed border-blue-500 bg-blue-500/10"
                              style={{
                                left: annotation.x,
                                top: annotation.y,
                                width: annotation.width,
                                height: annotation.height,
                              }}
                            />
                          ))}
                          {draftAnnotation ? (
                            <div
                              className="pointer-events-none absolute border-2 border-dashed border-blue-500 bg-blue-500/10"
                              style={{
                                left: getAnnotationRect(draftAnnotation).x,
                                top: getAnnotationRect(draftAnnotation).y,
                                width: getAnnotationRect(draftAnnotation).width,
                                height: getAnnotationRect(draftAnnotation).height,
                              }}
                            />
                          ) : null}
                        </div>
                      </TransformComponent>
                    </>
                  )}
                </TransformWrapper>
              </div>

              <div className="space-y-3">
                {referenceImage ? <p className="text-xs text-muted-foreground">Reference: {selectedAssetName || referenceImage.name}</p> : null}
                {additionalImage ? <p className="text-xs text-muted-foreground">Additional image: {additionalImage.name}</p> : null}

                {error ? <p className="text-sm text-destructive">{error}</p> : null}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && handleGenerate()}
                    placeholder={
                      annotations.length > 0
                        ? "Describe changes to the 'selected area' and how it affects rest of the design"
                        : 'Describe your design...'
                    }
                  />
                  <div className="flex gap-3 sm:max-w-80">
                    <Input
                      ref={referenceImageInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(event) => {
                        setAdditionalImage(event.target.files?.[0] ?? null);
                      }}
                      className="sm:max-w-64"
                    />
                    <Button variant="outline" onClick={handleClearAdditionalImage} disabled={!additionalImage} aria-label="Clear additional image">
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button onClick={handleGenerate} disabled={!prompt.trim()}>
                    Generate
                  </Button>
                  <Button variant="outline" onClick={() => setSettingsOpen(true)}>
                    <KeyIcon className="mr-2 h-4 w-4" />
                    API Key
                  </Button>
                </div>
              </div>
            </div>

            <aside className="flex w-40 shrink-0 flex-col border-l bg-background">
              <div className="border-b px-3 py-3">
                <h2 className="text-sm font-semibold">New Designs</h2>
                <p className="text-xs text-muted-foreground">{generatedImages.length} this session</p>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                {generatedImages.length > 0 ? (
                  generatedImages.map((image) => (
                    <div
                      key={image.id}
                      className="group relative"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedGeneratedImageId(image.id);
                          setSelectedAssetName(null);
                          setAnnotations([]);
                          if (image.src) {
                            selectCanvasReferenceImage(image.src, `generated-${image.id}.png`, image.id);
                          } else {
                            setImageSrc(null);
                          }
                        }}
                        className="block w-full rounded-md border bg-muted/20 p-1 text-left transition hover:border-primary data-[selected=true]:border-primary disabled:cursor-default disabled:hover:border-border"
                        title={image.error || image.prompt}
                        data-selected={selectedGeneratedImageId === image.id}
                      >
                        {image.status === 'completed' && image.src ? (
                          <Image
                            src={image.src}
                            alt={image.prompt || 'Generated design thumbnail'}
                            width={128}
                            height={128}
                            unoptimized
                            className="aspect-square w-full rounded object-cover"
                          />
                        ) : (
                          <div
                            className={`aspect-square w-full rounded ${image.status === 'error' ? 'bg-destructive/10' : 'animate-pulse bg-muted'
                              }`}
                          />
                        )}
                      </button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute right-1.5 top-1.5 h-6 w-6 p-0 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                        onClick={() => handleDeleteGeneratedImage(image.id)}
                        aria-label="Delete generated image"
                      >
                        <Trash2Icon className="h-3.5 w-3.5" />
                      </Button>
                      {image.src ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="absolute bottom-1.5 right-1.5 h-6 w-6 p-0 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                          onClick={() => handleDownloadImage(image.src)}
                          aria-label="Save generated image"
                        >
                          <DownloadIcon className="h-3.5 w-3.5" />
                        </Button>
                      ) : null}
                    </div>
                  ))
                ) : null}
              </div>
            </aside>
          </div>
        </div>

        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent className="w-full max-w-[min(42rem,calc(100vw-2rem))]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyIcon className="h-5 w-5" />
                OpenAI API Key
              </DialogTitle>
              <DialogDescription>Configure your OpenAI API key to get started.</DialogDescription>
            </DialogHeader>
            <ApiKeySettings onConfigured={() => setSettingsOpen(false)} />
          </DialogContent>
        </Dialog>

      </TooltipProvider>
    </Layout>
  );
};

export default DesignPage;
