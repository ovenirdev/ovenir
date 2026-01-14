/**
 * Generate schema.org SoftwareApplication for a tool
 */
export function generateToolSchema(tool: {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.title,
    description: tool.description,
    url: tool.url,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any (Web Browser)',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    author: {
      '@type': 'Organization',
      name: 'OVENIR',
      url: 'https://ovenir.com',
    },
  };
}

/**
 * Generate schema.org HowTo for a flow
 */
export function generateFlowSchema(flow: {
  id: string;
  title: string;
  description: string;
  url: string;
  steps: Array<{ name: string; tool: string }>;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: flow.title,
    description: flow.description,
    url: flow.url,
    step: flow.steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      itemListElement: {
        '@type': 'HowToDirection',
        text: `Use ${step.tool} tool`,
      },
    })),
  };
}

/**
 * Generate schema.org FAQPage
 */
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate schema.org BreadcrumbList
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
