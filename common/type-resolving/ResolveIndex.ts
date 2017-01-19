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
     * @returns {Promise<boolean>} true when the index was successful or sucessfully canceled
     * 
     * @memberOf ResolveIndex
     */
    buildIndex(filePathes: string[]): Promise<boolean>;

    /**
     * Rebuild the cache for one specific file. This can happen if a file is changed (saved)
     * and contains a new symbol. All resources are searched for files that possibly export
     * stuff from the given file and are rebuilt as well.
     * 
     * @param {string} filePath
     * @returns {Promise<boolean>}
     * 
     * @memberOf ResolveIndex
     */
    rebuildForFile(filePath: string): Promise<boolean>;

    /**
     * Removes the definitions and symbols for a specific file. This happens when
     * a file is deleted. All files that export symbols from this file are rebuilt as well.
     * 
     * @param {string} filePath
     * @returns {Promise<void>}
     * 
     * @memberOf ResolveIndex
     */
    removeForFile(filePath: string): Promise<boolean>;

    /**
     * Resets the whole index. Does delete everything. Period.
     * 
     * @memberOf ResolveIndex
     */
    reset(): void;
}
