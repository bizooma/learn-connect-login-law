import { Button } from "@/components/ui/button";

const HillarySection = () => {
  return (
    <section style={{ backgroundColor: '#213C82' }} className="py-20">
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

            <Button 
              asChild
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-8 py-4 text-lg rounded-md"
            >
              <a 
                href="https://outlook.office365.com/book/SalesTrainerNFU@newfrontier.us/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Book a Call to Learn More
              </a>
            </Button>
          </div>

          {/* Right Side - Hillary's Image and Logo */}
          <div className="relative">
            <div className="relative z-10 text-center">
              {/* Hillary's Photo - doubled size from w-80 h-96 to w-160 h-192 */}
              <div className="mb-8">
                <img 
                  src="/lovable-uploads/17ce76f2-e60e-4ac9-bd42-c84db738b1c1.png" 
                  alt="Hillary - Founder of New Frontier Immigration Law" 
                  className="w-160 h-192 object-cover rounded-lg mx-auto"
                  style={{ width: '640px', height: '768px' }}
                />
              </div>
              
              {/* New Frontier Immigration Law Logo - doubled size from h-20 to h-40 */}
              <div className="inline-block">
                <img 
                  src="/lovable-uploads/4a0ee910-95bb-4abb-951b-d12a7c26f2c4.png" 
                  alt="New Frontier Immigration Law Logo" 
                  className="h-40 mx-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HillarySection;
