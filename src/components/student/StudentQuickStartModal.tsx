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
                      <h4 className="font-medium">Dashboard Stats Cards (Top Section)</h4>
                      <p className="text-sm text-muted-foreground">Look at the colored cards at the top: "Assigned Courses" (total courses given to you), "In Progress" (courses you've started), "Completed" (finished courses), and "Certificates" (earned certificates). Click any card to filter your course view.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">2</span>
                    <div>
                      <h4 className="font-medium">Main Navigation Tabs</h4>
                      <p className="text-sm text-muted-foreground">Use the four main tabs below the header: "Dashboard" (your learning overview), "Calendar" (law firm events), "Certificates" (your achievements), and "Profile" (personal settings). Click any tab to switch views.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">3</span>
                    <div>
                      <h4 className="font-medium">Course View Switcher</h4>
                      <p className="text-sm text-muted-foreground">In the main content area, toggle between "Assigned Courses" and "Completed Courses" tabs to see different course lists. Click course cards to start learning or resume where you left off.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">4</span>
                    <div>
                      <h4 className="font-medium">Badges & Achievements Section</h4>
                      <p className="text-sm text-muted-foreground">Scroll down to see your earned badges displayed in colorful cards. These appear automatically when you complete milestones. Click badges to see their descriptions.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">5</span>
                    <div>
                      <h4 className="font-medium">Help & Quick Actions (Top Right)</h4>
                      <p className="text-sm text-muted-foreground">Look for the "Quick Start" button (opens this guide) and "Report Issue" button in the top right corner. Use "Report Issue" if you encounter problems or need support.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">6</span>
                    <div>
                      <h4 className="font-medium">Course Cards Actions</h4>
                      <p className="text-sm text-muted-foreground">Each course card shows a progress bar, title, and description. Click anywhere on the card to enter the course. Look for "Continue" or "Start" indicators to know your status.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-blue-800">Quick Navigation Tips:</h5>
                      <ul className="text-sm text-blue-700 space-y-1 mt-1">
                        <li>• Click the stats cards at the top to quickly filter your courses</li>
                        <li>• Use browser back button to return to dashboard from any page</li>
                        <li>• Your current location is always highlighted in the navigation</li>
                        <li>• Course progress saves automatically as you complete lessons</li>
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
                      <h4 className="font-medium">Check Dashboard Stats Cards</h4>
                      <p className="text-sm text-muted-foreground">At the top of your dashboard, the four colored cards show: Total assigned courses, courses you've started (In Progress), fully completed courses, and certificates earned. These numbers update automatically as you progress.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">2</span>
                    <div>
                      <h4 className="font-medium">View Individual Course Progress</h4>
                      <p className="text-sm text-muted-foreground">Each course card displays a colored progress bar underneath the title. Green bars show completed courses (100%), blue/orange bars show partial progress. The percentage indicates how much of the course you've finished.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">3</span>
                    <div>
                      <h4 className="font-medium">Access the Certificates Tab</h4>
                      <p className="text-sm text-muted-foreground">Click the "Certificates" tab at the top of your dashboard. Here you'll see all certificates you've earned, displayed as downloadable cards with course names, completion dates, and certificate numbers.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">4</span>
                    <div>
                      <h4 className="font-medium">Monitor Assignment Status</h4>
                      <p className="text-sm text-muted-foreground">Use the "Assigned Courses" and "Completed Courses" tabs in the main content area. Assigned courses show what you need to work on, completed courses show your achievements. Look for due dates if any are set.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">5</span>
                    <div>
                      <h4 className="font-medium">View Earned Badges</h4>
                      <p className="text-sm text-muted-foreground">Scroll down on your dashboard to see the badges section. Badges appear as colorful cards when you reach milestones like completing your first course, finishing multiple courses, or achieving learning streaks.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">6</span>
                    <div>
                      <h4 className="font-medium">Track Learning Inside Courses</h4>
                      <p className="text-sm text-muted-foreground">When you click into a course, you'll see module progress on the left sidebar and unit completion checkmarks. Green checkmarks indicate completed lessons, gray circles show pending lessons.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-purple-800">Progress Tracking Tips:</h5>
                      <ul className="text-sm text-purple-700 space-y-1 mt-1">
                        <li>• Progress is saved automatically - you can pause and resume anytime</li>
                        <li>• Complete all lessons and quizzes in a course to earn a certificate</li>
                        <li>• Check your dashboard weekly to stay on track with assignments</li>
                        <li>• Download certificates from the Certificates tab for your records</li>
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