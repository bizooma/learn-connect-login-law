import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation, Calendar, Trophy, BarChart3, AlertCircle, CheckCircle } from "lucide-react";

interface StudentQuickStartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const StudentQuickStartModal = ({ open, onOpenChange }: StudentQuickStartModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">Quick Start Guide</DialogTitle>
          <DialogDescription>
            Learn how to navigate your student dashboard and track your learning progress
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Navigation className="h-4 w-4" />
              Getting Around
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              View Progress
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="h-5 w-5" />
                  Getting Around Your Dashboard
                </CardTitle>
                <CardDescription>
                  Learn how to navigate your student dashboard and use its key features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">1</span>
                    <div>
                      <h4 className="font-medium">Dashboard Stats Overview</h4>
                      <p className="text-sm text-muted-foreground">The top section shows your key metrics: assigned courses, courses in progress, completed courses, and certificates earned</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">2</span>
                    <div>
                      <h4 className="font-medium">Navigation Tabs</h4>
                      <p className="text-sm text-muted-foreground">Use the main tabs to switch between Dashboard, Calendar, Certificates, and Profile sections</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">3</span>
                    <div>
                      <h4 className="font-medium">Badge Section</h4>
                      <p className="text-sm text-muted-foreground">View your earned badges and achievements in the badges section of your dashboard</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">4</span>
                    <div>
                      <h4 className="font-medium">Course Sections</h4>
                      <p className="text-sm text-muted-foreground">Switch between "Assigned Courses" and "Completed Courses" to see different views of your learning journey</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">5</span>
                    <div>
                      <h4 className="font-medium">Profile & Help</h4>
                      <p className="text-sm text-muted-foreground">Access your profile settings and report issues using the buttons in the top right corner</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-blue-800">Navigation Tips:</h5>
                      <ul className="text-sm text-blue-700 space-y-1 mt-1">
                        <li>• Use the main tabs for quick navigation between sections</li>
                        <li>• Click on course cards to start learning or continue where you left off</li>
                        <li>• Check your progress regularly to stay motivated</li>
                        <li>• Use the help button if you encounter any issues</li>
                      </ul>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  How to Use the Calendar
                </CardTitle>
                <CardDescription>
                  Stay organized with your law firm's events and training schedules
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">1</span>
                    <div>
                      <h4 className="font-medium">Access the Calendar</h4>
                      <p className="text-sm text-muted-foreground">Click on the "Calendar" tab to view your law firm's scheduled events and training sessions</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">2</span>
                    <div>
                      <h4 className="font-medium">Navigate Months</h4>
                      <p className="text-sm text-muted-foreground">Use the arrow buttons to navigate between months and find upcoming or past events</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">3</span>
                    <div>
                      <h4 className="font-medium">Event Indicators</h4>
                      <p className="text-sm text-muted-foreground">Dates with events are highlighted with colored dots or badges indicating scheduled activities</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">4</span>
                    <div>
                      <h4 className="font-medium">View Event Details</h4>
                      <p className="text-sm text-muted-foreground">Click on highlighted dates to see event details, times, and meeting links if available</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">5</span>
                    <div>
                      <h4 className="font-medium">Event Types</h4>
                      <p className="text-sm text-muted-foreground">Different colors may represent different types of events: training sessions, meetings, or deadlines</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-green-800">Calendar Pro Tips:</h5>
                      <ul className="text-sm text-green-700 space-y-1 mt-1">
                        <li>• Check the calendar regularly for new training sessions</li>
                        <li>• Add important dates to your personal calendar</li>
                        <li>• Join meetings early using provided links</li>
                        <li>• Note any course deadlines highlighted on the calendar</li>
                      </ul>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Explaining the Leaderboard
                </CardTitle>
                <CardDescription>
                  Understand how to use leaderboards to track your progress and compete with colleagues
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">1</span>
                    <div>
                      <h4 className="font-medium">Mini Leaderboards</h4>
                      <p className="text-sm text-muted-foreground">Small leaderboard widgets appear on your dashboard showing top performers in different categories</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">2</span>
                    <div>
                      <h4 className="font-medium">Learning Streaks</h4>
                      <p className="text-sm text-muted-foreground">Track consecutive days of learning activity and see how you compare to your colleagues</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">3</span>
                    <div>
                      <h4 className="font-medium">Course Completion Rankings</h4>
                      <p className="text-sm text-muted-foreground">See who has completed the most courses and your ranking within your law firm</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">4</span>
                    <div>
                      <h4 className="font-medium">Category Leaders</h4>
                      <p className="text-sm text-muted-foreground">Different leaderboards may show leaders in specific course categories or skill areas</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">5</span>
                    <div>
                      <h4 className="font-medium">Your Position</h4>
                      <p className="text-sm text-muted-foreground">Your current position is highlighted, showing where you stand compared to your colleagues</p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Trophy className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-amber-800">Leaderboard Benefits:</h5>
                      <ul className="text-sm text-amber-700 space-y-1 mt-1">
                        <li>• Stay motivated through friendly competition</li>
                        <li>• Track your progress relative to peers</li>
                        <li>• Identify top performers to learn from</li>
                        <li>• Celebrate achievements and milestones</li>
                      </ul>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  View Your Progress
                </CardTitle>
                <CardDescription>
                  Learn how to track your learning progress and view your achievements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">1</span>
                    <div>
                      <h4 className="font-medium">Dashboard Overview</h4>
                      <p className="text-sm text-muted-foreground">The main dashboard shows your overall progress with stats cards displaying key metrics</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">2</span>
                    <div>
                      <h4 className="font-medium">Course Progress Bars</h4>
                      <p className="text-sm text-muted-foreground">Each course card shows a progress bar indicating how much you've completed</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">3</span>
                    <div>
                      <h4 className="font-medium">Certificates Tab</h4>
                      <p className="text-sm text-muted-foreground">Navigate to the Certificates tab to view all your earned certificates and achievements</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">4</span>
                    <div>
                      <h4 className="font-medium">Assignment Status</h4>
                      <p className="text-sm text-muted-foreground">See which courses are assigned, in progress, or completed with clear status indicators</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">5</span>
                    <div>
                      <h4 className="font-medium">Badge Collection</h4>
                      <p className="text-sm text-muted-foreground">View earned badges and achievements that recognize your learning milestones</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-purple-800">Progress Tracking Tips:</h5>
                      <ul className="text-sm text-purple-700 space-y-1 mt-1">
                        <li>• Set personal learning goals and track them regularly</li>
                        <li>• Complete courses fully to earn certificates</li>
                        <li>• Use progress data to identify areas for improvement</li>
                        <li>• Celebrate milestones and achievements along the way</li>
                      </ul>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default StudentQuickStartModal;