/**
 * TODO
 * 
 * @export
 * @interface PickableItem
 */
export interface PickableItem {
    /**
     * A human readable string which is rendered prominent.
     * 
     * @type {string}
     * @memberOf PickableItem
     */
    label: string;

    /**
     * A human readable string which is rendered less prominent.
     * 
     * @type {string}
     * @memberOf PickableItem
     */
    description: string;

    /**
     * A human readable string which is rendered less prominent.
     * 
     * @type {string}
     * @memberOf PickableItem
     */
    detail?: string;
}
