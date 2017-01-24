import { join, normalize, parse, relative, resolve } from 'path';
import { Initializable } from '../Initializable';
import { TsResourceParser } from '../parsing/TsResourceParser';
import { ServerConnection } from '../ServerConnection';
import { Logger } from '../utilities/Logger';
import { SpecificLogger } from '../utilities/SpecificLogger';
import { injectable } from 'inversify';
import {
    DeclarationInfo,
    ExtensionConfig,
    ModuleDeclaration,
    NOTIFICATIONS,
    ResolveIndex,
    ResourceIndex,
    TsAllFromExport,
    TsAssignedExport,
    TsExportableDeclaration,
    TsFile,
    TsFromExport,
    TsNamedFromExport,
    TsNamedResource,
    TsResource,
    TsTypedExportableDeclaration
} from 'typescript-hero-common';
import { InitializeParams, FileEvent, FileChangeType } from 'vscode-languageserver';

type Resources = { [name: string]: TsResource };

/**
 * Returns the name of the node folder. Is used as the library name for indexing.
 * (e.g. ./node_modules/webpack returns webpack)
 * 
 * @param {string} path
 * @returns {string}
 */
function getNodeLibraryName(path: string): string {
    let dirs = path.split(/\/|\\/),
        nodeIndex = dirs.indexOf('node_modules');

    return dirs.slice(nodeIndex + 1).join('/')
        .replace(/([.]d)?([.]tsx?)?/g, '')
        .replace(new RegExp(`/(index|${dirs[nodeIndex + 1]})$`), '');
}

/**
 * TODO
 * 
 * @export
 * @class ResolveIndex
 * @implements {Initializable}
 */
@injectable()
export class ServerResolveIndex implements Initializable, ResolveIndex {
    private configuration: ExtensionConfig;
    private logger: SpecificLogger;
    private connection: ServerConnection;
    private rootUri: string | null;

    private parsedResources: Resources = Object.create(null);
    private _index: ResourceIndex | undefined;

    /**
     * Reverse index of the declarations.
     * 
     * @readonly
     * @type {ResourceIndex}
     * @memberOf ResolveIndex
     */
    public get index(): ResourceIndex | undefined {
        return this._index;
    }

    /**
     * List of all declaration information. Contains the typescript declaration and the
     * "from" information (from where the symbol is imported). 
     * 
     * @readonly
     * @type {DeclarationInfo[]}
     * @memberOf ResolveIndex
     */
    public get declarationInfos(): DeclarationInfo[] {
        return Object
            .keys(this.index || {})
            .sort()
            .reduce((all, key) => all.concat(this.index![key]), <DeclarationInfo[]>[]);
    }

    constructor(logger: Logger, private parser: TsResourceParser) {
        this.logger = logger.createSpecificLogger('ServerResolveIndex');
    }

    /**
     * TODO
     * 
     * @param {ServerConnection} connection
     * @param {InitializeParams} params
     * 
     * @memberOf ResolveIndex
     */
    public initialize(connection: ServerConnection, params: InitializeParams): void {
        this.logger.info('initialize.');

        this.rootUri = params.rootUri;

        connection
            .onDidChangeConfiguration()
            .subscribe(config => this.configuration = config);
        connection
            .onNotification<string[]>(NOTIFICATIONS.ServerBuildIndexForFiles)
            .subscribe(files => this.buildIndex(files));
        connection
            .onDidChangeWatchedFiles()
            .subscribe(events => this.watchedFilesChange(events.changes));

        this.connection = connection;
    }

    /**
     * Indicator if the first index was loaded and calculated or not.
     * 
     * @readonly
     * @type {boolean}
     * @memberOf ResolveIndex
     */
    public get indexReady(): boolean {
        return !!this._index;
    }

    /**
     * Tells the index to build a new index.
     * Can be canceled with a cancellationToken.
     *
     * @param {string[]} filePathes
     * @returns {Promise<void>} true when the index was successful or sucessfully canceled
     * 
     * @memberOf ResolveIndex
     */
    public async buildIndex(filePathes: string[]): Promise<void> {
        this.logger.info('Starting index refresh.');

        try {
            this.logger.info(`Got ${filePathes.length} filepathes.`);
            let parsed = await this.parser.parseFiles(filePathes);
            this.parsedResources = await this.parseResources(parsed);
            this._index = await this.createIndex(this.parsedResources);
            this.connection.sendNotification(NOTIFICATIONS.ServerBuiltIndex, true);
            this.logger.info(
                `Parsed and indexed ${filePathes.length} files, found ${Object.keys(this._index).length} symbols.`
            );
        } catch (e) {
            this.logger.error('Catched an error during buildIndex()', e);
            this.connection.sendNotification(NOTIFICATIONS.ServerBuiltIndex, false);
        }
    }

    /**
     * Resets the whole index. Does delete everything. Period.
     * 
     * @memberOf ResolveIndex
     */
    public reset(): void {
        this.parsedResources = Object.create(null);
        this._index = undefined;
    }

