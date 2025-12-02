import React from 'react';
import { TopBar } from './components/TopBar';
import { EditorCanvas } from './components/EditorCanvas';
import { PropertiesPanel } from './components/PropertiesPanel';

const App: React.FC = () => {
  return (
    <div className="flex flex-col h-screen w-full bg-white overflow-hidden font-sans">
      <TopBar />
      <div className="flex flex-1 overflow-hidden relative">
        <EditorCanvas />
        <PropertiesPanel />
      </div>
    </div>
  );
};

export default App;
