
import { Button } from "@/components/ui/button";

const HillarySection = () => {
  return (
    <section className="bg-gradient-to-br from-blue-600 to-blue-800 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Content */}
          <div className="text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-8">
              Hi, I'm Hillary
            </h2>
            
            <div className="space-y-6 text-lg leading-relaxed">
              <p>
                I've been an immigration attorney for over 10 years. I founded New Frontier Immigration Law in 2019. Today, my law firm is an eight-figure business, and is one of the fastest growing firms in the US.
              </p>
              
              <p>
                The fast growth and high volume has been painful. Today, we have about 115 employees (most of whom are international legal assistants). But over the past 5 years, I've hired, onboarded, and trained more than 400 of my employees. Through this process, we've learned a lot – and we've learned to train.
              </p>
              
              <p>
                My hope is that your team members take this training, they stop asking you a zillion questions, and they will start critically and independently thinking. My hope is that they will help change even more immigrant lives.
              </p>
              
              <p className="mb-8">
                Let's change the world—together.
              </p>
              
              <p className="text-2xl font-bold mb-8">
                - Hillary -
              </p>
            </div>

            <Button className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-8 py-4 text-lg rounded-md">
              Book a Call to Learn More
            </Button>
          </div>

          {/* Right Side - Hillary's Image and Logo */}
          <div className="relative">
            <div className="relative z-10 text-center">
              {/* Hillary's Photo */}
              <div className="mb-8">
                <img 
                  src="/lovable-uploads/ecfb79a2-19a8-4c2b-bef7-65c3299407c2.png" 
                  alt="Hillary - Founder of New Frontier Immigration Law" 
                  className="w-80 h-96 object-cover rounded-lg mx-auto"
                />
              </div>
              
              {/* New Frontier Immigration Law Logo */}
              <div className="bg-white p-6 rounded-lg inline-block">
                <div className="text-center">
                  <div className="text-blue-600 font-bold text-sm mb-2">NEW</div>
                  <div className="text-blue-600 font-bold text-2xl mb-2">FRONTIER</div>
                  <div className="border-t-2 border-blue-600 my-2"></div>
                  <div className="text-blue-600 font-bold text-xl">IMMIGRATION</div>
                  <div className="text-blue-600 font-bold text-xl">LAW</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HillarySection;
