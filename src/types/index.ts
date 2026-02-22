/**
 * Core Type Definitions for Star Map Application
 */

// ==================== Star System Types ====================

/**
 * Represents the count of stars in the scene
 */
export interface StarCounts {
    /** Total number of stars rendered */
    total: number;
  }
  
  /**
   * 2D position coordinates
   */
  export interface Position2D {
    x: number;
    y: number;
  }
  
  /**
   * 3D position coordinates
   */
  export interface Position3D {
    x: number;
    y: number;
    z: number;
  }
  
  /**
   * Rotation state for the star field
   */
  export interface Rotation {
    /** Rotation around X-axis (vertical) in radians */
    x: number;
    /** Rotation around Y-axis (horizontal) in radians */
    y: number;
  }
  
  /**
   * Star color representation (RGB, 0-1 range)
   */
  export interface StarColor {
    r: number;
    g: number;
    b: number;
  }
  
  /**
   * Configuration for star generation
   */
  export interface StarConfig {
    /** Total number of stars to generate */
    count: number;
    /** Radius of the sphere containing stars */
    radius: number;
    /** Minimum star size */
    minSize: number;
    /** Maximum star size */
    maxSize: number;
  }
  
  /**
   * Color distribution for star types
   */
  export interface StarColorDistribution {
    /** Percentage of hot blue-white stars (0-1) */
    blueWhite: number;
    /** Percentage of white stars (0-1) */
    white: number;
    /** Percentage of yellow-white stars (0-1) */
    yellowWhite: number;
    /** Percentage of yellow-orange stars (0-1) */
    yellowOrange: number;
    /** Percentage of red-orange stars (0-1) */
    redOrange: number;
  }
  
  // ==================== Component Props ====================
  
  /**
   * Props for the StarMap component
   */
  export interface StarMapProps {
    /** Callback fired when star count is updated */
    onStarCountUpdate?: (counts: StarCounts) => void;
    /** Custom star configuration */
    config?: Partial<StarConfig>;
    /** Whether to show loading state */
    showLoading?: boolean;
  }
  
  /**
   * Props for the InfoPanel component
   */
  export interface InfoPanelProps {
    /** Number of stars currently rendered */
    starCount: number;
    /** Whether the application is loading */
    loading: boolean;
    /** Optional custom title */
    title?: string;
  }
  
  /**
   * Props for the LoadingOverlay component
   */
  export interface LoadingOverlayProps {
    /** Whether the overlay is visible */
    visible: boolean;
    /** Loading message to display */
    message?: string;
    /** Secondary message */
    submessage?: string;
  }
  
  // ==================== Event Types ====================
  
  /**
   * Mouse position from event
   */
  export type MousePosition = Position2D;
  
  /**
   * Touch position from event
   */
  export type TouchPosition = Position2D;
  
  // ==================== Utility Types ====================
  
  /**
   * Callback function type for star count updates
   */
  export type StarCountCallback = (counts: StarCounts) => void;
  
  /**
   * Cleanup function type
   */
  export type CleanupFunction = () => void;
  
  /**
   * Animation frame request ID
   */
  export type AnimationFrameId = number;
  
  // ==================== Constants ====================
  
  /**
   * Default star configuration
   */
  export const DEFAULT_STAR_CONFIG: StarConfig = {
    count: 15000,
    radius: 800,
    minSize: 0.3,
    maxSize: 4.5,
  };
  
  /**
   * Default color distribution
   */
  export const DEFAULT_COLOR_DISTRIBUTION: StarColorDistribution = {
    blueWhite: 0.05,
    white: 0.10,
    yellowWhite: 0.20,
    yellowOrange: 0.30,
    redOrange: 0.35,
  };
  
  // ==================== Enums ====================
  
  /**
   * Star size categories
   */
  export enum StarSizeCategory {
    BRIGHT = 'bright',
    MEDIUM = 'medium',
    DIM = 'dim',
  }
  
  /**
   * Star color types
   */
  export enum StarColorType {
    BLUE_WHITE = 'blue-white',
    WHITE = 'white',
    YELLOW_WHITE = 'yellow-white',
    YELLOW_ORANGE = 'yellow-orange',
    RED_ORANGE = 'red-orange',
  }
  
  // ==================== Type Guards ====================
  
  /**
   * Type guard to check if a value is a valid Position2D
   */
  export function isPosition2D(value: unknown): value is Position2D {
    return (
      typeof value === 'object' &&
      value !== null &&
      'x' in value &&
      'y' in value &&
      typeof (value as Position2D).x === 'number' &&
      typeof (value as Position2D).y === 'number'
    );
  }
  
  /**
   * Type guard to check if a value is a valid StarCounts
   */
  export function isStarCounts(value: unknown): value is StarCounts {
    return (
      typeof value === 'object' &&
      value !== null &&
      'total' in value &&
      typeof (value as StarCounts).total === 'number'
    );
  }