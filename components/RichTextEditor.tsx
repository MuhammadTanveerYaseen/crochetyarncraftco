'use client';

import React, { useEffect, useRef, useState } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  Undo, 
  Redo, 
  Eraser 
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder = 'Write your rich description here...' }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeStates, setActiveStates] = useState({
    bold: false,
    italic: false,
    underline: false,
    bulletList: false,
    orderedList: false,
    h1: false,
    h2: false,
    h3: false,
  });

  // Track selection state to highlight active formatting in toolbar
  const updateActiveStates = () => {
    if (typeof window === 'undefined' || !editorRef.current) return;
    
    const selection = window.getSelection();
    const isHeadingActive = (tagName: string) => {
      if (!selection || selection.rangeCount === 0) return false;
      let node = selection.anchorNode;
      while (node && node !== editorRef.current) {
        if (node.nodeName === tagName) return true;
        node = node.parentNode;
      }
      return false;
    };

    setActiveStates({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      bulletList: document.queryCommandState('insertUnorderedList'),
      orderedList: document.queryCommandState('insertOrderedList'),
      h1: isHeadingActive('H1'),
      h2: isHeadingActive('H2'),
      h3: isHeadingActive('H3'),
    });
  };

  // Sync external value with editor content without resetting cursor
  useEffect(() => {
    if (editorRef.current) {
      const currentHTML = editorRef.current.innerHTML;
      // Normalize empty/initial state to standard empty paragraph to keep formatting neat
      const targetHTML = value || '<p><br></p>';
      if (currentHTML !== targetHTML && value !== currentHTML) {
        editorRef.current.innerHTML = targetHTML;
      }
    }
  }, [value]);

  // Set default paragraph separator on mount
  useEffect(() => {
    if (typeof document !== 'undefined') {
      try {
        document.execCommand('defaultParagraphSeparator', false, 'p');
      } catch (e) {
        console.warn('Failed to set default paragraph separator:', e);
      }
    }
  }, []);

  const handleInput = () => {
    if (editorRef.current) {
      let html = editorRef.current.innerHTML;
      
      // Clean up browser garbage if editor is completely emptied
      if (html === '<p><br></p>' || html === '<br>' || html === '') {
        html = '';
      }
      
      onChange(html);
      updateActiveStates();
    }
  };

  // Execute formatting command and restore/keep focus in editable area
  const executeCommand = (command: string, arg: string | undefined = undefined) => {
    if (typeof document === 'undefined') return;
    
    // Focus the editor first to ensure command targets correct element
    editorRef.current?.focus();
    
    try {
      if (command === 'formatBlock' && arg) {
        // Toggle heading tags if already active
        const isHeading = activeStates[arg.toLowerCase().replace(/[^a-z0-9]/g, '') as keyof typeof activeStates];
        if (isHeading) {
          document.execCommand('formatBlock', false, '<p>');
        } else {
          document.execCommand('formatBlock', false, `<${arg}>`);
        }
      } else {
        document.execCommand(command, false, arg);
      }
    } catch (e) {
      console.error('Command execution failed:', e);
    }
    
    handleInput();
  };

  const toolbarButtons = [
    { 
      label: 'Bold', 
      icon: Bold, 
      active: activeStates.bold, 
      action: () => executeCommand('bold') 
    },
    { 
      label: 'Italic', 
      icon: Italic, 
      active: activeStates.italic, 
      action: () => executeCommand('italic') 
    },
    { 
      label: 'Underline', 
      icon: Underline, 
      active: activeStates.underline, 
      action: () => executeCommand('underline') 
    },
    { type: 'separator' },
    { 
      label: 'Heading 1', 
      icon: Heading1, 
      active: activeStates.h1, 
      action: () => executeCommand('formatBlock', 'H1') 
    },
    { 
      label: 'Heading 2', 
      icon: Heading2, 
      active: activeStates.h2, 
      action: () => executeCommand('formatBlock', 'H2') 
    },
    { 
      label: 'Heading 3', 
      icon: Heading3, 
      active: activeStates.h3, 
      action: () => executeCommand('formatBlock', 'H3') 
    },
    { type: 'separator' },
    { 
      label: 'Bullet List', 
      icon: List, 
      active: activeStates.bulletList, 
      action: () => executeCommand('insertUnorderedList') 
    },
    { 
      label: 'Numbered List', 
      icon: ListOrdered, 
      active: activeStates.orderedList, 
      action: () => executeCommand('insertOrderedList') 
    },
    { type: 'separator' },
    { 
      label: 'Undo', 
      icon: Undo, 
      active: false, 
      action: () => executeCommand('undo') 
    },
    { 
      label: 'Redo', 
      icon: Redo, 
      active: false, 
      action: () => executeCommand('redo') 
    },
    { 
      label: 'Clear Formatting', 
      icon: Eraser, 
      active: false, 
      action: () => executeCommand('removeFormat') 
    },
  ];

  return (
    <div className="w-full bg-[#FBF7F0] border border-[#EEDDCC] focus-within:border-[#A855F7] rounded-2xl overflow-hidden transition-all flex flex-col min-h-[220px]">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-[#EEDDCC] bg-[#FDFBF7] select-none">
        {toolbarButtons.map((btn, idx) => {
          if (btn.type === 'separator') {
            return <div key={`sep-${idx}`} className="w-[1px] h-5 bg-[#EEDDCC] mx-1" />;
          }

          const IconComponent = btn.icon!;
          return (
            <button
              key={`btn-${idx}`}
              type="button"
              title={btn.label}
              // Prevent stealing focus from the editable area on mouse down
              onMouseDown={(e) => e.preventDefault()}
              onClick={btn.action}
              className={`p-2 rounded-lg transition-all duration-200 cursor-pointer ${
                btn.active
                  ? 'bg-[#A855F7] text-white shadow-xs scale-95'
                  : 'text-[#5C4033]/85 hover:bg-[#FBF7F0] hover:text-[#A855F7]'
              }`}
            >
              <IconComponent className="w-4 h-4" />
            </button>
          );
        })}
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 relative flex flex-col min-h-[160px]">
        {/* Placeholder rendering */}
        {(!value || value === '<p><br></p>') && (
          <div className="absolute top-4 left-4 text-gray-400 text-xs font-normal pointer-events-none select-none">
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onSelect={updateActiveStates}
          onKeyUp={updateActiveStates}
          onMouseUp={updateActiveStates}
          className="flex-1 p-4 text-xs text-[#1F2937] leading-relaxed outline-none min-h-[160px] overflow-y-auto max-h-[400px] select-text rich-text-content"
          style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
        />
      </div>
    </div>
  );
}
