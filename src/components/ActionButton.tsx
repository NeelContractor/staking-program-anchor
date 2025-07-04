"use client"
import React from 'react';
import { motion } from 'framer-motion';

type ActionButtonProps = {
  children: React.ReactNode;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
};

const ActionButton: React.FC<ActionButtonProps> = ({
  children,
  onClick,
  loading = false,
  disabled = false,
  icon,
  className = '',
}) => {
  return (
    <motion.button
      className={`flex items-center justify-center px-4 py-3 rounded-lg font-medium text-white 
                shadow-md transition-all duration-300 ease-in-out ${className}
                ${disabled || loading ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-lg'}`}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white\" xmlns="http://www.w3.org/2000/svg\" fill="none\" viewBox="0 0 24 24">
          <circle className="opacity-25\" cx="12\" cy="12\" r="10\" stroke="currentColor\" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        icon
      )}
      {children}
    </motion.button>
  );
};

export default ActionButton;