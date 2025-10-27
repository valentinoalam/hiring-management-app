import { cn } from '@/lib/utils';
import React, { CSSProperties, ReactNode, useState } from 'react';

interface NeoBrutalismButtonProps {
  text?: string;
  color?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}
const NeoBrutalismButton = ({ 
  text = "Click Me", 
  color = "#FFE74C",
  onClick, 
  disabled = false ,
  type = "button",
  className = '',
  style = {},
  children
}: NeoBrutalismButtonProps) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && onClick) {
      onClick(e);
    }
  };
  return (
    <div className="flex items-center justify-center p-8">
      <button
        type={type}
        disabled={disabled}
        className={cn(`relative font-bold text-lg bg-${color} px-6 py-3 border-4 border-black`,
          isHovered ? 'translate-x-0.5 translate-y-0.5' : 'translate-x-0 translate-y-0',
          isPressed ? 'translate-x-1 translate-y-1' : 'translate-x-0 translate-y-0',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
          disabled ? 'bg-gray-300' : '',
          className
        )}
        style={{
          backgroundColor: disabled ? undefined : color,
          boxShadow: (disabled || isPressed) 
            ? 'none' 
            : (isHovered 
              ? '4px 4px 0 0 rgba(0,0,0,1)'
              : '6px 6px 0 0 rgba(0,0,0,1)'),
          transform: disabled 
            ? 'none' 
            : (isPressed 
              ? 'translate(0.15rem, 0.15rem)' 
              : (isHovered 
                ? 'translate(0.125rem, 0.125rem)' 
                : 'translate(0, 0)')),
          ...style
        }}
        onMouseEnter={() => !disabled && setIsHovered(true)}
        onMouseLeave={() => {
          if (!disabled) {
            setIsHovered(false);
            setIsPressed(false);
          }
        }}
        onMouseDown={() => !disabled && setIsPressed(true)}
        onMouseUp={() => !disabled && setIsPressed(false)}
        onClick={handleClick}
      >
        {children || text}
      </button>
    </div>
  );
};

export default NeoBrutalismButton;