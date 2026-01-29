import React from 'react';

const TestimonialCard = ({ quote, name, title }) => (
  <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 flex flex-col items-center text-center">
    <p className="text-gray-700 italic mb-4">"{quote}"</p>
    <p className="font-semibold text-blue-600">{name}</p>
    <p className="text-sm text-gray-500">{title}</p>
  </div>
);

const Testimonials = () => {
  const testimonialsData = [
    {
      quote: "Prague-day transformed my job search. Their AI tools are incredibly insightful and helped me land my dream job faster than I ever thought possible!",
      name: "Jane Doe",
      title: "Senior Software Engineer at TechCorp"
    },
    {
      quote: "The resume builder is a game-changer. I received significantly more interview requests after revamping my resume with Prague-day.",
      name: "John Smith",
      title: "Marketing Manager at Global Brands"
    },
    {
      quote: "The interview Q&A assistant gave me the confidence I needed. It felt like having a personal career coach.",
      name: "Emily White",
      title: "Product Designer at InnovateX"
    }
  ];

  return (
    <div className="bg-gray-50 py-20 px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-2">What Our Users Say</h2>
          <p className="text-gray-600">Hear from job seekers who found success with Prague-day.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonialsData.map((testimonial, index) => (
            <TestimonialCard
              key={index}
              quote={testimonial.quote}
              name={testimonial.name}
              title={testimonial.title}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Testimonials;
