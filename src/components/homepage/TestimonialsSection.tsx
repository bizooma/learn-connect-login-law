
const TestimonialsSection = () => {
  const testimonials = [
    {
      quote: "Hillary's program brought my new legal assistant up to speed on immigration in a big way! I was very impressed by his improvement after going through her course and would highly recommend it!",
      author: "Shaina Plaksin",
      role: "Immigration Attorney"
    },
    {
      quote: "I am brand new to immigration law, but I was able to prepare and file 4 EAD renewals the same week I took the course. I was able to do it all on my own because the course taught me how to do it and where to find the answers to my other questions.",
      author: "Juan",
      role: "Legal Assistant Student"
    },
    {
      quote: "I have friends who are scared in the current environment and I've learned so much to help them get the assistance they need.",
      author: "Sarah",
      role: "Client"
    }
  ];

  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Praise For New Frontier University
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
              {/* Quote Icon */}
              <div className="text-6xl text-gray-300 font-serif mb-4">"</div>
              
              {/* Quote Text */}
              <p className="text-gray-600 text-lg leading-relaxed mb-6 italic">
                {testimonial.quote}
              </p>
              
              {/* Author */}
              <div className="border-t border-gray-200 pt-4">
                <p className="font-bold text-gray-900">{testimonial.author}</p>
                <p className="text-gray-500 text-sm">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
