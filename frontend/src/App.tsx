import React from 'react';
import ChatInterface from './components/ChatInterface';
import DashboardLayout from './components/DashboardLayout';

function App() {
  return (
    <div className="min-h-screen bg-tech-bg relative overflow-hidden font-sans text-white">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Hexagonal Grid Overlay */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(#39C5BB 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
        </div>

        {/* Glowing Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-miku/20 rounded-full blur-[100px] animate-pulse-glow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-magenta/20 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 h-screen">
        <DashboardLayout>
          <ChatInterface />
        </DashboardLayout>
      </div>
    </div>
  );
}

export default App;
