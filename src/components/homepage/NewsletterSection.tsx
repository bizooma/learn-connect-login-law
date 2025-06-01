
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const NewsletterSection = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter subscription logic here
    console.log("Newsletter subscription:", { name, email });
  };

  return (
    <section className="bg-gradient-to-r from-blue-600 to-blue-800 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Content */}
          <div className="text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-8">
              Sound Interesting?<br />
              Stay In Touch
            </h2>
            
            <p className="text-xl leading-relaxed">
              Subscribe to our newsletter to receive exclusive updates on new courses, industry news, and expert commentary on immigration law. <span className="font-semibold">Stay informed and ahead in your field with the latest insights delivered directly to your inbox.</span>
            </p>
          </div>

          {/* Right Side - Form */}
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name"
                  className="w-full"
                  required
                />
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full"
                  required
                />
              </div>

              {/* Submit Button */}
              <Button 
                type="submit"
                className="bg-orange-400 hover:bg-orange-500 text-white font-semibold px-8 py-3 w-full"
              >
                Sign Up
              </Button>

              {/* Disclaimer */}
              <div className="text-xs text-gray-500 leading-relaxed">
                <span className="font-semibold">* Disclaimer:</span> We never sell your private information or share it with any of our partners. The information you have obtained at this site is not, nor is it intended to be legal advice. It is advised that you consult an attorney for advice regarding your individual situation.
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;
