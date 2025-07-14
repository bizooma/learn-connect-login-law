import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, CreditCard, HelpCircle } from "lucide-react";

const PaymentCancelled = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Payment Cancelled
        </h1>
        
        <p className="text-gray-600 mb-6">
          Your payment was cancelled. Don't worry, your account is still active and you can try again whenever you're ready.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Need help?</strong> Our support team is here to assist you with any questions about our pricing plans or the payment process.
          </p>
        </div>

        <div className="space-y-3">
          <Link to="/pricing" className="block">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              <CreditCard className="mr-2 h-4 w-4" />
              Try Payment Again
            </Button>
          </Link>
          
          <Link to="/" className="block">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Homepage
            </Button>
          </Link>

          <Link to="/contact" className="block">
            <Button variant="ghost" className="w-full text-gray-600">
              <HelpCircle className="mr-2 h-4 w-4" />
              Contact Support
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelled;