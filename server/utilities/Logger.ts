import { Initializable } from '../Initializable';
import { ServerConnection } from '../ServerConnection';
import { SpecificLogger } from './SpecificLogger';
import { injectable } from 'inversify';
import { ExtensionConfig, LogLevel } from 'typescript-hero-common';
import * as util from 'util';
import { InitializeParams, MessageType } from 'vscode-languageserver';

type LogMessage = { message: string, type: MessageType, level: LogLevel, data: any };

/**
 * Returns the log level for a given verbosity string.
 * 
 * @param {string} verbosity
 * @returns {LogLevel}
 */
function getLogLevel(verbosity: string): LogLevel {
    switch (verbosity) {
        case 'Nothing':
            return LogLevel.Nothing;
        case 'Errors':
            return LogLevel.Errors;
        case 'All':
            return LogLevel.All;
        default:
            return LogLevel.Warnings;
    }
}

/**
 * Logger class for the server part. Does communicate with the client and sends specific log message
 * requests, when the client is configured as such.
 * 
 * @export
 * @class Logger
 * @implements {Initializable}
 */
@injectable()
export class Logger implements Initializable {
    private messageBuffer: LogMessage[] = [];
    private configuration: ExtensionConfig;
    private connection: ServerConnection;

    /**
     * Initialize the logger instance
     * 
     * @param {ServerConnection} connection
     * @param {InitializeParams} params
     * 
     * @memberOf Logger
     */
    public initialize(connection: ServerConnection, params: InitializeParams): void {
        this.info('Logger: initialize.');

        connection.onDidChangeConfiguration().subscribe(config => {
            this.configuration = config;
            this.trySendBuffer();
        });
        connection.onInitialized().subscribe(() => {
            this.info('Logger: initialized.');
            this.trySendBuffer();
        });

        this.connection = connection;
    }

    /**
     * TODO
     * 
     * @param {string} prefix
     * @returns {SpecificLogger}
     * 
     * @memberOf Logger
     */
    public createSpecificLogger(prefix: string): SpecificLogger {
        return {
            info: (message: string, data?: any) => this.info(`${prefix}: ${message}`, data),
            warning: (message: string, data?: any) => this.info(`${prefix}: ${message}`, data),
            error: (message: string, data?: any) => this.info(`${prefix}: ${message}`, data)
        };
    }

    /**
     * Logs an error message. Provided data is logged out after the message.
     * 
     * @param {string} message
     * @param {*} [data]
     * 
     * @memberOf Logger
     */
    public error(message: string, data?: any): void {
        this.log(LogLevel.Errors, MessageType.Error, message, data);
    }

    /**
     * Logs a warning message. Provided data is logged out after the message.
     * 
     * @param {string} message
     * @param {*} [data]
     * 
     * @memberOf Logger
     */
    public warning(message: string, data?: any): void {
        this.log(LogLevel.Warnings, MessageType.Warning, message, data);
    }

    /**
     * Logs an info message. Provided data is logged out after the message.
     * 
     * @param {string} message
     * @param {*} [data]
     * 
     * @memberOf Logger
     */
    public info(message: string, data?: any): void {
        this.log(LogLevel.All, MessageType.Info, message, data);
    }

    /**
     * Internal method to actually do the logging. Checks if the output should be done and logs
     * the data into the output channel and the console (if debugging).
     * 
     * @private
     * @param {LogLevel} level
     * @param {MessageType} type
     * @param {string} message
     * @param {*} [data]
     * 
     * @memberOf Logger
     */
    private log(level: LogLevel, type: MessageType, message: string, data?: any): void {
        if (this.configuration && getLogLevel(this.configuration.verbosity) >= level) {
            if (data) {
                message += `\n\tData:\t${util.inspect(data, {})}`;
            }
            this.connection.sendNotification('window/logMessage', { type, message });
        } else if (!this.configuration && this.messageBuffer) {
            this.messageBuffer.push({ level, type, message, data });
        }
    }

    /**
     * Tries to send the buffer (if one exists).
     * Is executed on initialized and config changes. Can only be called once, since the buffer is
     * destroyed afterwards to prevent memory leaks.
     * 
     * @private
     * 
     * @memberOf Logger
     */
    private trySendBuffer(): void {
        if (this.configuration && this.messageBuffer) {
            for (let {level, type, message, data} of [...this.messageBuffer]) {
                this.log(level, type, message, data);
            }
            delete this.messageBuffer;
        }
    }
}
