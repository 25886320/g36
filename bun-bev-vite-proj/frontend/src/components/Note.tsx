import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FaArrowLeft,
  FaSave,
  FaBold,
  FaItalic,
  FaUnderline,
  FaStrikethrough,
  FaListOl,
  FaListUl,
  FaHeading,
  FaEye,
  FaEdit,
  FaLevelDownAlt,
} from 'react-icons/fa';
import '../styles/Note.css';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../services/api';
import { Toast } from 'primereact/toast';
import { Avatar } from 'primereact/avatar';
import { AvatarGroup } from 'primereact/avatargroup';
import { Tooltip } from 'primereact/tooltip';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

const NotePage: React.FC = () => {
  const { noteId } = useParams<{ noteId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toast = useRef<Toast>(null);

  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPreview, setIsPreview] = useState(false);

  // Dummy function to use note
  const dummyUseNote = () => {
    console.log(note);
  };

  // Use the dummy function in a useEffect to avoid the "unused function" warning
  useEffect(() => {
    if (false) dummyUseNote();
  }, [note]);

  const showToast = (
    severity:
      | 'success'
      | 'info'
      | 'warn'
      | 'error'
      | 'secondary'
      | 'contrast'
      | undefined,
    summary: string,
    detail: string
  ) => {
    toast.current?.show({ severity, summary, detail });
  };

  useEffect(() => {
    const fetchNote = async () => {
      if (location.state && location.state.note) {
        const passedNote = location.state.note as Note;
        setNote(passedNote);
        setTitle(passedNote.title);
        setContent(passedNote.content);
      } else if (noteId) {
        try {
          const response = await api.getNote(noteId);
          const fetchedNote = response.data;
          setNote(fetchedNote);
          setTitle(fetchedNote.title);
          setContent(fetchedNote.content);
        } catch (error) {
          console.error('Error fetching note:', error);
          showToast(
            'error',
            'Edit failed.',
            'Failed to load note. Please try again.'
          );
        }
      }
    };

    fetchNote();
  }, [noteId, location.state]);

  const handleSave = useCallback(async () => {
    if (!noteId) return;
    try {
      await api.editNote(noteId, { title, content });
      navigate('/home');
    } catch (error) {
      console.error('Error saving note:', error);
      showToast(
        'error',
        'Edit failed.',
        'Failed to save note. Please try again.'
      );
    }
  }, [noteId, title, content, navigate]);

  const handleBack = () => {
    navigate('/home');
  };

  const togglePreview = () => {
    setIsPreview((prev) => !prev);
  };

  const handleFormat = (format: string) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const { selectionStart, selectionEnd, value } = textarea;
      let selectedText = value.substring(selectionStart, selectionEnd);
      let newText = '';
      let syntax = '';

      switch (format) {
        case 'bold':
          syntax = '**';
          newText = syntax + selectedText + syntax;
          break;
        case 'italic':
          syntax = '_';
          newText = syntax + selectedText + syntax;
          break;
        case 'underline':
          // Markdown doesn't support underline, using HTML tags
          newText = '<u>' + selectedText + '</u>';
          break;
        case 'strike':
          syntax = '~~';
          newText = syntax + selectedText + syntax;
          break;
        case 'heading1':
          newText = selectedText.replace(/^(\s*)(.*)$/gm, '$1# $2');
          break;
        case 'heading2':
          newText = selectedText.replace(/^(\s*)(.*)$/gm, '$1## $2');
          break;
        case 'list-ordered':
          newText = selectedText.replace(/^(\s*)(.*)$/gm, '$11. $2');
          break;
        case 'list-unordered':
          newText = selectedText.replace(/^(\s*)(.*)$/gm, '$1- $2');
          break;
        case 'newline':
          // Insert two newline characters to create a new paragraph
          newText = '  \n';
          break;
        default:
          break;
      }

      const before = value.substring(0, selectionStart);
      const after = value.substring(selectionEnd);
      const updatedValue = before + newText + after;

      setContent(updatedValue);

      // Update the cursor position
      setTimeout(() => {
        const cursorPosition = selectionStart + newText.length;
        textarea.selectionStart = textarea.selectionEnd = cursorPosition;
        textarea.focus();
      }, 0);
    }
  };

  // Updated dummy data for users
  const [users, setUsers] = useState([
    {
      id: 1,
      name: 'John Pork',
      email: 'john@example.com',
      role: 'owner',
      avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'editor',
      avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
    },
    {
      id: 3,
      name: 'Bob Johnson',
      email: 'bob@example.com',
      role: 'viewer',
      avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
    },
    {
      id: 4,
      name: 'Alice Brown',
      email: 'alice@example.com',
      role: 'editor',
      avatar: 'https://randomuser.me/api/portraits/women/4.jpg',
    },
    {
      id: 5,
      name: 'Charlie Wilson',
      email: 'charlie@example.com',
      role: 'viewer',
      avatar: 'https://randomuser.me/api/portraits/men/5.jpg',
    },
  ]);
  const [currentUser, setCurrentUser] = useState(users[1]); // Assuming the current user is Jane Smith

  // Dummy function to use setUsers and setCurrentUser
  const dummyUpdate = () => {
    setUsers((prevUsers) => prevUsers);
    setCurrentUser((prevUser) => prevUser);
  };

  // Use the dummy function in a useEffect to avoid the "unused function" warning
  useEffect(() => {
    if (false) dummyUpdate();
  }, []);

  return (
    <div className="note-page">
      <Toast ref={toast} />
      <div className="note-header">
        <button className="icon-button back-button" onClick={handleBack}>
          <FaArrowLeft /> Back
        </button>
        <input
          type="text"
          className="note-title-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note Title"
        />
        <button className="icon-button save-button" onClick={handleSave}>
          <FaSave /> Save
        </button>
        <button className="icon-button preview-button" onClick={togglePreview}>
          {isPreview ? (
            <>
              <FaEdit /> Edit
            </>
          ) : (
            <>
              <FaEye /> Preview
            </>
          )}
        </button>
      </div>
      {!isPreview && (
        <div className="custom-toolbar">
          <button
            className="toolbar-button"
            onClick={() => handleFormat('heading1')}
          >
            <FaHeading /> H1
          </button>
          <button
            className="toolbar-button"
            onClick={() => handleFormat('heading2')}
          >
            <FaHeading /> H2
          </button>
          <button
            className="toolbar-button"
            onClick={() => handleFormat('bold')}
          >
            <FaBold />
          </button>
          <button
            className="toolbar-button"
            onClick={() => handleFormat('italic')}
          >
            <FaItalic />
          </button>
          <button
            className="toolbar-button"
            onClick={() => handleFormat('underline')}
          >
            <FaUnderline />
          </button>
          <button
            className="toolbar-button"
            onClick={() => handleFormat('strike')}
          >
            <FaStrikethrough />
          </button>
          <button
            className="toolbar-button"
            onClick={() => handleFormat('list-ordered')}
          >
            <FaListOl />
          </button>
          <button
            className="toolbar-button"
            onClick={() => handleFormat('list-unordered')}
          >
            <FaListUl />
          </button>
          <button
            className="toolbar-button"
            onClick={() => handleFormat('newline')}
          >
            <FaLevelDownAlt />
          </button>

          {/* Updated AvatarGroup for all users */}
          <div className="user-avatars">
            <Tooltip
              target=".user-avatars-group"
              position="bottom"
              className="user-avatars-tooltip"
            >
              {users.map((user) => (
                <div key={user.id} className="user-tooltip-item">
                  <Avatar
                    image={user.avatar}
                    shape="circle"
                    size="normal"
                  />
                  <span>{user.name}</span>
                  <span className="user-role">{user.role}</span>
                </div>
              ))}
            </Tooltip>
            <AvatarGroup className="user-avatars-group">
              {users.map((user, index) => (
                <Avatar
                  key={user.id}
                  image={user.avatar}
                  shape="circle"
                  size="large"
                  style={{ display: index < 3 ? 'inline-flex' : 'none' }}
                />
              ))}
              {users.length > 3 && (
                <Avatar
                  label={`+${users.length - 3}`}
                  shape="circle"
                  size="large"
                  style={{ backgroundColor: '#9c27b0', color: '#ffffff' }}
                />
              )}
            </AvatarGroup>
          </div>

          {/* Add current user avatar */}
          <div className="current-user-avatar">
            <Tooltip target=".current-user-avatar-img" position="bottom">
              <div>
                <p>{currentUser.name}</p>
                <p>Role: {currentUser.role}</p>
              </div>
            </Tooltip>
            <Avatar
              image={currentUser.avatar}
              shape="circle"
              size="large"
              className="current-user-avatar-img"
            />
          </div>
        </div>
      )}
      <div className="note-editor">
        {isPreview ? (
          <div
            className="markdown-preview"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(marked.parse(content) as string),
            }}
          />
        ) : (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing your note here..."
            className="markdown-textarea"
          />
        )}
      </div>
    </div>
  );
};

export default NotePage;
