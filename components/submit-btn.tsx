import React from 'react';
import { FaPaperPlane } from 'react-icons/fa';
import { useFormStatus } from 'react-dom';

export default function SubmitBtn() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="group focus:outline-accent-teal flex h-12 w-32 cursor-pointer items-center justify-center gap-2 rounded-full bg-gray-900 text-white transition-all outline-none hover:scale-110 hover:bg-gray-950 focus:outline focus:outline-2 focus:outline-offset-2 active:scale-105 disabled:scale-100 disabled:cursor-not-allowed disabled:bg-gray-900/65 dark:bg-white/10"
      disabled={pending}
      title="Submit your message to my email address"
      aria-label={pending ? 'Sending message...' : 'Submit contact form'}
    >
      {pending ? (
        <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
      ) : (
        <>
          Submit{' '}
          <FaPaperPlane className="text-xs opacity-70 transition-all group-hover:translate-x-1 group-hover:-translate-y-1" />{' '}
        </>
      )}
    </button>
  );
}
