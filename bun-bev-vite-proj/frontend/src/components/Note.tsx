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
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { Toast } from 'primereact/toast';
import { Avatar } from 'primereact/avatar';
import { AvatarGroup } from 'primereact/avatargroup';
import { Tooltip } from 'primereact/tooltip';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';

interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  can_edit: boolean;
  users: User[];
}

interface User {
  id: string;
  username: string;
  email: string;
  role: string; // 'owner', 'editor', or 'viewer'
  avatar: string; // if available
}

const NotePage: React.FC = () => {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toast = useRef<Toast>(null);

  const [note, setNote] = useState<Note | null>(null);

  // Only for preventing error
  React.useEffect(() => { note && (() => {})(); }, [note]);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [loadingNewNote, setLoadingNewNote] = useState(false);

  // Dummy data for users
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      username: 'John Doe',
      email: 'john@example.com',
      role: 'owner',
      avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    },
    {
      id: '2',
      username: 'Jane Smith',
      email: 'jane@example.com',
      role: 'editor',
      avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
    },
    {
      id: '3',
      username: 'Bob Johnson',
      email: 'bob@example.com',
      role: 'viewer',
      avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
    },
  ]);

  // Only for preventing error
  React.useEffect(() => { setUsers(prev => prev); }, []);


  const [currentUser] = useState<User | null>(null);


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
      if (noteId) {
        try {
          setLoadingNewNote(true);
          const response = await api.getNote(noteId);
          const fetchedNote = response.data;
          setNote(fetchedNote);
          setTitle(fetchedNote.title ?? '');
          setContent(fetchedNote.content ?? '');
          setCanEdit(fetchedNote.can_edit);

          // Show permission dialog if the user does not have edit permissions
          if (!fetchedNote.can_edit) {
            setShowPermissionDialog(true);
          }
        } catch (error) {
          console.error('Error fetching note:', error);
          showToast(
            'error',
            'Load failed.',
            'Failed to load note. Please try again.'
          );
        } finally {
          setLoadingNewNote(false);
        }
      }
    };

    fetchNote();
  }, [noteId]);

  // If user cannot edit, always set isPreview to true
  useEffect(() => {
    if (!canEdit) {
      setIsPreview(true);
    }
  }, [canEdit]);

  const handleSave = useCallback(async () => {
    if (!noteId || !canEdit) {
      if (!canEdit) {
        setShowPermissionDialog(true); // Show dialog if user cannot edit
      }
      return;
    }
    try {
      await api.editNote(noteId, { title, content });
      showToast(
        'success',
        'Note saved',
        'Your note has been saved successfully.'
      );
    } catch (error) {
      console.error('Error saving note:', error);
      showToast(
        'error',
        'Save failed',
        'Failed to save note. Please try again.'
      );
    }
  }, [noteId, title, content, canEdit]);

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
      const selectedText = value.substring(selectionStart, selectionEnd);
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

  const handleCloseDialog = () => {
    setShowPermissionDialog(false);
  };

  return (
    <div className="note-page">
      <Toast ref={toast} />
      {loadingNewNote && (
        <div className="fixed inset-0 flex items-center justify-center bg-opacity-40 bg-gray-400 z-50">
          <ProgressSpinner
            style={{ width: '70px', height: '70px' }}
            strokeWidth="4"
            animationDuration="2s"
          />
        </div>
      )}
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
          disabled={!canEdit}
        />
        {canEdit && (
          <button className="icon-button save-button" onClick={handleSave}>
            <FaSave /> Save
          </button>
        )}
        {/* Show toggle button only if user can edit */}
        {canEdit && (
          <button
            className="icon-button preview-button"
            onClick={togglePreview}
          >
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
        )}
      </div>

      {/* Show toolbar only if user can edit and is not in preview mode */}
      {canEdit && !isPreview && (
        <div className="custom-toolbar">
          {/* Toolbar buttons */}
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

          {/* User Avatars */}
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
                  <span>{user.username}</span>
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

          {/* Current User Avatar */}
          <div className="current-user-avatar">
            <Tooltip target=".current-user-avatar-img" position="bottom">
              <div>
                <p>{currentUser?.username ?? 'Unknown User'}</p>
                <p>Role: {currentUser?.role ?? 'N/A'}</p>
              </div>
            </Tooltip>
            <Avatar
              image={currentUser?.avatar}
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
            disabled={!canEdit}
          />
        )}
      </div>

      {showPermissionDialog && (
        <div className="custom-popup-overlay">
          <div className="custom-popup">
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p>You don't have editing permissions for this note.</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '10px' }}>
              <Button
                label="OK"
                onClick={handleCloseDialog}
                className="p-button-text"
                style={{ backgroundColor: '#2196F3', color: '#ffffff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px' }} // Blue background
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotePage;
