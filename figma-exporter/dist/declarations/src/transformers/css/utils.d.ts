export interface AbstractComponent {
    componentType?: string;
    /**
     * Component theme (light, dark)
     */
    theme?: string;
    /**
     * Component type (primary, secondary, tertiary, etc.)
     */
    type?: string;
    /**
     * Component state (default, hover, disabled)
     */
    state?: string;
    /**
     * Component size (lg, md, sm, xs, ...)
     */
    size?: string;
    layout?: string;
}
export declare const getTypesFromComponents: (components: AbstractComponent[]) => string[];
export declare const getStatesFromComponents: (components: AbstractComponent[]) => string[];
export declare const getThemesFromComponents: (components: AbstractComponent[]) => string[];
export declare const getSizesFromComponents: (components: AbstractComponent[]) => string[];
