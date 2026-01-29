import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Assuming Card component is available

const faqItems = [
  {
    question: "How does Prague Day help recruiters find talent faster?",
    answer: "Prague Day leverages AI to analyze job descriptions and candidate resumes, providing a highly accurate match score. This significantly reduces manual screening time and surfaces top-tier candidates more efficiently."
  },
  {
    question: "Is the AI matching process biased?",
    answer: "Our AI is designed with fairness and transparency as core principles. We continuously train and validate our models to minimize bias and ensure objective candidate assessments based purely on skills and experience."
  },
  {
    question: "Can I integrate Prague Day with my existing ATS?",
    answer: "Yes, Prague Day offers flexible integration options, including API access and browser extensions, to seamlessly connect with popular Applicant Tracking Systems. Contact our support for specific integration details."
  },
  {
    question: "What kind of data privacy measures are in place?",
    answer: "We adhere to stringent data privacy regulations (e.g., GDPR, CCPA) and employ robust security protocols to protect all user and candidate data. Your data's security and confidentiality are our top priority."
  }
];

export default function FAQ() {
  return (
    <section id="faq" className="container py-24 sm:py-32">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
        Frequently Asked Questions
      </h2>
      <div className="grid md:grid-cols-2 gap-8">
        {faqItems.map((item, index) => (
          <Card key={index} className="bg-card">
            <CardHeader>
              <CardTitle className="text-lg">{item.question}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{item.answer}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
