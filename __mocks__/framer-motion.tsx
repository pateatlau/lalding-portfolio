import React, { ReactNode, forwardRef, ComponentProps } from 'react';

type MotionProps = ComponentProps<'div'> & {
  initial?: unknown;
  animate?: unknown;
  exit?: unknown;
  transition?: unknown;
  variants?: unknown;
  whileInView?: unknown;
  viewport?: unknown;
  whileHover?: unknown;
  whileTap?: unknown;
  layoutId?: string;
};

const createMotionComponent = (tag: keyof JSX.IntrinsicElements) => {
  return forwardRef<HTMLElement, MotionProps>(({ children, ...props }, ref) => {
    // Filter out framer-motion specific props
    const {
      initial,
      animate,
      exit,
      transition,
      variants,
      whileInView,
      viewport,
      whileHover,
      whileTap,
      layoutId,
      ...htmlProps
    } = props;
    return React.createElement(tag, { ...htmlProps, ref }, children);
  });
};

export const motion = {
  div: createMotionComponent('div'),
  section: createMotionComponent('section'),
  span: createMotionComponent('span'),
  a: createMotionComponent('a'),
  li: createMotionComponent('li'),
  nav: createMotionComponent('nav'),
  ul: createMotionComponent('ul'),
  p: createMotionComponent('p'),
  h1: createMotionComponent('h1'),
  h2: createMotionComponent('h2'),
  h3: createMotionComponent('h3'),
  img: createMotionComponent('img'),
  button: createMotionComponent('button'),
};

export const useScroll = () => ({
  scrollYProgress: { current: 0 },
});

export const useTransform = () => 0;

export const useSpring = (value: unknown) => value;

export const useMotionValue = (initial: number) => ({
  get: () => initial,
  set: () => {},
  onChange: () => () => {},
});

export const AnimatePresence = ({ children }: { children: ReactNode }) => <>{children}</>;

export const useInView = () => true;
