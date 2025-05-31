"use client"
import React from 'react';

type StakingInputProps = {
  value: number;
  onChange: (value: number) => void;
  max: number;
  disabled?: boolean;
};

const StakingInput: React.FC<StakingInputProps> = ({
  value,
  onChange,
  max,
  disabled = false,
}) => {
  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (isNaN(newValue)) {
      onChange(0);
    } else {
      onChange(newValue);
    }
  };

  // Set to max amount
  const setMax = () => {
    onChange(max);
  };

  return (
    <div className="relative">
      <input
        type="number"
        value={value || ''}
        onChange={handleChange}
        disabled={disabled}
        min="0"
        max={max}
        step="0.01"
        className="w-full p-3 bg-gray-700 bg-opacity-50 border border-indigo-500/30 rounded-lg
                  text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        placeholder="0.00"
      />
      <button
        onClick={setMax}
        disabled={disabled}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 text-xs
                  bg-indigo-600 rounded text-white hover:bg-indigo-700 transition-colors"
      >
        MAX
      </button>
    </div>
  );
};

export default StakingInput;