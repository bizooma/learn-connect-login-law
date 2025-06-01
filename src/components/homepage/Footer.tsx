
import { Button } from "@/components/ui/button";
import { Facebook, Instagram, Linkedin, ChevronUp } from "lucide-react";

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-gray-900 text-white">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo and Contact Info */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <img 
                src="/lovable-uploads/6d61691d-888e-4d17-bad9-d5c370292968.png" 
                alt="New Frontier University" 
                className="h-16 w-auto mb-4"
              />
            </div>
            <p className="text-gray-300 mb-4">
              550 West Portland St, Phoenix, AZ 85003
            </p>
            
            {/* Social Media Icons */}
            <div className="flex space-x-4 mb-6">
              <a href="#" className="bg-blue-600 hover:bg-blue-700 p-2 rounded transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="bg-pink-600 hover:bg-pink-700 p-2 rounded transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="bg-blue-700 hover:bg-blue-800 p-2 rounded transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Courses for Everyone */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-300">Courses for Everyone</h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Law Firms
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Staff Training
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Immigration Law
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Podcast
                </a>
              </li>
            </ul>
          </div>

          {/* Back to Top Button */}
          <div className="flex justify-center lg:justify-end">
            <Button
              onClick={scrollToTop}
              className="bg-gray-700 hover:bg-gray-600 text-white rounded-full w-12 h-12 p-0 flex items-center justify-center"
            >
              <ChevronUp className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2024 New Frontier University. All rights reserved.
            </div>
            
            {/* Language Selector */}
            <div className="flex items-center space-x-2">
              <span className="text-gray-400 text-sm">🇺🇸 English</span>
              <span className="text-gray-500 text-xs">TOP</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
