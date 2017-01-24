import { DeclarationInfo, ResourceIndex } from './';

/**
 * TODO
 * 
 * @export
 * @interface ResolveIndex
 */
export interface ResolveIndex {
    readonly indexReady: boolean;
    readonly index: ResourceIndex | undefined;
    readonly declarationInfos: DeclarationInfo[];

    /**
     * Tells the index to build a new index.
     * 
     * @param {string[]} filePathes
     * @returns {Promise<void>}
     * 
     * @memberOf ResolveIndex
     */
    buildIndex(filePathes: string[]): Promise<void>;

    /**
     * Resets the whole index. Does delete everything. Period.
     * 
     * @memberOf ResolveIndex
     */
    reset(): void;
}
