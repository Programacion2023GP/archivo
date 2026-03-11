import React from "react";
import './responsive.css'
import type { ColProps, RowProps } from "./types";
export const RowComponent: React.FC<RowProps> = ({ children }) => {
  return (
    <div className="flex flex-row flex-wrap w-full ">
      {children}
    </div>
  );
};
  
 // ColComponent.tsx



// ColComponent con clases responsivas usando las clases definidas en CSS
export const ColComponent: React.FC<ColProps> = ({
  children,
  id,
  responsive = { sm: 12, md: 12, lg: 12, xl: 12, "2xl": 12 },
  autoPadding=true,
  ...props
}) => {
  // useEffect(()=>{
  // },[responsive])
  return (
    <div
      id={id}
      className={`col sm-${responsive.sm} md-${responsive.md} lg-${responsive.lg} xl-${responsive.xl} xl2-${responsive["2xl"]} ${autoPadding && 'pl-4 pr-4'}  `}
      {...props}
    >
      {children}
    </div>
  );
};

  
  
  // RowComponent.tsx
  
 