import { meta, config, inputSchema, outputSchema, type PasswordInput, type PasswordOutput } from './meta';

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

// Common word list for passphrases (EFF word list subset)
const WORDS = [
  'about', 'above', 'action', 'active', 'actual', 'after', 'again', 'agent',
  'alert', 'allow', 'among', 'angel', 'angle', 'angry', 'animal', 'apple',
  'arrow', 'audio', 'avoid', 'award', 'bacon', 'badge', 'basic', 'beach',
  'begin', 'being', 'below', 'bench', 'better', 'blade', 'blank', 'blast',
  'block', 'blood', 'board', 'brain', 'brand', 'brave', 'bread', 'break',
  'brick', 'brief', 'bring', 'broad', 'brown', 'brush', 'build', 'buyer',
  'cabin', 'cable', 'camel', 'candy', 'cargo', 'carry', 'catch', 'cause',
  'chain', 'chair', 'chalk', 'chaos', 'charm', 'chart', 'chase', 'cheap',
  'check', 'chess', 'chief', 'child', 'china', 'civil', 'claim', 'class',
  'clean', 'clear', 'clerk', 'click', 'climb', 'clock', 'close', 'cloud',
  'coach', 'coast', 'color', 'comet', 'comic', 'coral', 'count', 'court',
  'cover', 'craft', 'crane', 'crash', 'crazy', 'cream', 'crisp', 'cross',
  'crown', 'crush', 'cubic', 'curve', 'daily', 'dance', 'delta', 'depth',
  'digit', 'dirty', 'disco', 'doing', 'draft', 'dragon', 'drama', 'dream',
  'dress', 'drink', 'drive', 'droid', 'early', 'earth', 'eight', 'elite',
  'empty', 'enemy', 'enjoy', 'enter', 'equal', 'error', 'event', 'every',
  'exact', 'exist', 'extra', 'fable', 'facts', 'fairy', 'faith', 'fancy',
  'fatal', 'fault', 'feast', 'fence', 'fiber', 'field', 'fifth', 'fight',
  'final', 'first', 'flame', 'flash', 'fleet', 'float', 'flood', 'floor',
  'flour', 'fluid', 'focus', 'force', 'forge', 'forth', 'forum', 'found',
  'frame', 'frank', 'fresh', 'front', 'frost', 'fruit', 'gamma', 'gauge',
  'giant', 'given', 'glass', 'globe', 'glory', 'grace', 'grade', 'grain',
  'grand', 'grant', 'grape', 'graph', 'grasp', 'grass', 'great', 'green',
  'greet', 'grief', 'grill', 'gross', 'group', 'guard', 'guess', 'guest',
  'guide', 'guild', 'habit', 'happy', 'heart', 'heavy', 'hello', 'hence',
  'horse', 'hotel', 'house', 'human', 'humor', 'ideal', 'image', 'index',
  'inner', 'input', 'inter', 'intro', 'ivory', 'joint', 'joker', 'judge',
  'juice', 'karma', 'kayak', 'knife', 'knock', 'label', 'large', 'laser',
  'later', 'laugh', 'layer', 'learn', 'least', 'leave', 'legal', 'lemon',
  'level', 'lever', 'light', 'limit', 'linen', 'links', 'liver', 'local',
  'logic', 'login', 'lunar', 'lunch', 'macro', 'magic', 'major', 'maker',
  'march', 'match', 'maybe', 'mayor', 'medal', 'media', 'melon', 'menu',
  'mercy', 'merge', 'merit', 'metal', 'meter', 'micro', 'might', 'minor',
  'minus', 'mixer', 'model', 'modem', 'money', 'month', 'moral', 'motor',
  'mount', 'mouse', 'movie', 'music', 'naval', 'nerve', 'never', 'night',
  'ninja', 'noble', 'noise', 'north', 'noted', 'novel', 'nurse', 'occur',
  'ocean', 'offer', 'often', 'olive', 'omega', 'onion', 'opera', 'orbit',
  'order', 'organ', 'other', 'outer', 'owner', 'oxide', 'ozone', 'paint',
  'panel', 'panic', 'paper', 'party', 'pasta', 'patch', 'pause', 'peace',
  'pearl', 'pedal', 'penny', 'phase', 'phone', 'photo', 'piano', 'piece',
  'pilot', 'pinch', 'pixel', 'pizza', 'place', 'plain', 'plane', 'plant',
  'plate', 'plaza', 'point', 'polar', 'pound', 'power', 'press', 'price',
  'pride', 'prime', 'print', 'prior', 'prize', 'probe', 'proof', 'proud',
  'proxy', 'pulse', 'punch', 'pupil', 'queen', 'query', 'quest', 'quick',
  'quiet', 'quota', 'radar', 'radio', 'raise', 'rally', 'ranch', 'range',
  'rapid', 'ratio', 'razor', 'reach', 'react', 'ready', 'realm', 'rebel',
  'refer', 'reign', 'relax', 'reply', 'reset', 'rider', 'ridge', 'rifle',
  'right', 'rigid', 'river', 'roast', 'robot', 'rocky', 'roman', 'rough',
  'round', 'route', 'royal', 'rugby', 'rural', 'salad', 'salon', 'santa',
  'sauce', 'scale', 'scene', 'scope', 'score', 'scout', 'scrap', 'serum',
  'serve', 'setup', 'seven', 'shade', 'shaft', 'shake', 'shape', 'shark',
  'sharp', 'sheep', 'sheet', 'shelf', 'shell', 'shift', 'shine', 'shirt',
  'shock', 'shoot', 'short', 'shown', 'sigma', 'sight', 'sigma', 'silk',
  'silly', 'since', 'sixth', 'skill', 'slice', 'slide', 'slope', 'small',
  'smart', 'smell', 'smile', 'smoke', 'snake', 'solar', 'solid', 'solve',
  'sorry', 'sound', 'south', 'space', 'spare', 'spark', 'speak', 'speed',
  'spend', 'spice', 'spider', 'spine', 'split', 'spoke', 'spoon', 'sport',
  'spray', 'squad', 'stack', 'staff', 'stage', 'stake', 'stamp', 'stand',
  'stark', 'start', 'state', 'steam', 'steel', 'steep', 'stick', 'still',
  'stock', 'stone', 'store', 'storm', 'story', 'strap', 'straw', 'strip',
  'stuck', 'study', 'stuff', 'style', 'sugar', 'suite', 'sunny', 'super',
  'surge', 'swamp', 'sweep', 'sweet', 'swift', 'swing', 'sword', 'table',
  'taken', 'taste', 'teach', 'tempo', 'tenth', 'terms', 'theft', 'theme',
  'thick', 'thing', 'think', 'third', 'thorn', 'three', 'throw', 'thumb',
  'tiger', 'tight', 'timer', 'title', 'toast', 'today', 'token', 'topic',
  'torch', 'total', 'touch', 'tough', 'tower', 'toxic', 'trace', 'track',
  'trade', 'trail', 'train', 'trait', 'trash', 'travel', 'treat', 'trend',
  'trial', 'tribe', 'trick', 'troop', 'truck', 'truly', 'trunk', 'trust',
  'truth', 'tulip', 'tuned', 'turbo', 'twice', 'twist', 'ultra', 'uncle',
  'under', 'union', 'unity', 'until', 'upper', 'urban', 'usage', 'usual',
  'valid', 'value', 'vault', 'vegan', 'venus', 'verse', 'video', 'viral',
  'virus', 'visit', 'vital', 'vivid', 'vocal', 'vodka', 'voice', 'voter',
  'wagon', 'waste', 'watch', 'water', 'weary', 'wheat', 'wheel', 'where',
  'while', 'white', 'whole', 'widow', 'width', 'woman', 'world', 'worry',
  'worse', 'worst', 'worth', 'would', 'wound', 'wrist', 'write', 'wrong',
  'yacht', 'yield', 'young', 'youth', 'zebra', 'zesty', 'zombie', 'zones',
];

