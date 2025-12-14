import { FileSystemNode } from '../types';

// Initial Mock File System State
const initialFileSystem: FileSystemNode = {
  name: 'root',
  type: 'directory',
  permissions: 'drwxr-xr-x',
  owner: 'root',
  size: '4096',
  date: 'Oct 25 10:00',
  children: [
    {
      name: 'home',
      type: 'directory',
      permissions: 'drwxr-xr-x',
      owner: 'root',
      size: '4096',
      date: 'Oct 25 10:00',
      children: [
        {
          name: 'user',
          type: 'directory',
          permissions: 'drwxr-xr-x',
          owner: 'user',
          size: '4096',
          date: 'Oct 25 10:01',
          children: [
            {
              name: 'documents',
              type: 'directory',
              permissions: 'drwxr-xr-x',
              owner: 'user',
              size: '4096',
              date: 'Oct 26 14:30',
              children: [
                {
                  name: 'project_notes.txt',
                  type: 'file',
                  permissions: '-rw-r--r--',
                  owner: 'user',
                  size: '1.2k',
                  date: 'Oct 26 14:32',
                  content: 'These are the notes for the secret project.\nStatus: Ongoing\nPriority: High'
                },
                {
                  name: 'todo.md',
                  type: 'file',
                  permissions: '-rw-r--r--',
                  owner: 'user',
                  size: '340',
                  date: 'Oct 27 09:15',
                  content: '- [ ] Refactor backend\n- [ ] Fix CSS bugs\n- [x] Deploy to production'
                }
              ]
            },
            {
              name: 'config.json',
              type: 'file',
              permissions: '-rw-r--r--',
              owner: 'user',
              size: '512',
              date: 'Oct 25 11:20',
              content: '{\n  "theme": "dark",\n  "notifications": true,\n  "version": "1.0.4"\n}'
            }
          ]
        }
      ]
    },
    {
      name: 'var',
      type: 'directory',
      permissions: 'drwxr-xr-x',
      owner: 'root',
      size: '4096',
      date: 'Oct 24 08:00',
      children: [
        {
          name: 'log',
          type: 'directory',
          permissions: 'drwxr-xr-x',
          owner: 'root',
          size: '4096',
          date: 'Oct 24 08:00',
          children: [
            {
              name: 'syslog',
              type: 'file',
              permissions: '-rw-r-----',
              owner: 'syslog',
              size: '24M',
              date: 'Oct 27 15:45',
              content: 'Oct 27 15:45:01 server CRON[1234]: (root) CMD (cd / && run-parts --report /etc/cron.hourly)'
            }
          ]
        }
      ]
    },
    {
        name: 'etc',
        type: 'directory',
        permissions: 'drwxr-xr-x',
        owner: 'root',
        size: '4096',
        date: 'Oct 20 12:00',
        children: [
            {
                name: 'passwd',
                type: 'file',
                permissions: '-rw-r--r--',
                owner: 'root',
                size: '1024',
                date: 'Oct 20 12:00',
                content: 'root:x:0:0:root:/root:/bin/bash\nuser:x:1000:1000:user,,,:/home/user:/bin/bash'
            }
        ]
    }
  ]
};

// Helper to deep copy to avoid mutation bugs during simulation
const cloneFS = (node: FileSystemNode): FileSystemNode => JSON.parse(JSON.stringify(node));

export class MockSystem {
  private root: FileSystemNode;
  private currentPath: string[];

  constructor() {
    this.root = cloneFS(initialFileSystem);
    this.currentPath = ['home', 'user']; // Start in /home/user
  }

  getCurrentPathString(): string {
    return '/' + this.currentPath.join('/');
  }

  private findNode(path: string[]): FileSystemNode | null {
    let current = this.root;
    if (path.length === 0) return current;

    for (const segment of path) {
      if (!current.children) return null;
      const next = current.children.find(c => c.name === segment);
      if (!next) return null;
      current = next;
    }
    return current;
  }

  // Resolve absolute or relative path to a node
  private resolvePath(pathStr: string): { node: FileSystemNode | null, parts: string[] } {
    const isAbsolute = pathStr.startsWith('/');
    const parts = pathStr.split('/').filter(p => p.length > 0 && p !== '.');
    
    let targetPath: string[] = [];
    
    if (isAbsolute) {
        targetPath = [];
    } else {
        targetPath = [...this.currentPath];
    }

    for (const part of parts) {
        if (part === '..') {
            if (targetPath.length > 0) targetPath.pop();
        } else {
            targetPath.push(part);
        }
    }

    return { node: this.findNode(targetPath), parts: targetPath };
  }

  executeCommand(cmdStr: string): string {
    const args = cmdStr.trim().split(/\s+/);
    const cmd = args[0];

    if (!cmd) return '';

    if (cmd === 'ls') {
        const target = args[1] ? this.resolvePath(args[1]).node : this.findNode(this.currentPath);
        if (!target) return `ls: cannot access '${args[1]}': No such file or directory`;
        if (target.type === 'file') return target.name;
        return target.children?.map(c => c.name).join('  ') || '';
    }

    if (cmd === 'cd') {
        if (!args[1]) {
            this.currentPath = ['home', 'user'];
            return '';
        }
        const { node, parts } = this.resolvePath(args[1]);
        if (!node || node.type !== 'directory') {
            return `cd: ${args[1]}: No such file or directory`;
        }
        this.currentPath = parts;
        return '';
    }

    if (cmd === 'pwd') {
        return this.getCurrentPathString();
    }

    if (cmd === 'cat') {
        if (!args[1]) return 'cat: missing operand';
        const { node } = this.resolvePath(args[1]);
        if (!node) return `cat: ${args[1]}: No such file or directory`;
        if (node.type === 'directory') return `cat: ${args[1]}: Is a directory`;
        return node.content || '';
    }

    if (cmd === 'echo') {
        return args.slice(1).join(' ');
    }

    if (cmd === 'whoami') {
        return 'user';
    }
    
    if (cmd === 'help') {
        return `Available commands: ls, cd, pwd, cat, echo, whoami, help.
This is a simulated environment.`;
    }

    return `${cmd}: command not found`;
  }

  // File Manager Specific Methods
  listFiles(pathStr: string): FileSystemNode[] {
    // If path is root '/', pass empty array
    const parts = pathStr === '/' ? [] : pathStr.split('/').filter(Boolean);
    const node = this.findNode(parts);
    if (node && node.type === 'directory' && node.children) {
        return node.children;
    }
    return [];
  }

  addFile(dirPath: string, fileNode: FileSystemNode): boolean {
    const { node } = this.resolvePath(dirPath);
    if (node && node.type === 'directory') {
        if (!node.children) node.children = [];
        // Check if file already exists
        const existsIndex = node.children.findIndex(c => c.name === fileNode.name);
        if (existsIndex >= 0) {
            node.children[existsIndex] = fileNode; // Overwrite
        } else {
            node.children.push(fileNode);
        }
        return true;
    }
    return false;
  }
}