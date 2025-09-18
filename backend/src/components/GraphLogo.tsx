
import React from 'react';
import { LineChart } from "lucide-react";

interface GraphLogoProps {
  size?: number;
}

const GraphLogo: React.FC<GraphLogoProps> = ({ size = 48 }) => {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center justify-center bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl p-3 shadow-lg shadow-blue-600/20">
        <LineChart size={size} strokeWidth={2.5} className="text-white" />
      </div>
      <span className="font-bold text-2xl text-white bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300 drop-shadow-md">StockViz</span>
    </div>
  );
};

export default GraphLogo;