    /**
     * TODO
     * 
     * @private
     * @param {FileEvent[]} events
     * 
     * @memberOf ServerResolveIndex
     */
    private async watchedFilesChange(events: FileEvent[]): Promise<void> {
        let filesToRebuild: string[] = [],
            resourcesToDelete: string[] = [];

        for (let fileEvent of events) {
            let rebuildResource = '',
                filePath = fileEvent.uri.replace('file://', '');

            if (fileEvent.type === FileChangeType.Changed) {
                rebuildResource = '/' + relative(this.rootUri || '', filePath).replace(/[.]tsx?/g, '');
                if (filesToRebuild.indexOf(filePath) < 0) {
                    filesToRebuild.push(filePath);
                }
            } else if (fileEvent.type === FileChangeType.Deleted) {
                let removeResource = '/' + relative(this.rootUri || '', filePath).replace(/[.]tsx?/g, '');
                if (resourcesToDelete.indexOf(removeResource) < 0) {
                    resourcesToDelete.push(removeResource);
                }
                rebuildResource = removeResource;
            }
            for (let file of this.getExportedResources(rebuildResource)) {
                if (filesToRebuild.indexOf(file) < 0) {
                    filesToRebuild.push(file);
                }
            }
        }

        this.logger.info('Files have changed, going to rebuild', {
            update: filesToRebuild,
            delete: resourcesToDelete
        });

        let resources = await this.parseResources(await this.parser.parseFiles(filesToRebuild));
        for (let del of resourcesToDelete) {
            delete this.parsedResources[del];
        }
        for (let key of Object.keys(resources)) {
            this.parsedResources[key] = resources[key];
        }
        this._index = await this.createIndex(this.parsedResources);
    }

    /**
     * Does parse the resources (symbols and declarations) of a given file.
     * Can be cancelled with the token.
     * 
     * @private
     * @param {TsFile[]} files
     * @returns {Promise<Resources>}
     * 
     * @memberOf ResolveIndex
     */
    private async parseResources(files: TsFile[] = []): Promise<Resources> {
        let parsedResources: Resources = Object.create(null);

        for (let file of files) {
            if (file.filePath.indexOf('typings') > -1 || file.filePath.indexOf('node_modules/@types') > -1) {
                for (let resource of file.resources) {
                    parsedResources[resource.getIdentifier()] = resource;
                }
            } else if (file.filePath.indexOf('node_modules') > -1) {
                let libname = getNodeLibraryName(file.filePath);
                parsedResources[libname] = file;
            } else {
                parsedResources[file.getIdentifier('')] = file;
            }
        }

        for (let key of Object.keys(parsedResources).sort((k1, k2) => k2.length - k1.length)) {
            let resource = parsedResources[key];
            resource.declarations = resource.declarations.filter(
                o => (o instanceof TsExportableDeclaration || o instanceof TsTypedExportableDeclaration) && o.isExported
            );
            this.processResourceExports(parsedResources, resource);
        }

        return parsedResources;
    }

    /**
     * Creates a reverse index out of the give resources.
     * Can be cancelled with the token.
     * 
     * @private
     * @param {Resources} resources
     * @param {CancellationToken} [cancellationToken]
     * @returns {Promise<ResourceIndex>}
     * 
     * @memberOf ResolveIndex
     */
    private async createIndex(
        resources: Resources
    ): Promise<ResourceIndex | undefined> {
        // Use an empty object without a prototype, so that "toString" (for example) can be indexed
        // Thanks to @gund in https://github.com/buehler/typescript-hero/issues/79
        let index: ResourceIndex = Object.create(null);

        for (let key of Object.keys(resources)) {
            let resource = resources[key];
            if (resource instanceof TsNamedResource) {
                if (!index[resource.name]) {
                    index[resource.name] = [];
                }
                index[resource.name].push({
                    declaration: new ModuleDeclaration(resource.getNamespaceAlias(), resource.start, resource.end),
                    from: resource.name
                });
            }
            for (let declaration of resource.declarations) {
                if (!index[declaration.name]) {
                    index[declaration.name] = [];
                }
                let from = key.replace(/[/]?index$/, '') || '/';
                if (!index[declaration.name].some(
                    o => o.declaration.constructor === declaration.constructor && o.from === from
                )) {
                    index[declaration.name].push({
                        declaration,
                        from
                    });
                }
            }
        }
        return index;
    }

