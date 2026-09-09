'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/providers/toast-provider';

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedSubject = formData.subject.trim();
    const trimmedMessage = formData.message.trim();

    const clientErrors: Record<string, string> = {};
    if (trimmedName.length < 2) {
      clientErrors.name = 'Name must be at least 2 characters';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      clientErrors.email = 'Please provide a valid email address';
    }
    if (trimmedSubject.length < 2) {
      clientErrors.subject = 'Subject must be at least 2 characters';
    }
    if (trimmedMessage.length < 5) {
      clientErrors.message = 'Message must be at least 5 characters';
    }

    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      const firstError = Object.values(clientErrors)[0];
      toast(firstError, 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          subject: trimmedSubject,
          message: trimmedMessage,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (Array.isArray(data.errors)) {
          const backendFieldErrors: Record<string, string> = {};
          data.errors.forEach((err: any) => {
            const fieldName = err.path?.[0];
            if (fieldName && typeof err.message === 'string') {
              backendFieldErrors[fieldName] = err.message;
            }
          });
          setFieldErrors(backendFieldErrors);
          const firstMsg = data.errors[0]?.message;
          throw new Error(firstMsg || data.error || 'Failed to send message');
        }

        const errorMsg =
          typeof data.error === 'string'
            ? data.error
            : data.error?.message || 'Failed to send message';
        throw new Error(errorMsg);
      }

      toast('Your message has been sent successfully. We will get back to you soon!', 'success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setFieldErrors({});
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
          value={formData.name}
          onChange={handleChange}
          error={fieldErrors.name}
          required 
          minLength={2}
          placeholder="Your Full Name" 
        />
        <Input 
          label="Email Address" 
          name="email" 
          type="email" 
          value={formData.email}
          onChange={handleChange}
          error={fieldErrors.email}
          required 
          placeholder="yourname@gmail.com" 
        />
      </div>
      
      <Input 
        label="Subject" 
        name="subject" 
        value={formData.subject}
        onChange={handleChange}
        error={fieldErrors.subject}
        required 
        minLength={2}
        placeholder="How can we help you?" 
      />
      
      <Textarea
        label="Message"
        name="message"
        value={formData.message}
        onChange={handleChange}
        error={fieldErrors.message}
        required
        minLength={5}
        rows={5}
        placeholder="Please describe your inquiry in detail (at least 5 characters)..."
      />
      
      <Button type="submit" size="lg" isLoading={isSubmitting} className="w-full sm:w-auto self-start mt-2">
        Send Message
      </Button>
    </form>
  );
}
