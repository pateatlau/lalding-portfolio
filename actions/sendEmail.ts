'use server';

import React from 'react';
import * as Sentry from '@sentry/nextjs';
import { Resend } from 'resend';
import { validateString, getErrorMessage } from '@/lib/utils';
import ContactFormEmail from '@/email/contact-form-email';
import AcknowledgementEmail from '@/email/acknowledgement-email';

const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
  console.warn(
    'Warning: RESEND_API_KEY environment variable is not set. Email functionality will not work.'
  );
}

const resend = new Resend(RESEND_API_KEY);

export const sendEmail = async (formData: FormData) => {
  return Sentry.withServerActionInstrumentation('sendEmail', {}, async () => {
    const senderName = formData.get('senderName');
    const senderEmail = formData.get('senderEmail');
    const message = formData.get('message');

    // simple server-side validation
    if (!validateString(senderEmail, 500)) {
      return {
        error: 'Invalid sender email',
      };
    }
    if (!validateString(message, 5000)) {
      return {
        error: 'Invalid message',
      };
    }

    // Normalize: trim whitespace and strip CR/LF to prevent email header injection
    const name =
      (validateString(senderName, 200) && senderName.trim().replace(/[\r\n]/g, '')) || undefined;
    const subject = name
      ? `Message from ${name} via Lalding's Portfolio`
      : "Message from Lalding's Portfolio Contact form";

    try {
      const { data, error } = await resend.emails.send({
        from: "Lalding's Portfolio <noreply@lalding.in>",
        to: 'pateatlau@gmail.com',
        subject,
        replyTo: senderEmail,
        react: React.createElement(ContactFormEmail, {
          message: message,
          senderEmail: senderEmail,
          senderName: name,
        }),
      });

      if (error) {
        console.error('Resend API error:', error);
        return { error: error.message };
      }

      // Send acknowledgement email to the sender (fire-and-forget, don't block the response)
      resend.emails
        .send({
          from: "Lalding's Portfolio <noreply@lalding.in>",
          to: senderEmail,
          subject: "Thanks for reaching out — Lalding's Portfolio",
          react: React.createElement(AcknowledgementEmail, {
            senderName: name,
            message: message,
          }),
        })
        .catch((ackError) => {
          console.error('Acknowledgement email failed:', ackError);
        });

      return { data };
    } catch (error: unknown) {
      console.error('Email send failed:', error);
      return {
        error: getErrorMessage(error),
      };
    }
  });
};
