
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Award, Sparkles } from "lucide-react";

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
  // YouTube video ID - updated with your specific video
  const [youtubeVideoId] = useState("Z9YJvLigLIg");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 gap-0" style={{ backgroundColor: '#E3E3E3' }}>
        <div className="relative overflow-hidden">
          {/* Header with gradient background */}
          <div 
            className="px-8 py-6 text-white relative"
            style={{ background: '#213C82' }}
          >
            <div className="absolute top-0 right-0 p-4">
              <Sparkles className="h-8 w-8 text-yellow-300 animate-pulse" />
            </div>
            <div className="flex items-center mb-4">
              <img 
                src="/lovable-uploads/126f6dae-4376-4b57-9955-f40fc6fa19e2.png" 
                alt="New Frontier University" 
                className="h-12 w-auto mr-4"
              />
              <div>
                <DialogTitle className="text-3xl font-bold text-white mb-2">
                  Welcome to Your New LMS!
                </DialogTitle>
                <p className="text-blue-100 text-lg">
                  Hello {userFirstName}! 🎉
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Your Learning Journey Starts Here
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Welcome to New Frontier University's Learning Management System. 
                We've designed this platform to make your professional development 
                engaging and effective.
              </p>
            </div>

            {/* Welcome Video Section */}
            <div className="mb-8 flex justify-center">
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 text-center">
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
                        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="text-lg">Welcome Video</p>
                        <p className="text-sm text-gray-300">Video will appear here when configured</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Features grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="text-center p-4 rounded-lg shadow-sm border" style={{ backgroundColor: '#FFDA00' }}>
                <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h4 className="font-medium text-gray-900 mb-1">Interactive Courses</h4>
                <p className="text-sm text-gray-600">Engaging content tailored for legal professionals</p>
              </div>
              <div className="text-center p-4 rounded-lg shadow-sm border" style={{ backgroundColor: '#FFDA00' }}>
                <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h4 className="font-medium text-gray-900 mb-1">Collaborative Learning</h4>
                <p className="text-sm text-gray-600">Connect with peers and share knowledge</p>
              </div>
              <div className="text-center p-4 rounded-lg shadow-sm border" style={{ backgroundColor: '#FFDA00' }}>
                <Award className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h4 className="font-medium text-gray-900 mb-1">Track Progress</h4>
                <p className="text-sm text-gray-600">Monitor your learning journey and achievements</p>
              </div>
            </div>

            {/* Call to action */}
            <div className="text-center">
              <Button 
                onClick={onClose}
                className="px-8 py-3 text-lg font-medium"
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