// Cryptographically secure random using Web Crypto API
function getRandomBytes(count: number): Uint8Array {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(count);
    crypto.getRandomValues(array);
    return array;
  }
  // Fallback for environments without crypto
  const array = new Uint8Array(count);
  for (let i = 0; i < count; i++) {
    array[i] = Math.floor(Math.random() * 256);
  }
  return array;
}

function getRandomInt(max: number): number {
  const randomBytes = getRandomBytes(4);
  const randomValue = new DataView(randomBytes.buffer).getUint32(0);
  return randomValue % max;
}

function generatePassword(
  length: number,
  uppercase: boolean,
  lowercase: boolean,
  numbers: boolean,
  symbols: boolean
): string {
  let charset = '';
  const requiredChars: string[] = [];

  if (uppercase) {
    charset += UPPERCASE;
    requiredChars.push(UPPERCASE[getRandomInt(UPPERCASE.length)]);
  }
  if (lowercase) {
    charset += LOWERCASE;
    requiredChars.push(LOWERCASE[getRandomInt(LOWERCASE.length)]);
  }
  if (numbers) {
    charset += NUMBERS;
    requiredChars.push(NUMBERS[getRandomInt(NUMBERS.length)]);
  }
  if (symbols) {
    charset += SYMBOLS;
    requiredChars.push(SYMBOLS[getRandomInt(SYMBOLS.length)]);
  }

  if (!charset) {
    charset = LOWERCASE + NUMBERS;
  }

  // Generate password
  let password = '';
  const remainingLength = Math.max(0, length - requiredChars.length);

  for (let i = 0; i < remainingLength; i++) {
    password += charset[getRandomInt(charset.length)];
  }

  // Add required characters at random positions
  for (const char of requiredChars) {
    const pos = getRandomInt(password.length + 1);
    password = password.slice(0, pos) + char + password.slice(pos);
  }

  return password.slice(0, length);
}

