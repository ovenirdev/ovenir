/**
 * Secret pattern definition
 */
export interface SecretPattern {
  /** Unique identifier */
  id: string;
  
  /** Human-readable name */
  name: string;
  
  /** Regex to detect the secret */
  pattern: RegExp;
  
  /** Severity level */
  severity: 'critical' | 'high' | 'medium' | 'low';
  
  /** Description of what this detects */
  description: string;
}

/**
 * All secret patterns
 * Order matters: more specific patterns should come first
 */
export const SECRET_PATTERNS: SecretPattern[] = [
  // AWS
  {
    id: 'aws-access-key',
    name: 'AWS Access Key',
    pattern: /AKIA[0-9A-Z]{16}/g,
    severity: 'critical',
    description: 'AWS Access Key ID',
  },
  {
    id: 'aws-secret-key',
    name: 'AWS Secret Key',
    pattern: /[0-9a-zA-Z/+]{40}/g,
    severity: 'critical',
    description: 'Potential AWS Secret Access Key',
  },

  // GitHub
  {
    id: 'github-pat',
    name: 'GitHub Personal Access Token',
    pattern: /ghp_[0-9a-zA-Z]{36}/g,
    severity: 'critical',
    description: 'GitHub Personal Access Token',
  },
  {
    id: 'github-oauth',
    name: 'GitHub OAuth Token',
    pattern: /gho_[0-9a-zA-Z]{36}/g,
    severity: 'critical',
    description: 'GitHub OAuth Access Token',
  },
  {
    id: 'github-app',
    name: 'GitHub App Token',
    pattern: /ghu_[0-9a-zA-Z]{36}|ghs_[0-9a-zA-Z]{36}/g,
    severity: 'critical',
    description: 'GitHub App Token',
  },

  // Google / GCP
  {
    id: 'gcp-api-key',
    name: 'Google API Key',
    pattern: /AIza[0-9A-Za-z\-_]{35}/g,
    severity: 'critical',
    description: 'Google Cloud Platform API Key',
  },

  // Stripe
  {
    id: 'stripe-secret',
    name: 'Stripe Secret Key',
    pattern: /sk_live_[0-9a-zA-Z]{24,}/g,
    severity: 'critical',
    description: 'Stripe Live Secret Key',
  },
  {
    id: 'stripe-publishable',
    name: 'Stripe Publishable Key',
    pattern: /pk_live_[0-9a-zA-Z]{24,}/g,
    severity: 'medium',
    description: 'Stripe Live Publishable Key',
  },

  // JWT
  {
    id: 'jwt',
    name: 'JSON Web Token',
    pattern: /eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/]*/g,
    severity: 'high',
    description: 'JSON Web Token (may contain sensitive claims)',
  },

  // Private Keys
  {
    id: 'private-key-rsa',
    name: 'RSA Private Key',
    pattern: /-----BEGIN RSA PRIVATE KEY-----/g,
    severity: 'critical',
    description: 'RSA Private Key header detected',
  },
  {
    id: 'private-key-openssh',
    name: 'OpenSSH Private Key',
    pattern: /-----BEGIN OPENSSH PRIVATE KEY-----/g,
    severity: 'critical',
    description: 'OpenSSH Private Key header detected',
  },
  {
    id: 'private-key-pem',
    name: 'PEM Private Key',
    pattern: /-----BEGIN PRIVATE KEY-----/g,
    severity: 'critical',
    description: 'PEM Private Key header detected',
  },

  // Database URLs
  {
    id: 'database-url',
    name: 'Database Connection String',
    pattern: /(mongodb|postgres|mysql|redis):\/\/[^\s'"]+/g,
    severity: 'critical',
    description: 'Database connection string with potential credentials',
  },

  // Generic API Keys
  {
    id: 'generic-api-key',
    name: 'Generic API Key',
    pattern: /api[_-]?key[_-]?[=:]["']?[0-9a-zA-Z]{16,}["']?/gi,
    severity: 'high',
    description: 'Generic API key pattern',
  },
  {
    id: 'generic-secret',
    name: 'Generic Secret',
    pattern: /secret[_-]?[=:]["']?[0-9a-zA-Z]{16,}["']?/gi,
    severity: 'high',
    description: 'Generic secret pattern',
  },

  // Credit Cards (basic Luhn-eligible patterns)
  {
    id: 'credit-card',
    name: 'Credit Card Number',
    pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
    severity: 'critical',
    description: 'Potential credit card number',
  },

  // Email (for PII detection)
  {
    id: 'email',
    name: 'Email Address',
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    severity: 'low',
    description: 'Email address (PII)',
  },

  // Phone numbers (international)
  {
    id: 'phone',
    name: 'Phone Number',
    pattern: /\+?[1-9]\d{1,14}/g,
    severity: 'low',
    description: 'Potential phone number (PII)',
  },
];
