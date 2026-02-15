'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '@/context/theme-context';
import {
  BsSearch,
  BsMoon,
  BsSun,
  BsLinkedin,
  BsGithub,
  BsEnvelope,
  BsDownload,
  BsHouse,
  BsPerson,
  BsFolder,
  BsLightning,
  BsBriefcase,
} from 'react-icons/bs';

interface CommandItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  group: string;
  action: () => void;
  keywords?: string[];
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { theme, toggleTheme } = useTheme();

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  const items: CommandItem[] = [
    {
      id: 'home',
      label: 'Go to Home',
      icon: <BsHouse />,
      group: 'Navigation',
      action: () => {
        document.querySelector('#home')?.scrollIntoView({ behavior: 'smooth' });
        close();
      },
      keywords: ['hero', 'top', 'intro'],
    },
    {
      id: 'about',
      label: 'Go to About',
      icon: <BsPerson />,
      group: 'Navigation',
      action: () => {
        document.querySelector('#about')?.scrollIntoView({ behavior: 'smooth' });
        close();
      },
    },
    {
      id: 'projects',
      label: 'Go to Projects',
      icon: <BsFolder />,
      group: 'Navigation',
      action: () => {
        document.querySelector('#projects')?.scrollIntoView({ behavior: 'smooth' });
        close();
      },
    },
    {
      id: 'skills',
      label: 'Go to Skills',
      icon: <BsLightning />,
      group: 'Navigation',
      action: () => {
        document.querySelector('#skills')?.scrollIntoView({ behavior: 'smooth' });
        close();
      },
    },
    {
      id: 'experience',
      label: 'Go to Experience',
      icon: <BsBriefcase />,
      group: 'Navigation',
      action: () => {
        document.querySelector('#experience')?.scrollIntoView({ behavior: 'smooth' });
        close();
      },
      keywords: ['career', 'work', 'timeline'],
    },
    {
      id: 'contact',
      label: 'Go to Contact',
      icon: <BsEnvelope />,
      group: 'Navigation',
      action: () => {
        document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' });
        close();
      },
    },
    {
      id: 'resume',
      label: 'Download Resume',
      icon: <BsDownload />,
      group: 'Quick Actions',
      action: () => {
        const a = document.createElement('a');
        a.href = '/lalding.pdf';
        a.download = '';
        a.click();
        close();
      },
      keywords: ['cv', 'pdf'],
    },
    {
      id: 'theme',
      label: theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode',
      icon: theme === 'light' ? <BsMoon /> : <BsSun />,
      group: 'Quick Actions',
      action: () => {
        toggleTheme();
        close();
      },
      keywords: ['dark', 'light', 'toggle'],
    },
    {
      id: 'linkedin',
      label: 'Open LinkedIn',
      icon: <BsLinkedin />,
      group: 'Social',
      action: () => {
        window.open(
          'https://www.linkedin.com/in/laldingliana-tv/',
          '_blank',
          'noopener,noreferrer'
        );
        close();
      },
    },
    {
      id: 'github',
      label: 'Open GitHub',
      icon: <BsGithub />,
      group: 'Social',
      action: () => {
        window.open('https://github.com/pateatlau', '_blank', 'noopener,noreferrer');
        close();
      },
    },
  ];

  const filtered = items.filter((item) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      item.label.toLowerCase().includes(q) ||
      item.group.toLowerCase().includes(q) ||
      item.keywords?.some((k) => k.includes(q))
    );
  });

  const groups = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  // Keyboard shortcut to open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        close();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [close]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation within the list
  function handleInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      filtered[selectedIndex]?.action();
    }
  }

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.querySelector('[data-selected="true"]');
    selected?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  let flatIndex = -1;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />

          {/* Dialog */}
          <motion.div
            className="fixed top-[20%] left-1/2 z-[9999] w-[min(90vw,32rem)] -translate-x-1/2 overflow-hidden rounded-xl border border-black/10 bg-white/95 shadow-2xl backdrop-blur-md dark:border-white/10 dark:bg-gray-900/95"
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 border-b border-black/5 px-4 dark:border-white/5">
              <BsSearch className="text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-gray-400 dark:text-white dark:placeholder:text-gray-500"
                placeholder="Type a command or search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleInputKeyDown}
              />
              <kbd className="text-muted-foreground hidden shrink-0 rounded border border-black/10 px-1.5 py-0.5 text-[0.65rem] font-medium sm:inline-block dark:border-white/10">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-72 overflow-y-auto p-2">
              {filtered.length === 0 && (
                <div className="text-muted-foreground py-8 text-center text-sm">
                  No results found
                </div>
              )}
              {Object.entries(groups).map(([group, groupItems]) => (
                <div key={group}>
                  <div className="text-muted-foreground px-3 pt-2 pb-1 text-xs font-semibold uppercase">
                    {group}
                  </div>
                  {groupItems.map((item) => {
                    flatIndex++;
                    const currentIndex = flatIndex;
                    const isSelected = currentIndex === selectedIndex;
                    return (
                      <button
                        key={item.id}
                        data-selected={isSelected}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                          isSelected
                            ? 'bg-accent-teal/10 text-accent-teal dark:bg-accent-teal/15 dark:text-accent-teal-light'
                            : 'text-foreground hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                        onClick={item.action}
                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                      >
                        <span className="shrink-0 text-base">{item.icon}</span>
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
