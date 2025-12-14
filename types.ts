export interface FileSystemNode {
  name: string;
  type: 'file' | 'directory';
  content?: string; // For files
  children?: FileSystemNode[]; // For directories
  permissions: string;
  owner: string;
  size: string;
  date: string;
}

export interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'system';
  content: string;
  cwd?: string;
}

export interface SSHConnection {
  host: string;
  username: string;
  port: number;
  authType: 'password' | 'key';
  isConnected: boolean;
}

export interface SavedConnection {
  id: string;
  label: string;
  host: string;
  username: string;
  port: number;
  authType: 'password' | 'key';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}