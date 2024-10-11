declare module 'react-quill' {
    import React from 'react';
    
    export interface ReactQuillProps {
      value: string;
      onChange: (content: string) => void;
      modules?: any;
      formats?: string[];
      theme?: string;
      placeholder?: string;
    }
    
    const ReactQuill: React.FC<ReactQuillProps>;
    
    export default ReactQuill;
  }