    /**
     * Process all exports of a the parsed resources. Does move the declarations accordingly to their
     * export nature.
     * 
     * @private
     * @param {Resources} parsedResources
     * @param {TsResource} resource
     * @returns {void}
     * 
     * @memberOf ResolveIndex
     */
    private processResourceExports(
        parsedResources: Resources,
        resource: TsResource,
        processedResources: TsResource[] = []
    ): void {
        if (processedResources.indexOf(resource) >= 0) {
            return;
        }
        processedResources.push(resource);

        for (let ex of resource.exports) {
            if (resource instanceof TsFile && ex instanceof TsFromExport) {
                if (!ex.from) {
                    return;
                }

                let sourceLib = resolve(resource.parsedPath.dir, ex.from);
                if (sourceLib.indexOf('node_modules') > -1) {
                    sourceLib = getNodeLibraryName(sourceLib);
                } else {
                    sourceLib = '/' + relative(this.rootUri || '', sourceLib).replace(/([.]d)?[.]tsx?/g, '');
                }

                if (!parsedResources[sourceLib]) {
                    return;
                }

                let exportedLib = parsedResources[sourceLib];
                this.processResourceExports(parsedResources, exportedLib, processedResources);

                if (ex instanceof TsAllFromExport) {
                    this.processAllFromExport(parsedResources, resource, exportedLib);
                } else if (ex instanceof TsNamedFromExport) {
                    this.processNamedFromExport(parsedResources, ex, resource, exportedLib);
                }
            } else {
                if (ex instanceof TsAssignedExport) {
                    for (let lib of ex.exported.filter(
                        o => !(o instanceof TsExportableDeclaration) && !(o instanceof TsTypedExportableDeclaration))
                    ) {
                        this.processResourceExports(parsedResources, lib as TsResource, processedResources);
                    }
                    this.processAssignedExport(parsedResources, ex, resource);
                } else if (ex instanceof TsNamedFromExport && ex.from && parsedResources[ex.from]) {
                    this.processResourceExports(parsedResources, parsedResources[ex.from], processedResources);
                    this.processNamedFromExport(parsedResources, ex, resource, parsedResources[ex.from]);
                }
            }
        }
    }

    /**
     * Processes an all export, does move the declarations accordingly.
     * (i.e. export * from './myFile')
     * 
     * @private
     * @param {Resources} parsedResources
     * @param {TsResource} exportingLib
     * @param {TsResource} exportedLib
     * 
     * @memberOf ResolveIndex
     */
    private processAllFromExport(parsedResources: Resources, exportingLib: TsResource, exportedLib: TsResource): void {
        exportingLib.declarations.push(...exportedLib.declarations);
        exportedLib.declarations = [];
    }

    /**
     * Processes a named export, does move the declarations accordingly.
     * (i.e. export {MyClass} from './myFile')
     * 
     * @private
     * @param {Resources} parsedResources
     * @param {TsNamedFromExport} tsExport
     * @param {TsResource} exportingLib
     * @param {TsResource} exportedLib
     * 
     * @memberOf ResolveIndex
     */
    private processNamedFromExport(
        parsedResources: Resources,
        tsExport: TsNamedFromExport,
        exportingLib: TsResource,
        exportedLib: TsResource
    ): void {
        exportedLib.declarations
            .forEach(o => {
                let ex = tsExport.specifiers.find(s => s.specifier === o.name);
                if (!ex) {
                    return;
                }
                exportedLib.declarations.splice(exportedLib.declarations.indexOf(o), 1);
                if (ex.alias) {
                    o.name = ex.alias;
                }
                exportingLib.declarations.push(o);
            });
    }

    /**
     * Processes an assigned export, does move the declarations accordingly.
     * (i.e. export = namespaceName)
     * 
     * @private
     * @param {Resources} parsedResources
     * @param {TsAssignedExport} tsExport
     * @param {TsResource} exportingLib
     * 
     * @memberOf ResolveIndex
     */
    private processAssignedExport(
        parsedResources: Resources,
        tsExport: TsAssignedExport,
        exportingLib: TsResource
    ): void {
        tsExport.exported.forEach(exported => {
            if (exported instanceof TsExportableDeclaration || exported instanceof TsTypedExportableDeclaration) {
                exportingLib.declarations.push(exported);
            } else {
                exportingLib.declarations.push(
                    ...exported.declarations.filter(
                        o => (o instanceof TsExportableDeclaration || o instanceof TsTypedExportableDeclaration) &&
                            o.isExported
                    )
                );
                exported.declarations = [];
            }
        });
    }

    /**
     * Returns a list of files that export a certain resource (declaration).
     * 
     * @private
     * @param {string} resourceToCheck
     * @returns {string[]}
     * 
     * @memberOf ResolveIndex
     */
    private getExportedResources(resourceToCheck: string): string[] {
        if (!this.parsedResources) {
            return [];
        }
        let resources: string[] = [];
        Object
            .keys(this.parsedResources)
            .filter(o => o.startsWith('/'))
            .forEach(key => {
                let resource = this.parsedResources![key] as TsFile;
                if (this.doesExportResource(resource, resourceToCheck)) {
                    resources.push(resource.filePath);
                }
            });
        return resources;
    }

    /**
     * Checks if a file does export another resource.
     * (i.e. export ... from ...)
     * 
     * @private
     * @param {TsFile} resource - The file that is checked
     * @param {string} resourcePath - The resource that is searched for
     * @returns {boolean}
     * 
     * @memberOf ResolveIndex
     */
    private doesExportResource(resource: TsFile, resourcePath: string): boolean {
        let exportsResource = false;

        for (let ex of resource.exports) {
            if (exportsResource) {
                break;
            }
            if (ex instanceof TsAllFromExport || ex instanceof TsNamedFromExport) {
                let exported = '/' + relative(
                    this.rootUri || '', normalize(join(resource.parsedPath.dir, ex.from || ''))
                );
                exportsResource = exported === resourcePath;
            }
        }

        return exportsResource;
    }
}
