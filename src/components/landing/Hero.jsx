import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

const testimonials = [
  {
    quote: "Prague Day has streamlined our hiring process, cutting our time-to-hire by 30%. A game-changer for high-volume recruitment!",
    author: "Sarah Chen",
    title: "HR Director at TechSolutions Inc."
  },
  {
    quote: "Finding top talent is tough. Prague Day's AI insights give us a competitive edge, ensuring we never miss a perfect candidate.",
    author: "David Lee",
    title: "Talent Acquisition Lead, Global Innovations"
  },
  {
    quote: "The ability to quickly match candidates to our specific job requirements has transformed our screening process. Highly recommended for any busy recruiter.",
    author: "Emily Rodriguez",
    title: "Senior Recruiter, FutureCorp"
  },
];

export default function Hero() {
  const navigate = useNavigate();
  const testimonial = testimonials[0];

  const scrollToPricing = () => {
    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="container grid lg:grid-cols-2 place-items-center py-20 md:py-32 gap-10">
      <div className="text-center lg:text-start space-y-6">
        <main className="text-5xl md:text-6xl font-bold">
          <h1 className="inline">
            <span className="inline bg-gradient-to-r from-primary to-primary/80 text-transparent bg-clip-text">
              Prague Day
            </span>{" "}
            AI-Powered
          </h1>{" "}
          Job Search {" "}
          <h2 className="inline">
            <span className="inline bg-gradient-to-r from-primary/80 to-primary text-transparent bg-clip-text">
              Assistant
            </span>{" "}
          </h2>
        </main>

        <p className="text-xl text-muted-foreground md:w-10/12 mx-auto lg:mx-0">
          Land your dream job faster with AI-powered resume optimization, smart job matching, and personalized career coaching.
        </p>

        <div className="space-y-4 md:space-y-0 md:space-x-4">
          <Button className="w-full md:w-1/3" onClick={() => navigate('/auth')}>Get Started</Button>
          <Button variant="outline" className="w-full md:w-1/3" onClick={scrollToPricing}>See Plans</Button>
        </div>
      </div>

      <div className="z-10 w-full">
        <div className="bg-card border p-6 rounded-2xl shadow-lg h-full flex flex-col justify-between">
            <p className="text-lg text-foreground italic mb-4">
                "{testimonial.quote}"
            </p>
            <div>
                <p className="font-semibold text-primary">{testimonial.author}</p>
                <p className="text-sm text-muted-foreground">{testimonial.title}</p>
            </div>
        </div>
      </div>

      <div className="shadow-lg absolute inset-0 -z-10 bg-primary/20 rounded-full blur-3xl opacity-50 hidden lg:block"></div>
    </section>
  );
}
