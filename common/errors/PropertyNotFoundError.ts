/**
 * Thrown when a property does not exist on a virtual class.
 * 
 * @export
 * @class PropertyNotFoundError
 * @extends {Error}
 */
export class PropertyNotFoundError extends Error {
    constructor(propName: string, parent?: string) {
        super();
        this.message = `The property "${propName}" was not found${parent ? ` in "${parent}"` : ''}.`;
    }
}
