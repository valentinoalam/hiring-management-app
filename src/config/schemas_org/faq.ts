import type { SchemaFAQ } from "#@/config/schemas_org/schema-types.ts"

export interface FAQItem {
  question: string
  answer: string
}

/**
 * Creates a FAQ schema
 */
export function createFAQSchema(questions: FAQItem[]): SchemaFAQ {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  }
}