function generatePassphrase(wordCount: number, separator: string): string {
  const words: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    words.push(WORDS[getRandomInt(WORDS.length)]);
  }
  return words.join(separator);
}

function generatePin(length: number): string {
  let pin = '';
  for (let i = 0; i < length; i++) {
    pin += NUMBERS[getRandomInt(NUMBERS.length)];
  }
  return pin;
}

function calculateEntropy(password: string, mode: string, charsetSize?: number): number {
  if (mode === 'passphrase') {
    const wordCount = password.split(/[-_\s]/).length;
    return Math.log2(WORDS.length) * wordCount;
  }
  if (mode === 'pin') {
    return Math.log2(10) * password.length;
  }
  const size = charsetSize || 94; // Assume full charset
  return Math.log2(size) * password.length;
}

function getStrength(entropy: number): 'weak' | 'fair' | 'good' | 'strong' | 'very-strong' {
  if (entropy < 28) return 'weak';
  if (entropy < 36) return 'fair';
  if (entropy < 60) return 'good';
  if (entropy < 128) return 'strong';
  return 'very-strong';
}

function run(input: PasswordInput): PasswordOutput {
  try {
    const { mode, length, uppercase, lowercase, numbers, symbols, wordCount, separator, count } = input;

    const passwords: Array<{ value: string; strength: ReturnType<typeof getStrength>; entropy: number }> = [];

    let charsetSize = 0;
    if (uppercase) charsetSize += 26;
    if (lowercase) charsetSize += 26;
    if (numbers) charsetSize += 10;
    if (symbols) charsetSize += SYMBOLS.length;

    for (let i = 0; i < count; i++) {
      let value: string;

      if (mode === 'password') {
        value = generatePassword(length, uppercase, lowercase, numbers, symbols);
      } else if (mode === 'passphrase') {
        value = generatePassphrase(wordCount, separator);
      } else {
        value = generatePin(length);
      }

      const entropy = calculateEntropy(value, mode, charsetSize);
      const strength = getStrength(entropy);

      passwords.push({ value, strength, entropy: Math.round(entropy) });
    }

    return {
      success: true,
      passwords,
    };
  } catch (err) {
    return {
      success: false,
      error: { message: err instanceof Error ? err.message : 'Password generation failed' },
    };
  }
}

export const passwordTool = {
  meta,
  inputSchema,
  outputSchema,
  run,
};

export { meta, config, inputSchema, outputSchema };
export type { PasswordInput, PasswordOutput };
