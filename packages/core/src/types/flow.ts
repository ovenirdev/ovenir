/**
 * A step in a flow pipeline
 */
export interface FlowStep {
  /** Tool ID to execute */
  toolId: string;

  /** i18n key for step label */
  labelKey: string;

  /** Map previous step output to this step input */
  inputMapping?: Record<string, string>;
}

/**
 * Flow metadata
 */
export interface FlowMeta {
  /** Unique identifier (kebab-case) */
  id: string;

  /** i18n key for flow name */
  nameKey: string;

  /** i18n key for description */
  descriptionKey: string;

  /** Flow icon */
  icon: string;

  /** Tags for search */
  tags: string[];

  /** Is this flow stable? */
  status: 'stable' | 'beta' | 'experimental';
}

/**
 * Flow definition - a pipeline of tools
 */
export interface Flow {
  /** Flow metadata */
  meta: FlowMeta;

  /** Ordered list of steps */
  steps: FlowStep[];
}

/**
 * Flow execution state
 */
export interface FlowState {
  /** Current step index */
  currentStep: number;

  /** Results from each completed step */
  stepResults: Array<{
    toolId: string;
    input: unknown;
    output: unknown;
    durationMs: number;
  }>;

  /** Overall status */
  status: 'idle' | 'running' | 'completed' | 'error';

  /** Error message if status is 'error' */
  error?: string;
}
