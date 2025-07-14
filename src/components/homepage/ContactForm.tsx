import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ContactFormData {
  name: string;
  email: string;
}

export const ContactForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactFormData>();

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const { error: submitError } = await supabase.functions.invoke('send-contact-form', {
        body: data
      });

      if (submitError) {
        throw submitError;
      }

      setIsSubmitted(true);
      reset();
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setIsSubmitted(false);
      }, 5000);
      
    } catch (err: any) {
      console.error('Error submitting form:', err);
      setError('Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md">
        <p className="font-semibold">Thank you!</p>
        <p>We'll be in touch soon to schedule your call.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
      <div>
        <Label htmlFor="name" className="text-white">Name</Label>
        <Input
          id="name"
          type="text"
          placeholder="Your name"
          className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/60"
          {...register("name", { required: "Name is required" })}
        />
        {errors.name && (
          <p className="text-red-300 text-sm mt-1">{errors.name.message}</p>
        )}
      </div>
      
      <div>
        <Label htmlFor="email" className="text-white">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-white/60"
          {...register("email", { 
            required: "Email is required",
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "Invalid email address"
            }
          })}
        />
        {errors.email && (
          <p className="text-red-300 text-sm mt-1">{errors.email.message}</p>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">
          <p>{error}</p>
        </div>
      )}
      
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-8 py-4 text-lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          "Book a Call to Learn More"
        )}
      </Button>
    </form>
  );
};