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
  FaVolumeUp, // Importing a speaker icon for the text-to-speech button
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
  const [username, setUsername] = useState<string>('User');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  // Function to handle content change
  const handleContentChange = (newContent: string) => {
    setContent(newContent); // Update the content directly

    // Send updated content to WebSocket server
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && note) {
      socketRef.current.send(
        JSON.stringify({
          type: 'noteUpdate',
          noteId: note.id,
          updatedContent: newContent,
          updatedBy: userEmail,
        })
      );
    }
  };

  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
  const fetchUserRole = async () => {
    if (noteId) {
      try {
        const response = await api.getUserRole(noteId);
        setRole(response.data.role);
        console.log('User role:', response.data.role);
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    }
  };

  fetchUserRole();
}, [noteId]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await api.getUserProfile();
        setUserEmail(response.data.email);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  useEffect(() => {
    // Establish WebSocket connection
    if (userEmail && noteId) {
      socketRef.current = new WebSocket('ws://localhost:8000');

      socketRef.current.onopen = () => {
        console.log('Connected to WebSocket server');
        if (noteId) {
          socketRef.current?.send(
            JSON.stringify({
              type: 'joinNote',
              noteId: noteId,
              email: userEmail,
            })
          );
          console.log(`User ${userEmail} joined note ${noteId}`);
        }
      };

      socketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'userJoined') {
          console.log(`User ${data.email} joined note ${data.noteId}`);
        }

        if (data.type === 'currentUsers') {
          console.log(`Current users on note ${data.noteId}:`, data.users);

          if (data.users && data.users.length > 0) {
            api.getUserDetailsByEmails(data.noteId, data.users)
              .then((response) => {

                const updatedUsers: User[] = response.data.map((user: any) => {

                  const updatedUser = {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    avatar: user.avatar,
                  };

                  return updatedUser;
                });

                setUsers(updatedUsers);
              })
              .catch((error) => {
                console.error('Error fetching user details:', error);
              });
          } else {
            console.log('No users currently in the note.');
            setUsers([]);
          }
        }

        if (data.type === 'noteContentUpdate') {
          console.log(`Note content updated by ${data.updatedBy}`);
          setContent(data.updatedContent);
        }
      };

      socketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      socketRef.current.onclose = () => {
        console.log('Disconnected from WebSocket server');
      };

      return () => {
        if (socketRef.current) {
          socketRef.current.close();
        }
      };
    }
  }, [userEmail, noteId]);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [loadingNewNote, setLoadingNewNote] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

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

          const currentProfile = await api.getUserProfile();
          setUsername(currentProfile.data.username ?? 'User');
          setProfileImageUrl(currentProfile.data.avatar_url || null);

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

  useEffect(() => {
    if (!canEdit) {
      setIsPreview(true);
    }
  }, [canEdit]);

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

  const handleSave = useCallback(async () => {
    if (!noteId || !canEdit) {
      if (!canEdit) {
        setShowPermissionDialog(true);
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
          newText = '  \n';
          break;
        default:
          break;
      }

      const before = value.substring(0, selectionStart);
      const after = value.substring(selectionEnd);
      const updatedValue = before + newText + after;

      setContent(updatedValue);

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

  // Text-to-Speech handler
  const handleTextToSpeech = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(content);
      window.speechSynthesis.speak(utterance);
    } else {
      showToast('warn', 'Text-to-Speech not supported', 'Your browser does not support text-to-speech functionality.');
    }
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

        {/* Text-to-Speech button */}
        <button className="icon-button tts-button" onClick={handleTextToSpeech}>
          <FaVolumeUp /> Read Aloud
        </button>
      </div>

      {canEdit && !isPreview && (
        <div className="custom-toolbar">
          <button className="toolbar-button" onClick={() => handleFormat('heading1')}>
            <FaHeading /> H1
          </button>
          <button className="toolbar-button" onClick={() => handleFormat('heading2')}>
            <FaHeading /> H2
          </button>
          <button className="toolbar-button" onClick={() => handleFormat('bold')}>
            <FaBold />
          </button>
          <button className="toolbar-button" onClick={() => handleFormat('italic')}>
            <FaItalic />
          </button>
          <button className="toolbar-button" onClick={() => handleFormat('underline')}>
            <FaUnderline />
          </button>
          <button className="toolbar-button" onClick={() => handleFormat('strike')}>
            <FaStrikethrough />
          </button>
          <button className="toolbar-button" onClick={() => handleFormat('list-ordered')}>
            <FaListOl />
          </button>
          <button className="toolbar-button" onClick={() => handleFormat('list-unordered')}>
            <FaListUl />
          </button>
          <button className="toolbar-button" onClick={() => handleFormat('newline')}>
            <FaLevelDownAlt />
          </button>

          {/* User Avatars */}
          <div className="user-avatars flex">
            <Tooltip
              target=".user-avatars-group"
              position="bottom"
              className="user-avatars-tooltip"
            >
              {users.map((user) => (
                <div key={user.id} className="user-tooltip-item">
                  <Avatar
                    image={user.avatar}
                    icon={"pi pi-user"}
                    className="w-10 h-10 rounded-full cursor-pointer object-cover overflow-hidden"
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
                  icon={"pi pi-user"}
                  className="w-12 h-12 rounded-full cursor-pointer object-cover overflow-hidden"
                  shape="circle"
                  size="large"
                  style={{ display: index < 3 ? 'inline-flex' : 'none' }}
                />
              ))}
              {users.length > 3 && (
                <Avatar
                  label={`+${users.length - 3}`}
                  shape="circle"
                  className="w-12 h-12 rounded-full cursor-pointer object-cover overflow-hidden"
                  size="large"
                  style={{ backgroundColor: '#9c27b0', color: '#ffffff' }}
                />
              )}
            </AvatarGroup>
          </div>

          {/* Current User Avatar */}
          <div className="current-user-avatar flex">
            <Tooltip target=".current-user-avatar-img" position="bottom">
              <div className='text-base'>
                <p>{username || 'Unknown User'}</p>
                <p className="text-xs">{role || "none"}</p>
              </div>
            </Tooltip>
            <Avatar
              image={profileImageUrl || undefined}
              icon={"pi pi-user"}
              className="current-user-avatar-img w-12 h-12 rounded-full cursor-pointer object-cover overflow-hidden"
              shape="circle"
              size="large"
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
            onChange={(e) => handleContentChange(e.target.value)}
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
                style={{ backgroundColor: '#2196F3', color: '#ffffff', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px' }} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotePage;
