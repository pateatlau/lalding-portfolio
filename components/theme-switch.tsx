'use client';

import { useTheme } from '@/context/theme-context';
import React from 'react';
import { BsMoon, BsSun } from 'react-icons/bs';

export default function ThemeSwitch() {
  const { theme, toggleTheme } = useTheme().;

  return (
    <button
      className="fixed bottom-20 right-5 bg-yellow-50 w-[3rem] h-[3rem] bg-opacity-80 backdrop-blur-[0.5rem] border border-yellow-100 border-opacity-40 shadow-2xl rounded-full flex items-center justify-center hover:scale-[1.15] active:scale-105 transition-all dark:bg-gray-950 dark:border-gray-800"
      onClick={toggleTheme}
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {theme === 'light' ? <BsSun /> : <BsMoon />}
    </button>
  );
}
