/**
 * Shared type definitions and interfaces for the IDMS application
 */

/**
 * Common ID type used throughout the application
 */
export type ID = string | number;

/**
 * Address interface for location data
 */
export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
}

/**
 * User interface for authentication and user management
 */
export interface User {
  id: ID;
  name: string;
  email: string;
  roleIds?: ID[];
}

/**
 * Role interface for role-based access control
 */
export interface Role {
  id: ID;
  name: string;
  permissions?: string[];
}
