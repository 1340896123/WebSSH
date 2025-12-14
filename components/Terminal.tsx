import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TerminalLine } from '../types';
import { Search, X, ArrowUp, ArrowDown } from 'lucide-react';

interface Props {
  lines: TerminalLine[];
  onCommand: (cmd: string) => void;
  cwd: string;
  user: string;
  host: string;
}

const Terminal: React.FC<Props> = ({ lines, onCommand, cwd, user, host }) => {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const activeMatchRef = useRef<HTMLElement>(null);

  // Auto-scroll to bottom only if not searching or if explicitly at bottom
  // For simplicity, we auto-scroll on new lines unless search is open
  useEffect(() => {
    if (!isSearchOpen) {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [lines, isSearchOpen]);

  // Calculate all matches across all lines
  const matches = useMemo(() => {
    if (!searchQuery) return [];
    const lowerQuery = searchQuery.toLowerCase();
    const result: { lineId: string; start: number; length: number }[] = [];
    
    lines.forEach((line) => {
      // Only search in content
      const content = line.content;
      const lowerContent = content.toLowerCase();
      let startIndex = 0;
      
      while ((startIndex = lowerContent.indexOf(lowerQuery, startIndex)) > -1) {
        result.push({
          lineId: line.id,
          start: startIndex,
          length: lowerQuery.length
        });
        startIndex += lowerQuery.length;
      }
    });
    return result;
  }, [lines, searchQuery]);

  // Reset active index when query changes
  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [searchQuery]);

  // Scroll active match into view
  useEffect(() => {
    if (isSearchOpen && matches.length > 0 && activeMatchRef.current) {
        activeMatchRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentMatchIndex, isSearchOpen, matches.length]);

  const handleMainInputKeyDown = (e: React.KeyboardEvent) => {
    // Open Search with Ctrl+F
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsSearchOpen(true);
        // Defer focus to allow render
        setTimeout(() => searchInputRef.current?.focus(), 0);
        return;
    }

    if (e.key === 'Enter') {
      onCommand(input);
      setInput('');
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          if (e.shiftKey) {
              prevMatch();
          } else {
              nextMatch();
          }
      } else if (e.key === 'Escape') {
          closeSearch();
      }
  };

  const nextMatch = () => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % matches.length);
  };

  const prevMatch = () => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev - 1 + matches.length) % matches.length);
  };

  const closeSearch = () => {
      setIsSearchOpen(false);
      setSearchQuery('');
      // Return focus to terminal
      inputRef.current?.focus();
  };

  const focusInput = (e: React.MouseEvent) => {
    // Prevent focus stealing if clicking inside search box
    if ((e.target as HTMLElement).closest('.search-bar')) return;
    inputRef.current?.focus();
  };

  // Helper to render line with highlights
  const renderLineContent = (line: TerminalLine) => {
    if (!searchQuery || matches.length === 0) return line.content;

    // Filter matches for this specific line
    const lineMatches = matches
        .map((m, idx) => ({ ...m, globalIndex: idx }))
        .filter(m => m.lineId === line.id);
    
    if (lineMatches.length === 0) return line.content;

    const content = line.content;
    const parts = [];
    let lastIndex = 0;

    lineMatches.forEach((match, i) => {
        // Text before match
        if (match.start > lastIndex) {
            parts.push(content.substring(lastIndex, match.start));
        }
        
        const isCurrent = match.globalIndex === currentMatchIndex;
        
        // Match itself
        parts.push(
            <span 
                key={`${line.id}-m-${i}`}
                ref={isCurrent ? activeMatchRef : null}
                className={`${isCurrent ? 'bg-yellow-500 text-gray-900 font-bold' : 'bg-yellow-500/40 text-white'} rounded-[1px]`}
            >
                {content.substring(match.start, match.start + match.length)}
            </span>
        );
        lastIndex = match.start + match.length;
    });

    // Text after last match
    if (lastIndex < content.length) {
        parts.push(content.substring(lastIndex));
    }

    return <>{parts}</>;
  };

  return (
    <div 
      className="flex flex-col h-full bg-[#1e1e1e] text-[#cccccc] font-mono text-sm p-4 overflow-hidden relative" 
      onClick={focusInput}
    >
      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="search-bar absolute top-4 right-8 z-10 flex items-center bg-gray-800 border border-gray-700 shadow-xl rounded-lg p-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
           <div className="relative">
               <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
               <input 
                 ref={searchInputRef}
                 type="text" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 onKeyDown={handleSearchKeyDown}
                 placeholder="Find..."
                 className="bg-gray-900 border border-gray-700 text-white text-xs rounded pl-8 pr-2 py-1.5 w-48 focus:outline-none focus:border-blue-500"
               />
           </div>
           
           <div className="flex items-center text-xs text-gray-400 mx-2 min-w-[50px] justify-center font-mono">
              {matches.length > 0 ? `${currentMatchIndex + 1}/${matches.length}` : '0/0'}
           </div>

           <div className="flex items-center gap-0.5 border-l border-gray-700 pl-1">
             <button 
               onClick={prevMatch}
               className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
               title="Previous (Shift+Enter)"
             >
                <ArrowUp size={14} />
             </button>
             <button 
               onClick={nextMatch}
               className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
               title="Next (Enter)"
             >
                <ArrowDown size={14} />
             </button>
             <button 
               onClick={closeSearch}
               className="p-1 hover:bg-red-900/50 hover:text-red-400 rounded text-gray-400 ml-1 transition-colors"
               title="Close (Esc)"
             >
                <X size={14} />
             </button>
           </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        <div className="text-gray-500 mb-4 select-none">
          WebSSH Pro [Version 1.2.0] <br/>
          (c) 2024 Simulated Environment. All rights reserved. <br/>
          <br/>
          Type 'help' for available commands.
        </div>
        
        {lines.map((line) => (
          <div key={line.id} className="break-words leading-tight">
            {line.type === 'input' && (
               <span className="text-green-400 mr-2 select-none">
                 {user}@{host}:{line.cwd}$
               </span>
            )}
            <span className={line.type === 'error' ? 'text-red-400' : ''}>
              {renderLineContent(line)}
            </span>
          </div>
        ))}
        
        <div className="flex items-center">
          <span className="text-green-400 mr-2 whitespace-nowrap select-none">
            {user}@{host}:{cwd}$
          </span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleMainInputKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-[#cccccc] caret-white"
            autoFocus
            autoComplete="off"
            spellCheck="false"
          />
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default Terminal;