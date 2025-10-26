import React from 'react'
import "./realButton.css"
import { cn } from '@/lib/utils';
const RealButton = ({children, onClick, className}: {children:React.ReactNode; className: string;onClick: ()=>void; size?: "default" | "sm" | "lg" | "icon" | null | undefined;}) => {
  return (
    <button onClick={onClick} className={cn('button',className)}>
      <div className="button-outer">
        <div className="button-inner">
          <span className='items-center'>{children}</span>
        </div>
      </div>
    </button>
  )
}

export default RealButton