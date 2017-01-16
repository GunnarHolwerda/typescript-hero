import { LogLevel } from '../models';
import { ResolverConfig, RestartDebuggerConfig } from './';

/**
 * Configuration interface for TypeScript Hero
 * Contains all exposed config endpoints.
 * 
 * @export
 * @interface ExtensionConfig
 */
export interface ExtensionConfig {
    /**
     * The actual log level.
     * 
     * @readonly
     * @type {LogLevel}
     * @memberOf ExtensionConfig
     */
    logLevel: LogLevel;

    /**
     * Configuration object for the resolver extension.
     * 
     * @readonly
     * @type {ResolverConfig}
     * @memberOf ExtensionConfig
     */
    resolver: ResolverConfig;

    /**
     * Configuration object for the restart debugger extension.
     * 
     * @readonly
     * @type {RestartDebuggerConfig}
     * @memberOf ExtensionConfig
     */
    restartDebugger: RestartDebuggerConfig;
}
