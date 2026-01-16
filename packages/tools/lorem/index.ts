import { meta, config, inputSchema, outputSchema, type LoremInput, type LoremOutput } from './meta';

// Classic Lorem Ipsum word bank
const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
  'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
  'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
  'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
  'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum', 'at', 'vero', 'eos',
  'accusamus', 'iusto', 'odio', 'dignissimos', 'ducimus', 'blanditiis',
  'praesentium', 'voluptatum', 'deleniti', 'atque', 'corrupti', 'quos', 'dolores',
  'quas', 'molestias', 'excepturi', 'obcaecati', 'cupiditate', 'provident',
  'similique', 'mollitia', 'animi', 'maxime', 'placeat', 'facere', 'possimus',
  'omnis', 'voluptas', 'assumenda', 'repellendus', 'temporibus', 'autem',
  'quibusdam', 'officiis', 'debitis', 'aut', 'rerum', 'necessitatibus', 'saepe',
  'eveniet', 'voluptates', 'repudiandae', 'recusandae', 'itaque', 'earum',
  'hic', 'tenetur', 'sapiente', 'delectus', 'reiciendis', 'maiores', 'alias',
  'perferendis', 'doloribus', 'asperiores', 'repellat', 'perspiciatis', 'unde',
  'inventore', 'veritatis', 'quasi', 'architecto', 'beatae', 'vitae', 'dicta',
  'explicabo', 'nemo', 'ipsam', 'quia', 'aspernatur', 'odit', 'fugit',
  'consequuntur', 'magni', 'ratione', 'sequi', 'nesciunt', 'neque', 'porro',
  'quisquam', 'numquam', 'eius', 'modi', 'tempora', 'quaerat', 'soluta', 'nobis',
  'eligendi', 'optio', 'cumque', 'nihil', 'impedit', 'quo', 'minus', 'quod',
];

// The classic opening
const CLASSIC_OPENING = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit';

function getRandomWord(): string {
  return LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)];
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function generateSentence(wordCount?: number): string {
  const count = wordCount || Math.floor(Math.random() * 10) + 5; // 5-15 words
  const words: string[] = [];

  for (let i = 0; i < count; i++) {
    words.push(getRandomWord());
  }

  // Capitalize first word and add period
  words[0] = capitalize(words[0]);
  return words.join(' ') + '.';
}

function generateParagraph(sentenceCount?: number): string {
  const count = sentenceCount || Math.floor(Math.random() * 4) + 3; // 3-7 sentences
  const sentences: string[] = [];

  for (let i = 0; i < count; i++) {
    sentences.push(generateSentence());
  }

  return sentences.join(' ');
}

function generateWords(count: number, startWithLorem: boolean): string {
  const words: string[] = [];

  if (startWithLorem) {
    words.push('Lorem', 'ipsum', 'dolor', 'sit', 'amet');
  }

  while (words.length < count) {
    words.push(getRandomWord());
  }

  return words.slice(0, count).join(' ');
}

function generateSentences(count: number, startWithLorem: boolean): string {
  const sentences: string[] = [];

  if (startWithLorem) {
    sentences.push(CLASSIC_OPENING + '.');
  }

  while (sentences.length < count) {
    sentences.push(generateSentence());
  }

  return sentences.slice(0, count).join(' ');
}

function generateParagraphs(count: number, startWithLorem: boolean): string {
  const paragraphs: string[] = [];

  if (startWithLorem) {
    paragraphs.push(CLASSIC_OPENING + '. ' + generateParagraph(Math.floor(Math.random() * 3) + 2));
  }

  while (paragraphs.length < count) {
    paragraphs.push(generateParagraph());
  }

  return paragraphs.slice(0, count).join('\n\n');
}

function run(input: LoremInput): LoremOutput {
  try {
    const { mode, count, startWithLorem } = input;

    let text: string;

    switch (mode) {
      case 'words':
        text = generateWords(count, startWithLorem);
        break;
      case 'sentences':
        text = generateSentences(count, startWithLorem);
        break;
      case 'paragraphs':
      default:
        text = generateParagraphs(count, startWithLorem);
        break;
    }

    // Calculate stats
    const paragraphs = text.split('\n\n').length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length;
    const words = text.split(/\s+/).filter(w => w).length;
    const characters = text.length;

    return {
      success: true,
      text,
      stats: {
        paragraphs,
        sentences,
        words,
        characters,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: { message: err instanceof Error ? err.message : 'Generation failed' },
    };
  }
}

export const loremTool = {
  meta,
  inputSchema,
  outputSchema,
  run,
};

export { meta, config, inputSchema, outputSchema };
export type { LoremInput, LoremOutput };
