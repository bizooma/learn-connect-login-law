
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import PersonalInfoFields from "./PersonalInfoFields";
import PasswordFields from "./PasswordFields";
import UserTypeRadioGroup from "./UserTypeRadioGroup";
import LawFirmField from "./LawFirmField";

interface RegisterFormProps {
  selectedPlan?: string | null;
}

const RegisterForm = ({ selectedPlan }: RegisterFormProps) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    lawFirmName: "",
    userType: "",
    selectedPlan: selectedPlan || "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [planDetails, setPlanDetails] = useState<any>(null);

  // Fetch plan details if a plan is selected
  useEffect(() => {
    if (selectedPlan) {
      fetchPlanDetails(selectedPlan);
    }
  }, [selectedPlan]);

  const fetchPlanDetails = async (planId: string) => {
    try {
      const planMapping: Record<string, string> = {
        'starter': 'Starter Package',
        'law-firms': 'Law Firms',
        'enterprise': 'Enterprise'
      };
      
      const planName = planMapping[planId];
      if (!planName) return;

      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('name', planName)
        .single();

      if (error) {
        console.error('Error fetching plan:', error);
      } else {
        setPlanDetails(data);
      }
    } catch (error) {
      console.error('Error fetching plan details:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUserTypeChange = (value: string) => {
    setFormData({
      ...formData,
      userType: value,
    });
  };

  const validateStep1 = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || 
        !formData.password || !formData.confirmPassword || !formData.userType) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!termsAgreed) {
      toast({
        title: "Terms Required",
        description: "You must agree to the terms and conditions to proceed.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            law_firm_name: formData.lawFirmName,
            user_type: formData.userType,
            selected_plan: formData.selectedPlan,
          },
        },
      });

      if (error) {
        toast({
          title: "Registration Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Registration Successful",
          description: "Account created successfully! Redirecting to payment...",
        });

        // If a plan was selected and user is created, immediately redirect to payment
        if (selectedPlan && authData.user) {
          // Small delay to ensure auth is settled, then create checkout
          setTimeout(async () => {
            try {
              const { data, error: checkoutError } = await supabase.functions.invoke('create-subscription-checkout', {
                body: { planId: selectedPlan },
              });

              if (checkoutError) {
                console.error('Checkout error:', checkoutError);
                toast({
                  title: "Checkout Error",
                  description: "Failed to create checkout session. Please try again.",
                  variant: "destructive",
                });
              } else if (data?.url) {
                window.location.href = data.url;
              }
            } catch (checkoutError) {
              console.error('Unexpected checkout error:', checkoutError);
              toast({
                title: "Error",
                description: "Please try selecting your plan again.",
                variant: "destructive",
              });
            }
          }, 1000);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const termsAndConditions = `TERMS AND CONDITIONS

Trademarks
Licensor owns all the trademarks and service marks associated with the Products and the Learning Management System, including New Frontier University Interactive Training Center (NF+U). Licensor also owns all rights and title to copyrights in NF+U, the techniques and the instructions ("Works") and the processes, patentable or otherwise, in the Products as a business method ("Methods"). Licensor hereby grants Licensee a Limited Use License and the right to use the "Works" and "Methods" for the term of this Agreement and under the terms of this Agreement. Any training logos, trademarks, works or other custom content added by Licensee remains the property of Licensee. Sharing licenses is not permitted. Unauthorized recordings, including screen recording, is not permitted.
 
License Duration
This agreement and Licensee access to Products becomes active upon first monthly payment and continues for twelve (12) months thereafter. All payments are due on the same day each month. This Agreement is entered into and effective as of the date of execution below.  Access to courses, content, and live trainings will not begin until Licensee has returned a signed agreement with accurate banking information to establish payments.  Last payments will be charged on the last month of access, which shall be twelve (12) months after Licensee signs this agreement.  Access to any Products including courses, live trainings, and/or included extras ends on the last day of the calendar month this agreement ends regardless if the Licensee and/or their respective "students" enrolled have completed the Products. 

Events and Live Offerings
Any live trainings or events that are hosted virtually and/or in-person are scheduled by the Licensor and are not offered privately if the Licensee and/or his/her team cannot attend.  Invitations and virtual meeting links associated with such events shall only be provided to the Licensee's team members who are formally "registered" as "students" in New Frontier University.  Licensee and his/her business/company employees, contractors, and team members hereby agree not to share or distribute invitations, meeting links, and event/training details or access with anyone who is not a currently registered "student." If COVID-19 or any pandemic related issues impact the ability to deliver a live event or any live component of any program or event, Licensor reserves the right to convert and deliver the live event via virtual means.  If Licensee receives any gratis items including but not limited to live event access/tickets as part of this Agreement, they understand that gratis items do not have monetary value, are not transferable, and are not eligible for refunds or credits.
 
Cancellation
This program is not a recurring monthly subscription; it is an installment plan for the total value of the Agreement per licensee. Therefore, after a licensee has accessed the training platform or attended any live training, there is no cancellation or refund for that licensee. Further, refunds must be requested in writing via email to sales@newfrontieruniversity.com within 10 days of the license start date.  Licensee understands the cancellation process and that any chargeback will be considered unauthorized.
 
No Guarantees
Licensor does not guarantee that Licensee or his/her business/company, employees, contractors, and the like will achieve any results, earn any specific amount of income, or reach any particular goal by completing its trainings. The information provided is provided only on an informational basis. If Licensee uses such information, they do so at their own risk and are solely responsible for any decisions and actions that result from their decision to use such information. Licensor will never provide relationship, legal, investment, professional, tax, or financial advice. Instead, Licensor offers educational materials and information. Licensee is responsible for supervising their participating team members, and their participation in this program does not create a supervision relationship with any attorney or staff member of New Frontier University or New Frontier Immigration Law. There is no assumption of responsibility for any errors or omissions that may appear in any program materials or written information.

Indemnification
Licensee and their directors, officers, employees, contractors, agents, shareholders, partners, members, and other owners hereby agree to indemnify and hold harmless NF+U and its subsidiaries and their directors, officers, employees, contractors, agents, shareholders, partners, members, and other owners against any and all claims, actions, demands, liabilities, losses, damages, judgments, settlements, costs, and expenses (including reasonable attorneys' fees) (any or all of the foregoing hereinafter referred to as "Losses") insofar as such Losses (or actions in respect thereof) arise out of or are based on intellectual property rights or a violation thereof.
 
Scope of Relationship
Both the Licensor and Licensee agree that no joint venture, partnership, employment, or agency relationship as a result of this Agreement.
 
Non-solicitation Agreement
Licensor will not solicit employment or contract services from the employees or contractors of Licensee's business.  Licensee will not solicit employment or contract services from the employees or contractors of Licensor business for a period of 365 days after this agreement ends.

Legally Binding
This is a legally binding contract for the term and total value provided herein. Licensee is permitted to use NF+U for the entire duration of this Agreement, if payments are current. When the term is over, Licensee is no longer permitted to use, and agrees not to use, the NF+U or any similar variants therein. If Licensee sells their business/company, or if their business/company is acquired by another entity, Licensee agrees that this agreement will be assigned to the new or acquiring entity as part of the sale or acquisition. If the agreement is not assigned, then Licensee agrees to be personally liable for the remaining balance. By signing this Agreement, Licensee is authorizing NF+U to charge their bank account for the monies owed. If the account becomes more than 90 days delinquent, services will be suspended until the account is brought current. Licensee will be charged for all fees costs of collections including attorney's fees. Licensor reserves the right to charge the bank account on file for the amount due, in increments of the authorized monthly amount, in order to keep Licensee's account current.
 
Arbitration
(a) Any dispute, question or difference arising between the parties to this Agreement in connection with this Agreement or otherwise in regard to the relationship of the parties hereto by virtue of the terms in this Agreement, including the construction and scope of this Agreement, that cannot be amicably resolved between the Licensor and Licensee shall be finally settled in accordance with Commercial Arbitration rules and regulations of the American Arbitration Association ("Association") then in effect by one or more arbitrators mutually selected by the parties from the commercial panel of the Association. The arbitrator(s) to be appointed shall be English speaking persons. The arbitrator(s) shall have the power to extend time for pronouncing the award with the consent of the parties. Judgment upon an arbitration may be entered in any court having competent jurisdiction thereof, and shall be binding, final and non-appealable. The arbitrator(s) shall have the power to award any and all remedies and relief whatsoever that is deemed appropriate under the circumstances, including, but not limited to, money damages and injunctive relief. (b)This arbitration provision shall be deemed to be self-executing and shall remain in full force and effect after the expiration or termination of this Agreement. In the event any party fails to appear at any arbitration proceeding, an award may be entered against such party by default or otherwise notwithstanding said failure to appear. The parties hereby consent to arbitration to be held within the City of Phoenix, State of Arizona, and irrevocably agree that all actions or proceedings relating to this Agreement shall take place in the City of Phoenix and waive any objections that they may have based on improper venue or forum non conveniens. The arbitrator(s)' fees in connection with any such arbitration proceeding shall be shared equally among the parties hereto.
 
Jurisdiction
Licensee agrees that this Agreement is governed by and shall be construed in accordance with the laws of the State of Arizona, without reference to conflicts of laws principles. Each of the Parties irrevocably submits to the exclusive jurisdiction of the state and federal courts situated in the State of Arizona for purposes of any suit, action or other proceeding arising out of this Agreement or any transaction contemplated hereby and agrees not to commence any action, suit or proceeding relating hereto except in such courts. Licensee also agrees that the parties shall attempt to mediate any disagreement before filing any lawsuit.
 
Severability
If any provision of this Agreement is held to be invalid or unenforceable, that provision shall be eliminated or limited to the minimum extent necessary such that the intent of the parties is effectuated, and the remainder of this agreement shall have full force and effect.
 
Force Majeure
Neither party will be responsible for failure or delay of access, events, and trainings if caused by an act of war, hostility, or sabotage, act of God, electrical, internet, or telecommunication outage that is not caused by the obligated party, government restrictions, or other event outside the reasonable control of the obligated party. Each party will use reasonable efforts to mitigate the effect of a force majeure event.
 
Confidentiality
All confidential information, including, but not limited to, any business, technical, financial, and customer information, disclosed by one party to the other during negotiation or the effective term of this Agreement which is marked "Confidential," will remain the sole property of the disclosing party, and each party will keep in confidence and not use or disclose such proprietary information of the other party without express written permission of the disclosing party.
 
Binding
Licensee warrants and represents that by signing below, that he/she is the duly authorized agent with the capacity to bind the Licensee business/company to the terms of this contract. Any usage of the digital products constitutes ratification of this Agreement. General Managers may bind this Agreement and any use of the digital content ratifies this Agreement.
 
Entire Agreement
This Agreement does not create an exclusive agreement between the Licensee and Licensor. Both have the right to recommend similar products and services of third parties and to work with other parties in connection with the design, sale, installation, implementation and use of similar services and products of third parties.
 
Notices
The addresses designated below in this section are the addresses by which Notices shall be sent regarding the Terms of this Contract, including, but not limited to, Licensor's changes in the terms, service of process, address changes and updating contact information.`;

  if (currentStep === 1) {
    return (
      <div className="space-y-4">
        {/* Progress indicator */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
          <span className="px-2 py-1 bg-primary text-primary-foreground rounded">1</span>
          <span>Registration Details</span>
          <span>→</span>
          <span className="px-2 py-1 bg-muted rounded">2</span>
          <span>Terms & Conditions</span>
        </div>

        {planDetails && (
          <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
            <h3 className="font-semibold text-blue-800">Selected Plan: {planDetails.name}</h3>
            <p className="text-sm text-blue-600">${(planDetails.price_cents / 100).toFixed(0)}/month • Up to {planDetails.max_users} users</p>
          </div>
        )}
        
        <form onSubmit={handleNextStep} className="space-y-4">
          <PersonalInfoFields
            firstName={formData.firstName}
            lastName={formData.lastName}
            email={formData.email}
            onChange={handleChange}
          />

          <PasswordFields
            password={formData.password}
            confirmPassword={formData.confirmPassword}
            onPasswordChange={handleChange}
            onConfirmPasswordChange={handleChange}
          />

          <UserTypeRadioGroup
            value={formData.userType}
            onChange={handleUserTypeChange}
          />

          <LawFirmField
            value={formData.lawFirmName}
            onChange={handleChange}
          />

          <Button type="submit" className="w-full">
            Next Step
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress indicator */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
        <button 
          onClick={() => setCurrentStep(1)}
          className="px-2 py-1 bg-muted hover:bg-muted/80 rounded flex items-center space-x-1"
        >
          <ChevronLeft className="h-3 w-3" />
          <span>1</span>
        </button>
        <span>Registration Details</span>
        <span>→</span>
        <span className="px-2 py-1 bg-primary text-primary-foreground rounded">2</span>
        <span>Terms & Conditions</span>
      </div>

      {planDetails && (
        <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
          <h3 className="font-semibold text-blue-800">Selected Plan: {planDetails.name}</h3>
          <p className="text-sm text-blue-600">${(planDetails.price_cents / 100).toFixed(0)}/month • Up to {planDetails.max_users} users</p>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Terms and Conditions</h3>
        
        <ScrollArea className="h-64 w-full border rounded-md p-4">
          <pre className="whitespace-pre-wrap text-sm text-muted-foreground">
            {termsAndConditions}
          </pre>
        </ScrollArea>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="terms"
            checked={termsAgreed}
            onCheckedChange={(checked) => setTermsAgreed(checked as boolean)}
          />
          <label
            htmlFor="terms"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            I agree to the Terms and Conditions
          </label>
        </div>

        <form onSubmit={handleCreateAccount} className="space-y-4">
          <Button 
            type="submit" 
            className="w-full" 
            disabled={!termsAgreed || isLoading}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
