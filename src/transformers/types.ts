export type FoundationType = 'colors' | 'typography' | 'effects';

export type TokenType = 'css' | 'scss' | 'sd' | 'map' | 'default';

export type TokenDict = { [property: string]: string | [value: string, isSupportedCssProperty: boolean] | undefined };

export type BackgroundTokenDict = {
  [K in 'background']: TokenDict[K];
};

export type SpacingTokenDict = {
  [K in
    | 'padding-y'
    | 'padding-x'
    | 'padding-top'
    | 'padding-right'
    | 'padding-bottom'
    | 'padding-left'
    | 'padding-start'
    | 'padding-end'
    | 'spacing']: TokenDict[K];
};

export type BorderTokenDict = {
  [K in 'border-width' | 'border-radius' | 'border-color' | 'border-style']: TokenDict[K];
};

export type TypographyTokenDict = {
  [K in
    | 'font-family'
    | 'font-size'
    | 'font-weight'
    | 'line-height'
    | 'letter-spacing'
    | 'text-align'
    | 'text-decoration'
    | 'text-transform']: TokenDict[K];
};

export type FillTokenDict = {
  [K in 'color']: TokenDict[K];
};

export type EffectTokenDict = {
  [K in 'box-shadow']: TokenDict[K];
};

export type OpacityTokenDict = {
  [K in 'opacity']: TokenDict[K];
};

export type SizeTokenDict = {
  [K in 'width' | 'width-raw' | 'height' | 'height-raw']: SizeTokenDict[K];
};

export type KeyToTokenSetMap = {
  [K in keyof BackgroundTokenDict]: 'BACKGROUND';
} & {
  [K in keyof SpacingTokenDict]: 'SPACING';
} & {
  [K in keyof BorderTokenDict]: 'BORDER';
} & {
  [K in keyof TypographyTokenDict]: 'TYPOGRAPHY';
} & {
  [K in keyof FillTokenDict]: 'FILL';
} & {
  [K in keyof EffectTokenDict]: 'EFFECT';
} & {
  [K in keyof OpacityTokenDict]: 'OPACITY';
} & {
  [K in keyof SizeTokenDict]: 'SIZE';
};

export interface TransformerOutput {
  components: Record<string, string>;
  design: Record<FoundationType, string>;
  attachments?: Record<string, string>;
}

export interface Token {
  name: string;
  value: string;
  metadata: {
    part: string;
    cssProperty: string;
    reference?: string;
    isSupportedCssProperty: boolean;
    nameSegments: string[];
  };
}
