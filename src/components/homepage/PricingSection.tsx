
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const PricingSection = () => {
  const navigate = useNavigate();

  const pricingPlans = [
    {
      name: "Starter Package",
      users: "1-5 users",
      price: "200",
      period: "Per Month",
      features: [
        "Requires 12 month subscription",
        "1 Live Coaching Session Per Month"
      ],
      buttonText: "Get Started",
      description: "Click the button above if you're ready to transform your immigration law firm!",
      isPopular: false,
      planId: "starter"
    },
    {
      name: "Law Firms",
      users: "6-10 users",
      price: "180",
      period: "Per Month",
      features: [
        "Requires 12 month subscription",
        "1 Live Coaching Session Per Month"
      ],
      buttonText: "Get Started",
      description: "Click the button above if you're ready to transform your immigration law firm!",
      isPopular: true,
      planId: "law-firms"
    },
    {
      name: "Enterprise",
      users: "11+ users",
      price: "170",
      period: "Per Month",
      features: [
        "Requires 12 month subscription",
        "1 Live Coaching Session Per Month"
      ],
      buttonText: "Get Started",
      description: "Click the button above if you're ready to transform your immigration law firm!",
      isPopular: false,
      planId: "enterprise"
    }
  ];

  const handlePlanSelect = (planId: string) => {
    navigate(`/auth?plan=${planId}`);
  };

  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingPlans.map((plan, index) => (
            <div key={index} className="relative">
              {/* Popular badge */}
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div style={{ backgroundColor: '#213C82' }} className="text-white px-6 py-2 rounded-full text-sm font-semibold">
                    POPULAR
                  </div>
                </div>
              )}
              
              {/* Card */}
              <div className={`bg-gradient-to-br ${
                plan.name === "Starter Package" 
                  ? "from-pink-500 to-purple-600" 
                  : plan.name === "Law Firms"
                  ? "to-purple-600"
                  : "from-purple-500 to-pink-600"
              } text-white p-8 rounded-lg h-full flex flex-col`}
              style={plan.name === "Law Firms" ? { 
                background: `linear-gradient(to bottom right, #213C82, #9333ea)` 
              } : {}}>
                
                {/* Header */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-lg opacity-90">{plan.users}</p>
                </div>

                {/* Pricing */}
                <div className="text-center mb-8">
                  <div className="flex items-start justify-center">
                    <span className="text-2xl">$</span>
                    <span className="text-6xl font-bold">{plan.price}</span>
                  </div>
                  <p className="text-lg opacity-90">{plan.period}</p>
                </div>

                {/* Features */}
                <div className="flex-grow mb-8">
                  <ul className="space-y-4 text-center">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="text-sm opacity-90">
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Button */}
                <div className="text-center mb-6">
                  <Button 
                    className="text-black font-semibold px-8 py-3 rounded-md w-full transition-colors"
                    style={{ backgroundColor: '#FFDA00' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E6C400'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFDA00'}
                    onClick={() => handlePlanSelect(plan.planId)}
                  >
                    {plan.buttonText}
                  </Button>
                </div>

                {/* Description */}
                <div className="text-center">
                  <p className="text-sm opacity-90">{plan.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
