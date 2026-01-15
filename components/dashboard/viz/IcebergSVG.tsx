

import React from 'react';

interface IcebergSVGProps {
  highlight?: 'surface' | 'deep' | null;
  activeIndex?: number | null; // Index of the specific item hovered in list
  activeLabel?: string | null; // Label to display (Optional, unused now but kept for compatibility)
  onNodeHover?: (section: 'surface' | 'deep' | null, index: number | null) => void; // New callback
}

export const IcebergSVG: React.FC<IcebergSVGProps> = ({ highlight, activeIndex, onNodeHover }) => {
  const isSurfaceActive = highlight === 'surface';
  const isDeepActive = highlight === 'deep';

  // Hardcoded coordinates for visual nodes to match the iceberg shape
  // Surface: Top part of iceberg
  const surfaceNodes = [
      { cx: 200, cy: 80 },
      { cx: 180, cy: 110 },
      { cx: 220, cy: 120 }
  ];

  // Deep: Submerged part
  const deepNodes = [
      { cx: 180, cy: 180 },
      { cx: 210, cy: 220 },
      { cx: 160, cy: 260 },
      { cx: 230, cy: 280 }
  ];

  const handleEnter = (section: 'surface' | 'deep', index: number) => {
      if (onNodeHover) onNodeHover(section, index);
  };

  const handleLeave = () => {
      if (onNodeHover) onNodeHover(null, null);
  };

  const renderNodes = (nodes: {cx: number, cy: number}[], sectionName: 'surface' | 'deep', isActiveSection: boolean, color: string) => {
      return nodes.map((node, i) => {
          const isActiveNode = isActiveSection && activeIndex === i;
          
          return (
             <g 
                key={i} 
                className={`transition-all duration-300 cursor-pointer ${isActiveSection ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}
                onMouseEnter={() => handleEnter(sectionName, i)}
                onMouseLeave={handleLeave}
             >
                {/* Connector Line (Only when active) */}
                {isActiveNode && (
                   <line 
                     x1={node.cx} y1={node.cy} 
                     x2={400} y2={node.cy} // Extended to the right edge
                     stroke={color} 
                     strokeWidth="1.5" 
                     strokeDasharray="3 3"
                     className="animate-[dash_1s_linear_infinite]"
                     opacity="0.6"
                   />
                )}
                
                {/* Hit Area (Invisible larger circle for easier hovering) */}
                <circle cx={node.cx} cy={node.cy} r="20" fill="transparent" />

                {/* Pulse Ring (When active) */}
                {isActiveNode && (
                   <circle cx={node.cx} cy={node.cy} r="15" fill={color} opacity="0.3">
                      <animate attributeName="r" values="8;20;8" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
                   </circle>
                )}

                {/* The Visible Dot */}
                <circle 
                   cx={node.cx} cy={node.cy} r={isActiveNode ? 6 : 4} 
                   fill={isActiveNode ? '#ffffff' : color} 
                   stroke={color} strokeWidth={isActiveNode ? 2 : 0}
                   className="transition-all duration-300"
                />
             </g>
          );
      });
  };

  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center select-none overflow-hidden pointer-events-none">
       {/* 
          Wrapper div has pointer-events-none to let clicks pass through to background if needed,
          but SVG needs pointer-events-auto for nodes.
       */}
       
       {/* Removed Bobbing Animation to prevent jump on hover transition */}
       <div className={`w-full h-full transition-transform duration-1000 ${isDeepActive ? 'scale-105 translate-y-[-20px]' : isSurfaceActive ? 'scale-105 translate-y-[10px]' : ''}`}>
         {/* 
            ViewBox 0 0 400 420.
         */}
         <svg className="w-full h-full drop-shadow-xl pointer-events-auto" viewBox="0 0 400 420" preserveAspectRatio="xMidYMid meet">
            <defs>
               {/* TIP GRADIENTS: Icy White/Blue */}
               <linearGradient id="tipLight" x1="0" y1="0" x2="0.5" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                  <stop offset="100%" stopColor="#e0f2fe" stopOpacity="1" />
               </linearGradient>
               <linearGradient id="tipShadow" x1="1" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#bae6fd" stopOpacity="1" />
                  <stop offset="100%" stopColor="#7dd3fc" stopOpacity="1" />
               </linearGradient>

               {/* SUBMERGED GRADIENTS: Deep Ocean/Teal with Shimmer */}
               <linearGradient id="submergedCore" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.25" />
                  <stop offset="50%" stopColor="#0891b2" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#164e63" stopOpacity="0.05" />
                  <animate attributeName="x1" values="0;1;0" dur="10s" repeatCount="indefinite" />
               </linearGradient>
               
               {/* Highlight Caustics */}
               <linearGradient id="submergedHighlight" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.3" />
                  <stop offset="40%" stopColor="#0891b2" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#0891b2" stopOpacity="0" />
                  <animate attributeName="x1" values="0;0.5;0" dur="8s" repeatCount="indefinite" />
               </linearGradient>
               
               {/* Filters for underwater effect */}
               <filter id="waterBlur">
                  <feGaussianBlur stdDeviation="3.5" />
               </filter>
               
               <style>{`
                 @keyframes dash {
                   to { stroke-dashoffset: -6; }
                 }
               `}</style>
            </defs>
            
            {/* === SUBMERGED PART (Massive, Blurry, Darker) === */}
            <g transform="translate(0, 140)" className={`transition-all duration-700 ${isDeepActive ? 'opacity-100 filter drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]' : 'opacity-80'}`}>
               {/* Deep Core - Massive Volume */}
               <path d="M150,0 L115,140 L190,230 L250,0 Z" 
                     fill="url(#submergedCore)" stroke="none" />
               <path d="M250,0 L190,230 L285,160 L275,0 Z" 
                     fill="url(#submergedCore)" opacity="0.8" stroke="none" />
               
               {/* Deepest Tip Blur */}
               <path d="M190,230 L135,150 L180,250 L275,160 Z" 
                     fill="#155e75" opacity="0.2" filter="url(#waterBlur)" />

               {/* Underwater Caustics / Highlight (Shimmering) */}
               <path d="M150,0 L190,100 L250,0 Z" fill="url(#submergedHighlight)" />
            </g>

            {/* === SURFACE REFLECTION (Underside of water) === */}
            <path d="M150,140 L200,155 L250,140 L280,140 L200,160 L120,140 Z" 
                  fill="#cffafe" opacity="0.2" filter="url(#waterBlur)" />

            {/* === WATER SURFACE LINE === */}
            <path d="M20,140 C120,142 280,138 380,140" 
                  stroke="rgba(255,255,255,0.4)" strokeWidth="1" fill="none" />

            {/* === SURFACE TIP (Sharp, Bright, Faceted) === */}
            <g className={`transition-all duration-700 ${isSurfaceActive ? 'filter drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]' : ''}`}>
                {/* Left Face (Bright) */}
                <path d="M200,60 L150,140 L210,140 Z" 
                      fill="url(#tipLight)" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.1))" />
                
                {/* Right Face (Shadowed) */}
                <path d="M200,60 L210,140 L250,140 L240,95 Z" 
                      fill="url(#tipShadow)" />
                
                {/* Ridge Highlight */}
                <path d="M200,60 L210,140" stroke="rgba(255,255,255,0.6)" strokeWidth="0.5" />
            </g>

            {/* === INTERACTIVE NODES === */}
            {/* Surface Nodes */}
            {renderNodes(surfaceNodes, 'surface', isSurfaceActive, '#0284c7')} {/* Sky-600 */}
            
            {/* Deep Nodes */}
            <g transform="translate(0, 140)">
               {renderNodes(deepNodes, 'deep', isDeepActive, '#22d3ee')} {/* Cyan-400 */}
            </g>

         </svg>
       </div>
    </div>
  );
};