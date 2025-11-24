import React from 'react';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    return (
        <div className="flex h-screen p-4 max-w-[1600px] mx-auto">
            <Sidebar />
            <main className="flex-1 h-full min-w-0">
                {children}
            </main>
        </div>
    );
};

export default DashboardLayout;
