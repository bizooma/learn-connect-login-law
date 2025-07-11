import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, UserMinus, UserPlus, CheckCircle, AlertCircle } from "lucide-react";

interface QuickStartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QuickStartModal = ({ open, onOpenChange }: QuickStartModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">Quick Start Guide</DialogTitle>
          <DialogDescription>
            Learn how to manage your law firm's training program effectively
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="add-employees" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="add-employees" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add Employees
            </TabsTrigger>
            <TabsTrigger value="assign-courses" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Assign Courses
            </TabsTrigger>
            <TabsTrigger value="substitute-employee" className="flex items-center gap-2">
              <UserMinus className="h-4 w-4" />
              Substitute Employee
            </TabsTrigger>
            <TabsTrigger value="employee-progress" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Employee Progress
            </TabsTrigger>
          </TabsList>

          <TabsContent value="add-employees" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  How to Add Employees to Your Firm
                </CardTitle>
                <CardDescription>
                  Follow these steps to add new team members to your training program
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">1</span>
                    <div>
                      <h4 className="font-medium">Navigate to Team Members</h4>
                      <p className="text-sm text-muted-foreground">Click on the "Team Members" tab in your dashboard</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">2</span>
                    <div>
                      <h4 className="font-medium">Check Available Seats</h4>
                      <p className="text-sm text-muted-foreground">Ensure you have available seats in your plan before adding employees</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">3</span>
                    <div>
                      <h4 className="font-medium">Click "Add Employee"</h4>
                      <p className="text-sm text-muted-foreground">Use the green "Add Employee" button to open the registration form</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">4</span>
                    <div>
                      <h4 className="font-medium">Enter Employee Details</h4>
                      <p className="text-sm text-muted-foreground">Fill in: First Name, Last Name, Email Address, and Job Title</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">5</span>
                    <div>
                      <h4 className="font-medium">Send Invitation</h4>
                      <p className="text-sm text-muted-foreground">The employee will receive an email invitation to set up their account</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-blue-800">Important Notes:</h5>
                      <ul className="text-sm text-blue-700 space-y-1 mt-1">
                        <li>• Each employee uses one seat from your plan</li>
                        <li>• Employees must verify their email before accessing courses</li>
                        <li>• You can assign a team leader role for supervision</li>
                      </ul>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assign-courses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  How to Assign Courses to Employees
                </CardTitle>
                <CardDescription>
                  Manage course assignments and track employee progress
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">1</span>
                    <div>
                      <h4 className="font-medium">Go to Assignments Tab</h4>
                      <p className="text-sm text-muted-foreground">Click on the "Assignments" tab to manage course assignments</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">2</span>
                    <div>
                      <h4 className="font-medium">Choose Assignment Method</h4>
                      <p className="text-sm text-muted-foreground">Select individual assignment or bulk assignment for multiple employees</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">3</span>
                    <div>
                      <h4 className="font-medium">Select Course & Employees</h4>
                      <p className="text-sm text-muted-foreground">Choose the course and select which employees should receive it</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">4</span>
                    <div>
                      <h4 className="font-medium">Set Assignment Details</h4>
                      <p className="text-sm text-muted-foreground">Choose if mandatory/optional, set due date, and add notes</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">5</span>
                    <div>
                      <h4 className="font-medium">Monitor Progress</h4>
                      <p className="text-sm text-muted-foreground">Track completion status and employee progress in real-time</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-green-800">Pro Tips:</h5>
                      <ul className="text-sm text-green-700 space-y-1 mt-1">
                        <li>• Use bulk assignment for company-wide training</li>
                        <li>• Set realistic due dates for course completion</li>
                        <li>• Mark critical courses as mandatory</li>
                        <li>• Add notes to provide context for assignments</li>
                      </ul>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="substitute-employee" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserMinus className="h-5 w-5" />
                  How to Substitute an Employee
                </CardTitle>
                <CardDescription>
                  Replace an employee while preserving seat allocation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3 text-destructive">Step 1: Remove Current Employee</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">1</span>
                      <div>
                        <h5 className="font-medium">Access Team Members</h5>
                        <p className="text-sm text-muted-foreground">Navigate to the Team Members tab</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <span className="bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">2</span>
                      <div>
                        <h5 className="font-medium">Find Employee Card</h5>
                        <p className="text-sm text-muted-foreground">Locate the employee you want to remove</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">3</span>
                      <div>
                        <h5 className="font-medium">Remove Employee</h5>
                        <p className="text-sm text-muted-foreground">Click the menu (⋯) and select "Remove Employee"</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="bg-destructive text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">4</span>
                      <div>
                        <h5 className="font-medium">Confirm Removal</h5>
                        <p className="text-sm text-muted-foreground">Confirm the action in the dialog box</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3 text-primary">Step 2: Add New Employee</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">1</span>
                      <div>
                        <h5 className="font-medium">Verify Seat Availability</h5>
                        <p className="text-sm text-muted-foreground">Ensure the removed employee freed up a seat</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">2</span>
                      <div>
                        <h5 className="font-medium">Add New Employee</h5>
                        <p className="text-sm text-muted-foreground">Follow the "Add Employee" process with new employee details</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">3</span>
                      <div>
                        <h5 className="font-medium">Reassign Courses</h5>
                        <p className="text-sm text-muted-foreground">Assign relevant courses to the new employee</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-amber-800">Important:</h5>
                      <ul className="text-sm text-amber-700 space-y-1 mt-1">
                        <li>• Course progress data is preserved for removed employees</li>
                        <li>• Seat allocation is immediately updated</li>
                        <li>• New employee needs fresh course assignments</li>
                        <li>• Consider role and permission requirements</li>
                      </ul>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employee-progress" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  How to Check Employee Progress on Courses
                </CardTitle>
                <CardDescription>
                  Step-by-step guide to monitor your employees' course completion and performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">1</span>
                    <div>
                      <h4 className="font-medium">Navigate to Team Members</h4>
                      <p className="text-sm text-muted-foreground">Go to the "Team Members" tab to see all your employees and their overall progress status</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">2</span>
                    <div>
                      <h4 className="font-medium">View Employee Cards</h4>
                      <p className="text-sm text-muted-foreground">Each employee card shows their name, job title, and quick progress indicators</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">3</span>
                    <div>
                      <h4 className="font-medium">Click "View Progress"</h4>
                      <p className="text-sm text-muted-foreground">Click the "View Progress" button on any employee card to see detailed course progress</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">4</span>
                    <div>
                      <h4 className="font-medium">Review Detailed Progress</h4>
                      <p className="text-sm text-muted-foreground">See completion percentage, quiz scores, time spent, and which lessons are in progress</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">5</span>
                    <div>
                      <h4 className="font-medium">Check Assignment Status</h4>
                      <p className="text-sm text-muted-foreground">Go to "Assignments" tab to see which courses are assigned, due dates, and completion status</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-green-800">What You Can Monitor:</h5>
                      <ul className="text-sm text-green-700 space-y-1 mt-1">
                        <li>• Overall completion percentage for each course</li>
                        <li>• Individual lesson progress and quiz scores</li>
                        <li>• Time spent on each course and last activity date</li>
                        <li>• Overdue assignments and missed deadlines</li>
                        <li>• Certificates earned and compliance status</li>
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

export default QuickStartModal;