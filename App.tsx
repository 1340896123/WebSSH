import React, { useState, useEffect, useCallback } from 'react';
import { Terminal as TerminalIcon, FolderOpen, Settings, LogOut, MessageSquare } from 'lucide-react';
import ConnectionForm from './components/ConnectionForm';
import Terminal from './components/Terminal';
import FileManager from './components/FileManager';
import AIChat from './components/AIChat';
import { MockSystem } from './services/mockSys';
import { SSHConnection, TerminalLine, FileSystemNode } from './types';

// Instantiate the mock system outside the component so it persists across re-renders
const mockSystem = new MockSystem();

// Helper for simulating human readable file sizes
function formatBytes(bytes: number, decimals = 1) {
    if (!+bytes) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))}${sizes[i]}`;
}

const App: React.FC = () => {
  const [connection, setConnection] = useState<SSHConnection | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | undefined>();
  
  const [activeTab, setActiveTab] = useState<'terminal' | 'files'>('terminal');
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Terminal State
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([
    { id: '1', type: 'system', content: 'Connecting...', cwd: '~' }
  ]);
  const [cwd, setCwd] = useState('~');

  // File Manager State
  const [fileList, setFileList] = useState<FileSystemNode[]>([]);
  const [fsPath, setFsPath] = useState('/home/user');

  // Handlers
  const handleConnect = (config: SSHConnection) => {
    setIsConnecting(true);
    setConnectError(undefined);

    // Simulate network delay
    setTimeout(() => {
      // Mock validation
      if (config.authType === 'password' && !config.username) { // Simplistic check
         setConnectError("Invalid credentials.");
         setIsConnecting(false);
         return;
      }

      setConnection({ ...config, isConnected: true });
      setIsConnecting(false);
      
      // Init Terminal
      setTerminalLines([
        { id: '1', type: 'system', content: `Authenticated to ${config.host}.`, cwd: '~' },
        { id: '2', type: 'system', content: `Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-91-generic x86_64)`, cwd: '~' },
        { id: '3', type: 'system', content: `\nDocumentation:  https://help.ubuntu.com\nManagement:     https://landscape.canonical.com\nSupport:        https://ubuntu.com/advantage\n`, cwd: '~' },
      ]);
      
      // Init Files
      refreshFiles(fsPath);
    }, 1500);
  };

  const handleDisconnect = () => {
    setConnection(null);
    setTerminalLines([]);
    setIsChatOpen(false);
  };

  const executeCommand = (cmd: string) => {
    // Add input line
    const newLine: TerminalLine = {
      id: Date.now().toString(),
      type: 'input',
      content: cmd,
      cwd: cwd === '/home/user' ? '~' : cwd
    };
    
    // Execute
    const output = mockSystem.executeCommand(cmd);
    const newCwdRaw = mockSystem.getCurrentPathString();
    // Beautify cwd for display
    const displayCwd = newCwdRaw === '/home/user' ? '~' : newCwdRaw;

    const outputLine: TerminalLine = {
      id: (Date.now() + 1).toString(),
      type: 'output',
      content: output,
      cwd: displayCwd
    };

    setTerminalLines(prev => [...prev, newLine, outputLine]);
    setCwd(displayCwd);
    
    // Sync file manager if we moved
    if (cmd.startsWith('cd')) {
        setFsPath(newCwdRaw);
        refreshFiles(newCwdRaw);
    }
  };
  
  const handleAICommand = (cmd: string) => {
    setActiveTab('terminal');
    // Allow UI to switch tab before executing
    setTimeout(() => {
        executeCommand(cmd);
    }, 100);
  };

  const refreshFiles = useCallback((path: string) => {
    const files = mockSystem.listFiles(path);
    setFileList(files);
  }, []);

  const handleNavigateFiles = (newPath: string) => {
    setFsPath(newPath);
    refreshFiles(newPath);
    // Optionally sync terminal cwd?
    // Let's keep them somewhat independent like real SFTP vs SSH clients, 
    // but usually they are separate sessions.
  };

  const handleUploadFile = (file: File) => {
      // Simulate file upload
      const newNode: FileSystemNode = {
          name: file.name,
          type: 'file',
          size: formatBytes(file.size),
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).replace(',', ''),
          permissions: '-rw-r--r--',
          owner: connection?.username || 'user',
          content: `[Binary Content of ${file.name}]` // Placeholder
      };

      const success = mockSystem.addFile(fsPath, newNode);
      if (success) {
          refreshFiles(fsPath);
          // Optional: Notify terminal
          setTerminalLines(prev => [
              ...prev,
              { 
                  id: Date.now().toString(), 
                  type: 'system', 
                  content: `Uploaded ${file.name} to ${fsPath}`, 
                  cwd: cwd 
              }
          ]);
      }
  };

  // Render Login if not connected
  if (!connection?.isConnected) {
    return (
      <ConnectionForm 
        onConnect={handleConnect} 
        isConnecting={isConnecting}
        error={connectError}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen bg-gray-950 overflow-hidden relative">
      {/* Sidebar Navigation */}
      <div className="w-16 flex flex-col items-center py-6 bg-gray-900 border-r border-gray-800 space-y-6 z-10">
        <div className="mb-4">
           <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/50">
             <span className="font-bold text-white">SH</span>
           </div>
        </div>
        
        <button 
          onClick={() => setActiveTab('terminal')}
          className={`p-3 rounded-xl transition-all ${activeTab === 'terminal' ? 'bg-gray-800 text-white shadow-inner' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'}`}
          title="Terminal"
        >
          <TerminalIcon size={24} />
        </button>
        
        <button 
          onClick={() => setActiveTab('files')}
          className={`p-3 rounded-xl transition-all ${activeTab === 'files' ? 'bg-gray-800 text-white shadow-inner' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'}`}
          title="File Manager"
        >
          <FolderOpen size={24} />
        </button>

        <div className="flex-1" />

        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`p-3 rounded-xl transition-all relative ${isChatOpen ? 'bg-purple-900/50 text-purple-300' : 'text-gray-500 hover:text-purple-400 hover:bg-gray-800/50'}`}
          title="AI Assistant"
        >
          <MessageSquare size={24} />
          {!isChatOpen && <span className="absolute top-2 right-2 w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>}
        </button>
        
        <button 
          onClick={handleDisconnect}
          className="p-3 text-gray-500 hover:text-red-400 hover:bg-gray-800/50 rounded-xl transition-all mt-4"
          title="Disconnect"
        >
          <LogOut size={24} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e] relative">
        {/* Top Bar Info */}
        <div className="h-10 bg-gray-900 border-b border-gray-800 flex items-center px-4 justify-between select-none">
          <div className="flex items-center text-sm text-gray-400">
             <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
             {connection.username}@{connection.host}:{connection.port}
          </div>
          <div className="text-xs text-gray-600 font-mono">
             {activeTab === 'terminal' ? 'SSH SESSION' : 'SFTP SESSION'}
          </div>
        </div>

        {/* Workspace */}
        <div className="flex-1 relative overflow-hidden">
           {activeTab === 'terminal' ? (
             <Terminal 
                lines={terminalLines} 
                onCommand={executeCommand}
                cwd={cwd}
                user={connection.username}
                host={connection.host}
             />
           ) : (
             <FileManager 
                currentPath={fsPath}
                files={fileList}
                onNavigate={handleNavigateFiles}
                onRefresh={() => refreshFiles(fsPath)}
                onUpload={handleUploadFile}
             />
           )}
           
           {/* AI Drawer */}
           <div className={`absolute top-0 right-0 h-full transition-transform duration-300 ease-in-out transform ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
              <AIChat 
                isOpen={isChatOpen} 
                onClose={() => setIsChatOpen(false)} 
                onRunCommand={handleAICommand}
              />
           </div>
        </div>
      </div>
    </div>
  );
};

export default App;