import React, { useEffect, useState, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface MermaidDiagramProps {
  chart: string;
}

declare global {
  interface Window {
    mermaid: any;
  }
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart }) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const id = useRef(`mermaid-${Math.random().toString(36).substr(2, 9)}`).current;
  
  // Zoom & Pan state
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.mermaid) {
      setError("Mermaid library not found");
      return;
    }

    try {
      window.mermaid.initialize({
        startOnLoad: false,
        theme: 'neutral',
        securityLevel: 'loose',
        fontFamily: 'Inter, sans-serif',
        logLevel: 'error',
      });
    } catch (e) {
      // Ignore initialization errors if already initialized
    }

    const renderDiagram = async () => {
      try {
        const { svg } = await window.mermaid.render(id, chart);
        setSvg(svg);
        setError(null);
        // Reset view on new chart render
        setScale(1);
        setPosition({ x: 0, y: 0 });
      } catch (e: any) {
        console.error("Mermaid render error", e);
        const message = e instanceof Error ? e.message : "Syntax error in diagram definition";
        setError(message);
      }
    };

    renderDiagram();
  }, [chart, id]);

  const handleZoomIn = () => setScale(s => Math.min(s + 0.2, 3));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.2, 0.5));
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  const handleMouseLeave = () => {
    setIsDragging(false);
  }

  // Handle wheel zoom (Ctrl + Scroll)
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey) {
        // Prevent default browser zoom
        // Note: setting passive: false in React is tricky, so this relies on browser behavior
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setScale(s => Math.max(0.5, Math.min(3, s + delta)));
    }
  }

  if (error) {
    return (
      <div className="my-6 p-4 border border-red-200 bg-red-50 rounded-lg text-sm text-red-700 font-mono">
        <p className="font-bold mb-2">Diagram Rendering Error</p>
        <p className="mb-4">{error}</p>
        <div className="bg-white p-2 border border-red-100 rounded opacity-75 overflow-x-auto">
           <pre>{chart}</pre>
        </div>
      </div>
    );
  }

  if (!svg) {
    return (
        <div className="my-8 h-32 bg-gray-50 animate-pulse rounded-lg flex items-center justify-center text-gray-400 text-sm font-medium border border-gray-100">
            Rendering Diagram...
        </div>
    );
  }

  return (
    <div className="my-8 rounded-xl border border-gray-200 shadow-sm bg-gray-50 overflow-hidden relative group select-none">
       <div 
         ref={containerRef}
         className="p-6 min-h-[300px] flex items-center justify-center transition-cursor w-full h-full"
         onMouseDown={handleMouseDown}
         onMouseMove={handleMouseMove}
         onMouseUp={handleMouseUp}
         onMouseLeave={handleMouseLeave}
         onWheel={handleWheel}
         style={{
            cursor: isDragging ? 'grabbing' : 'grab',
            backgroundImage: 'radial-gradient(#d1d5db 1px, transparent 1px)',
            backgroundSize: '20px 20px'
         }}
       >
         <div 
            style={{ 
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              transformOrigin: 'center center'
            }}
            dangerouslySetInnerHTML={{ __html: svg }} 
         />
       </div>
       
       {/* Toolbar */}
       <div className="absolute bottom-4 right-4 flex items-center space-x-1 bg-white p-1 rounded-lg border border-gray-200 shadow-md transition-opacity duration-200 opacity-90 hover:opacity-100">
          <button 
            onClick={handleZoomOut}
            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-gray-500 w-10 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button 
            onClick={handleZoomIn}
            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-gray-200 mx-1"></div>
          <button 
            onClick={handleReset}
            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
       </div>
    </div>
  );
};