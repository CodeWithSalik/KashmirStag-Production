'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/providers/toast-provider';

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          email: formData.get('email'),
          subject: formData.get('subject'),
          message: formData.get('message'),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to send message');
      }

      toast('Your message has been sent successfully. We will get back to you soon!', 'success');
      form.reset();
    } catch (err: any) {
      toast(err.message || 'Something went wrong. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 bg-white p-6 md:p-8 rounded-xl shadow-sm border border-border">
      <h2 className="text-2xl font-bold text-text mb-2">Send us a Message</h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Input 
          label="Your Name" 
          name="name" 
          required 
          placeholder="John Doe" 
        />
        <Input 
          label="Email Address" 
          name="email" 
          type="email" 
          required 
          placeholder="john@example.com" 
        />
      </div>
      
      <Input 
        label="Subject" 
        name="subject" 
        required 
        placeholder="How can we help you?" 
      />
      
      <div className="flex flex-col gap-1.5">
        <label htmlFor="message" className="text-sm font-medium text-text">
          Message <span className="text-error">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 transition-colors"
          placeholder="Please describe your inquiry in detail..."
        />
      </div>
      
      <Button type="submit" size="lg" isLoading={isSubmitting} className="w-full sm:w-auto self-start mt-2">
        Send Message
      </Button>
    </form>
  );
}
