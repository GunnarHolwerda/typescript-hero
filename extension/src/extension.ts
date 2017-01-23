import { ClientConnection } from './utilities/ClientConnection';
import 'reflect-metadata';
import { createServerConnection } from './createServerConnection';
import { Injector } from './IoC';
import { TypeScriptHero } from './TypeScriptHero';
import { Disposable, ExtensionContext } from 'vscode';
import { LanguageClient } from 'vscode-languageclient/lib/main';

let extension: Disposable;

/**
 * Activates TypeScript Hero
 * 
 * @export
 * @param {ExtensionContext} context
 */
export async function activate(context: ExtensionContext): Promise<void> {
    if (Injector.isBound('context')) {
        Injector.unbind('context');
    }
    Injector.bind<ExtensionContext>('context').toConstantValue(context);
    Injector.bind(ClientConnection).toConstantValue(await createServerConnection(context));

    extension = Injector.get(TypeScriptHero);
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
