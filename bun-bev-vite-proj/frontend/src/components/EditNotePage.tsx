
import React, { useState } from 'react';
import '../styles/EditNotePage.css';
import { useNavigate } from 'react-router-dom';
import {FaHome, FaSave } from 'react-icons/fa';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';



const EditNotePage: React.FC = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');


    const handleSave = () => {
        // Implement save functionality
        console.log('Note saved');
      };

      const modules = {
        toolbar: [
          [{ 'header': [1, 2, false] }],
          ['bold', 'italic', 'underline', 'strike', 'blockquote'],
          [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
          ['link', 'image'],
          ['clean']
        ],
      };
    
      const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike', 'blockquote',
        'list', 'bullet', 'indent',
        'link', 'image'
      ];

  
    return (
        <div className="edit-note-page">
        <div className="top-bar">
          <button onClick={() => navigate('/home')} className="back-button">
            <FaHome /> 
          </button>
  
          <button onClick={handleSave} className="save-button">
            <FaSave /> Save
          </button>
        </div>
        <div className="note-form">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note Title"
            className="note-title-input"

          />
          <ReactQuill 

       theme="snow"
       value={content}
       onChange={setContent}
       modules={modules}
       formats={formats}
       placeholder="Start typing your note here..."
     />
        </div>
      </div>
    );
  };
  
  export default EditNotePage;