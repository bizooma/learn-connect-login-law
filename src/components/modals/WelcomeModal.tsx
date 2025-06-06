
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Award, Sparkles, Lightbulb, GraduationCap, Star } from "lucide-react";

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
  userFirstName?: string;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ 
  open, 
  onClose, 
  userFirstName = "Student" 
}) => {
  // YouTube video ID - updated with new video
  const [youtubeVideoId] = useState("O92D1gv2tCg");

  const coreValues = [
    { letter: "I", word: "Inspiring", icon: Lightbulb, color: "text-yellow-500" },
    { letter: "L", word: "Learning", icon: BookOpen, color: "text-blue-500" },
    { letter: "E", word: "Empowerment", icon: Star, color: "text-purple-500" },
    { letter: "A", word: "Advancement", icon: Award, color: "text-green-500" },
    { letter: "R", word: "Readiness through", icon: Users, color: "text-orange-500" },
    { letter: "N", word: "Notable education", icon: GraduationCap, color: "text-indigo-500" },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 gap-0" style={{ backgroundColor: '#E3E3E3' }}>
        <div className="relative overflow-hidden">
          {/* Header with gradient background */}
          <div 
            className="px-6 py-4 text-white relative"
            style={{ background: '#213C82' }}
          >
            <div className="absolute top-0 right-0 p-3">
              <Sparkles className="h-6 w-6 text-yellow-300 animate-pulse" />
            </div>
            <div className="flex items-center mb-3">
              <img 
                src="/lovable-uploads/126f6dae-4376-4b57-9955-f40fc6fa19e2.png" 
                alt="New Frontier University" 
                className="h-10 w-auto mr-3"
              />
              <div>
                <DialogTitle className="text-2xl font-bold text-white mb-1">
                  Welcome to Your New Training Platform!
                </DialogTitle>
                <p className="text-blue-100 text-base">
                  Hello {userFirstName}! 🎉
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Your Learning Journey Starts Here
              </h3>
              <p className="text-gray-600 max-w-md mx-auto text-sm">
                Welcome to New Frontier University's Learning Management System. 
                We've designed this platform to make your professional development 
                engaging and effective.
              </p>
            </div>

            {/* Welcome Video Section */}
            <div className="mb-6 flex justify-center">
              <div className="bg-white rounded-lg shadow-lg p-4 w-full max-w-sm">
                <h4 className="text-base font-semibold text-gray-900 mb-3 text-center">
                  Watch This Quick Introduction
                </h4>
                <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                  {youtubeVideoId ? (
                    <iframe
                      className="w-full h-full"
                      src={`https://www.youtube.com/embed/${youtubeVideoId}?controls=1&modestbranding=1&rel=0&showinfo=0&cc_load_policy=0&iv_load_policy=3&disablekb=1`}
                      title="Welcome Video"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-800 text-white">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="text-base">Welcome Video</p>
                        <p className="text-xs text-gray-300">Video will appear here when configured</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* I LEARN Core Values Section */}
            <div className="mb-6">
              <div className="text-center mb-4">
                <h4 className="text-xl font-bold text-gray-900 mb-2">Our Core Values</h4>
                <div className="text-3xl font-bold" style={{ color: '#213C82' }}>
                  I LEARN
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {coreValues.map((value, index) => (
                  <div 
                    key={value.letter} 
                    className="bg-white rounded-lg p-3 shadow-sm border-l-4 hover:shadow-md transition-shadow"
                    style={{ borderLeftColor: '#213C82' }}
                  >
                    <div className="flex items-center mb-2">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center mr-2 text-white font-bold text-sm"
                        style={{ backgroundColor: '#213C82' }}
                      >
                        {value.letter}
                      </div>
                      <value.icon className={`h-5 w-5 ${value.color}`} />
                    </div>
                    <p className="font-medium text-gray-900 text-xs leading-relaxed">
                      {value.word}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Call to action */}
            <div className="text-center">
              <Button 
                onClick={onClose}
                className="px-6 py-2 text-base font-medium"
                style={{ background: '#213C82' }}
              >
                Let's Get Started! 🚀
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;
