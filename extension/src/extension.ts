import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/lib/main';
import { join } from 'path';
import 'reflect-metadata';
import { Injector } from './IoC';
import { TypeScriptHero } from './TypeScriptHero';
import { Disposable, ExtensionContext } from 'vscode';

let extension: Disposable;

/**
 * Activates TypeScript Hero
 * 
 * @export
 * @param {ExtensionContext} context
 */
export function activate(context: ExtensionContext): void {
    if (Injector.isBound('context')) {
        Injector.unbind('context');
    }
    Injector.bind<ExtensionContext>('context').toConstantValue(context);
    extension = Injector.get(TypeScriptHero);

    let serverModule = context.asAbsolutePath(join('server', 'TypeScriptHeroServer.js')),
        debugOptions = { execArgv: ['--nolazy', '--debug=6004'] };

    let serverOptions: ServerOptions = {
        run: { module: serverModule, transport: TransportKind.ipc },
        debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
    };

    let clientOptions: LanguageClientOptions = {
        // Register the server for plain text documents
        documentSelector: ['typescript', 'typescriptreact'],
        synchronize: {
            // Synchronize the setting section 'languageServerExample' to the server
            configurationSection: 'typescriptHero'
        }
    };

    // Create the language client and start the client.
    let client = new LanguageClient(
        'typescriptHeroServer', 'TypeScript Hero Server', serverOptions, clientOptions
    );
    
    // Push the disposable to the context's subscriptions so that the 
    // client can be deactivated on extension deactivation
    context.subscriptions.push(client.start());
}

/**
 * Deactivates TypeScript Hero
 * 
 * @export
 */
export function deactivate(): void {
    extension.dispose();
    extension = null;
}
