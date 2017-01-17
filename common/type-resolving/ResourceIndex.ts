import { DeclarationInfo } from './';

/**
 * Type for the reverse index of all declarations
 */
export type ResourceIndex = { [declaration: string]: DeclarationInfo[] };
