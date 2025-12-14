import React, { useState, useEffect } from 'react';
import { SSHConnection, SavedConnection } from '../types';
import { Key, Lock, Terminal, Loader2, Save, Trash2, Plus, Server, Monitor } from 'lucide-react';

interface Props {
  onConnect: (config: SSHConnection) => void;
  isConnecting: boolean;
  error?: string;
}

const STORAGE_KEY = 'webssh_saved_connections';

const ConnectionForm: React.FC<Props> = ({ onConnect, isConnecting, error }) => {
  // Saved Connections State
  const [savedConnections, setSavedConnections] = useState<SavedConnection[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Form State
  const [label, setLabel] = useState('');
  const [host, setHost] = useState('192.168.1.100');
  const [username, setUsername] = useState('user');
  const [port, setPort] = useState(22);
  const [authType, setAuthType] = useState<'password' | 'key'>('password');
  const [password, setPassword] = useState('');

  // Load from local storage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSavedConnections(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse saved connections", e);
      }
    }
  }, []);

  const saveToStorage = (connections: SavedConnection[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(connections));
    setSavedConnections(connections);
  };

  const handleSaveProfile = () => {
    if (!label) {
        alert("Please enter a label for this connection.");
        return;
    }

    const newProfile: SavedConnection = {
        id: selectedId || Date.now().toString(),
        label,
        host,
        username,
        port,
        authType
    };

    let newConnections;
    if (selectedId) {
        // Update existing
        newConnections = savedConnections.map(c => c.id === selectedId ? newProfile : c);
    } else {
        // Create new
        newConnections = [...savedConnections, newProfile];
        setSelectedId(newProfile.id);
    }

    saveToStorage(newConnections);
  };

  const handleDeleteProfile = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newConnections = savedConnections.filter(c => c.id !== id);
    saveToStorage(newConnections);
    if (selectedId === id) {
        handleNewConnection();
    }
  };

  const handleLoadProfile = (conn: SavedConnection) => {
    setSelectedId(conn.id);
    setLabel(conn.label);
    setHost(conn.host);
    setUsername(conn.username);
    setPort(conn.port);
    setAuthType(conn.authType);
    setPassword(''); // Never save/load passwords for security in this demo
  };

  const handleNewConnection = () => {
    setSelectedId(null);
    setLabel('');
    setHost('192.168.1.100');
    setUsername('user');
    setPort(22);
    setAuthType('password');
    setPassword('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConnect({
      host,
      username,
      port,
      authType,
      isConnected: false
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 p-4">
      <div className="w-full max-w-4xl bg-gray-900 border border-gray-800 rounded-xl shadow-2xl flex overflow-hidden min-h-[500px]">
        
        {/* Sidebar: Saved Connections */}
        <div className="w-64 bg-gray-950 border-r border-gray-800 flex flex-col">
            <div className="p-4 border-b border-gray-800">
                <button 
                    onClick={handleNewConnection}
                    className="w-full flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors text-sm font-medium border border-gray-700"
                >
                    <Plus size={16} /> New Connection
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {savedConnections.length === 0 && (
                    <div className="text-center py-8 text-gray-600 text-xs">
                        No saved profiles.
                    </div>
                )}
                {savedConnections.map(conn => (
                    <div 
                        key={conn.id}
                        onClick={() => handleLoadProfile(conn)}
                        className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${selectedId === conn.id ? 'bg-blue-900/20 border border-blue-800/50' : 'hover:bg-gray-900 border border-transparent'}`}
                    >
                        <div className="flex items-center overflow-hidden">
                            <div className={`mr-3 p-1.5 rounded-md ${selectedId === conn.id ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-500'}`}>
                                <Server size={14} />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className={`text-sm font-medium truncate ${selectedId === conn.id ? 'text-blue-200' : 'text-gray-300'}`}>{conn.label}</span>
                                <span className="text-xs text-gray-600 truncate">{conn.username}@{conn.host}</span>
                            </div>
                        </div>
                        <button 
                            onClick={(e) => handleDeleteProfile(e, conn.id)}
                            className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                            title="Delete"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </div>

        {/* Main Content: Form */}
        <div className="flex-1 p-8 flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="bg-gray-800 p-2 rounded-lg text-blue-400">
                        <Terminal size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">
                            {selectedId ? 'Edit Connection' : 'New Connection'}
                        </h2>
                        <p className="text-sm text-gray-500">Configure your SSH session details</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
            <div className="space-y-4">
                {/* Label Field */}
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Connection Label</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder-gray-600"
                            placeholder="e.g. My Ubuntu Server"
                        />
                        <Monitor size={16} className="absolute left-3 top-2.5 text-gray-500" />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-400 mb-1">Hostname / IP</label>
                    <input
                        type="text"
                        value={host}
                        onChange={(e) => setHost(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                        placeholder="example.com"
                        required
                    />
                    </div>
                    <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Port</label>
                    <input
                        type="number"
                        value={port}
                        onChange={(e) => setPort(parseInt(e.target.value))}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                        required
                    />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Username</label>
                    <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    placeholder="root"
                    required
                    />
                </div>

                <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
                    <button
                    type="button"
                    onClick={() => setAuthType('password')}
                    className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all ${
                        authType === 'password' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
                    }`}
                    >
                    <Lock size={16} className="mr-2" /> Password
                    </button>
                    <button
                    type="button"
                    onClick={() => setAuthType('key')}
                    className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all ${
                        authType === 'key' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white'
                    }`}
                    >
                    <Key size={16} className="mr-2" /> Private Key
                    </button>
                </div>

                {authType === 'password' ? (
                    <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                        placeholder="••••••••"
                        required={authType === 'password'}
                    />
                    </div>
                ) : (
                    <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Private Key File (PEM/PPK)</label>
                    <div className="relative border-2 border-dashed border-gray-700 rounded-lg p-6 hover:border-blue-500 transition-colors group cursor-pointer text-center">
                        <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            required={authType === 'key'}
                        />
                        <Key className="mx-auto h-8 w-8 text-gray-500 group-hover:text-blue-500 mb-2" />
                        <p className="text-sm text-gray-400">Click to upload or drag & drop</p>
                    </div>
                    </div>
                )}
            </div>

            {error && (
                <div className="mt-4 text-red-400 text-sm bg-red-900/20 p-3 rounded border border-red-900/50">
                {error}
                </div>
            )}

            <div className="flex-1"></div>

            <div className="flex gap-3 mt-8 pt-6 border-t border-gray-800">
                <button
                    type="button"
                    onClick={handleSaveProfile}
                    className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg border border-gray-700 transition-colors flex items-center"
                >
                    <Save size={18} className="mr-2" /> Save Profile
                </button>
                <button
                    type="submit"
                    disabled={isConnecting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center"
                >
                    {isConnecting ? (
                    <>
                        <Loader2 className="animate-spin mr-2" size={20} />
                        Connecting...
                    </>
                    ) : (
                    'Connect'
                    )}
                </button>
            </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default ConnectionForm;