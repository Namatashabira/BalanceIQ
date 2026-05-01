import React from 'react';
import { motion } from 'framer-motion';

/**
 * Spinning Loader - used while waiting for payment verification
 */
export const SpinningLoader = ({ size = 'large' }) => {
  const sizeClass = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16',
  }[size];

  return (
    <motion.div
      className={`${sizeClass} rounded-full border-4 border-gray-300 border-t-blue-500`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  );
};

/**
 * Envelope Animation - envelope opens and code drops in
 */
export const EnvelopeAnimation = ({ isOpen = false, onComplete = () => {} }) => {
  const envelopeVariants = {
    closed: { rotateX: 0 },
    open: { rotateX: 180 },
  };

  const flap1Variants = {
    closed: { rotateX: 0, originY: 0 },
    open: { rotateX: -60, originY: 0 },
  };

  const flap2Variants = {
    closed: { rotateX: 0, originY: 0 },
    open: { rotateX: 60, originY: 0 },
  };

  const letterVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: -10,
      opacity: 1,
      transition: { delay: 0.3, duration: 0.4 },
    },
  };

  return (
    <div className="relative w-24 h-16 perspective">
      <motion.div
        className="relative w-full h-full"
        initial="closed"
        animate={isOpen ? 'open' : 'closed'}
        variants={envelopeVariants}
        transition={{ duration: 0.6 }}
        onAnimationComplete={() => {
          if (isOpen) onComplete();
        }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Envelope Body */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg shadow-lg" />

        {/* Top Flap */}
        <motion.div
          className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-blue-500 to-blue-600 origin-top rounded-t-lg"
          variants={flap1Variants}
          transition={{ duration: 0.5 }}
        />

        {/* Bottom Flap */}
        <motion.div
          className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-blue-500 to-blue-600 origin-bottom rounded-b-lg"
          variants={flap2Variants}
          transition={{ duration: 0.5 }}
        />

        {/* Letter inside */}
        <motion.div
          className="absolute inset-2 bg-white rounded flex items-center justify-center text-xs font-bold text-blue-600"
          variants={letterVariants}
        >
          ✓ CODE
        </motion.div>
      </motion.div>
    </div>
  );
};

/**
 * Code Drop Animation - code falls into input field
 */
export const CodeDropAnimation = ({ code, isVisible = false }) => {
  const dropVariants = {
    hidden: { y: -100, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15,
        duration: 0.6,
      },
    },
  };

  if (!isVisible) return null;

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      variants={dropVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="bg-blue-500 text-white font-bold text-lg px-3 py-2 rounded shadow-lg">
        {code}
      </div>
    </motion.div>
  );
};

/**
 * Countdown Timer
 */
export const CountdownTimer = ({ expiresAt }) => {
  const [timeLeft, setTimeLeft] = React.useState('');

  React.useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const delta = expiry - now;

      if (delta <= 0) {
        setTimeLeft('Expired');
        return;
      }

      const hours = Math.floor((delta / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((delta / (1000 * 60)) % 60);
      const seconds = Math.floor((delta / 1000) % 60);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
      Expires in: <span className="text-blue-600 dark:text-blue-400 font-bold">{timeLeft}</span>
    </div>
  );
};

/**
 * Success Checkmark Animation
 */
export const SuccessCheckmark = () => {
  const checkVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: { duration: 0.5, ease: 'easeInOut' },
    },
  };

  const circleVariants = {
    hidden: { scale: 0 },
    visible: {
      scale: 1,
      transition: { duration: 0.3 },
    },
  };

  return (
    <motion.svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      initial="hidden"
      animate="visible"
    >
      <motion.circle
        cx="40"
        cy="40"
        r="38"
        fill="none"
        stroke="#10b981"
        strokeWidth="3"
        variants={circleVariants}
      />
      <motion.path
        d="M 25 40 L 35 50 L 55 30"
        fill="none"
        stroke="#10b981"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={checkVariants}
      />
    </motion.svg>
  );
};
