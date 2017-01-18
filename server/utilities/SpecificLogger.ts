/**
 * TODO
 * 
 * @export
 * @interface SpecificLogger
 */
export interface SpecificLogger {
    /**
     * TODO
     * 
     * @param {string} message
     * @param {*} [data]
     * 
     * @memberOf SpecificLogger
     */
    info(message: string, data?: any): void;

    /**
     * TODO
     * 
     * @param {string} message
     * @param {*} [data]
     * 
     * @memberOf SpecificLogger
     */
    warning(message: string, data?: any): void;

    /**
     * TODO
     * 
     * @param {string} message
     * @param {*} [data]
     * 
     * @memberOf SpecificLogger
     */
    error(message: string, data?: any): void;
}
