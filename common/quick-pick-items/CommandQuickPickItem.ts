import { TshCommand } from '../';
import { PickableItem } from './';

/**
 * Quickpick item that contains a typescript hero command that can be executed.
 * Those commands help executing tasks from the "gui" or from parts of the extension.
 * 
 * @export
 * @class CommandQuickPickItem
 * @implements {QuickPickItem}
 */
export class CommandQuickPickItem implements PickableItem {
    constructor(public label: string, public description: string, public detail: string, public command: TshCommand) { }
}
