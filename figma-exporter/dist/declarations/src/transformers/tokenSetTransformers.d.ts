import { Component } from "../exporters/components/extractor";
import { TokenSet } from "../exporters/components/types";
import { ExportableTransformerOptions } from "../types";
import { ValueProperty } from "./types";
export declare const getTokenSetTransformer: (tokenSet: TokenSet) => ((variableType: 'css' | 'scss', component: Component, part: string, tokenSet: TokenSet, options?: ExportableTransformerOptions) => Record<string, ValueProperty>) | undefined;
