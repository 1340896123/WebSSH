import React, { useState, useRef, ChangeEvent } from 'react';
import { FileSystemNode } from '../types';
import { Folder, FileText, ChevronRight, Home, RefreshCw, FolderOpen, Upload } from 'lucide-react';

interface Props {
  currentPath: string;
  files: FileSystemNode[];
  onNavigate: (path: string) => void;
  onRefresh: () => void;
  onUpload: (file: File) => void;
}

const FileManager: React.FC<Props> = ({ currentPath, files, onNavigate, onRefresh, onUpload }) => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDoubleClick = (file: FileSystemNode) => {
    if (file.type === 'directory') {
      // Very simple path join logic for the mock
      const newPath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`;
      onNavigate(newPath);
    }
  };

  const goUp = () => {
    if (currentPath === '/') return;
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
    onNavigate(parentPath);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        onUpload(e.target.files[0]);
        // Reset input value to allow uploading the same file again if needed
        e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-300">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileChange} 
      />

      {/* Toolbar */}
      <div className="flex items-center p-3 border-b border-gray-800 bg-gray-850 gap-2">
        <button 
            onClick={onRefresh} 
            className="p-1.5 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white"
            title="Refresh"
        >
          <RefreshCw size={16} />
        </button>
        <button 
            onClick={handleUploadClick} 
            className="p-1.5 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white"
            title="Upload File"
        >
          <Upload size={16} />
        </button>
        <button onClick={goUp} disabled={currentPath === '/'} className="p-1.5 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white disabled:opacity-30">
           <ChevronRight size={16} className="rotate-180" />
        </button>
        
        <div className="flex-1 flex items-center bg-gray-950 border border-gray-700 rounded px-3 py-1.5 text-sm">
          <Home size={14} className="mr-2 text-blue-500" />
          <span className="truncate">{currentPath}</span>
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-2">
        {files.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-full text-gray-500">
             <FolderOpen size={48} className="mb-2 opacity-50" />
             <p>Empty directory</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 gap-1">
            {/* Header for list view */}
             <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-semibold text-gray-500 border-b border-gray-800">
                <div className="col-span-6">Name</div>
                <div className="col-span-2">Size</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2 text-right">Permissions</div>
             </div>
            
            {files.map((file, idx) => (
              <div 
                key={idx}
                onDoubleClick={() => handleDoubleClick(file)}
                className="grid grid-cols-12 gap-2 items-center px-3 py-2 hover:bg-gray-800 rounded cursor-pointer text-sm group"
              >
                <div className="col-span-6 flex items-center truncate">
                   {file.type === 'directory' ? (
                     <Folder size={18} className="text-yellow-500 mr-2 flex-shrink-0" fill="currentColor" fillOpacity={0.2} />
                   ) : (
                     <FileText size={18} className="text-blue-400 mr-2 flex-shrink-0" />
                   )}
                   <span className="group-hover:text-white transition-colors truncate">{file.name}</span>
                </div>
                <div className="col-span-2 text-gray-500 text-xs">{file.size}</div>
                <div className="col-span-2 text-gray-500 text-xs capitalize">{file.type}</div>
                <div className="col-span-2 text-gray-500 text-xs text-right font-mono">{file.permissions}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Status Bar */}
      <div className="bg-gray-950 border-t border-gray-800 px-3 py-1 text-xs text-gray-500 flex justify-between">
         <span>{files.length} items</span>
         <span>Simulated File System</span>
      </div>
    </div>
  );
};

export default FileManager;