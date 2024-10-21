import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaPalette, FaSearch, FaPlus, FaEdit, FaTrash, FaShare, FaSort, FaEllipsisV, FaBars } from 'react-icons/fa';
import '../styles/HomePage.css';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Avatar } from 'primereact/avatar';
import { Menu } from 'primereact/menu';
import { Dialog } from 'primereact/dialog';
import { Badge } from 'primereact/badge';
import { Button } from 'primereact/button';
import { Skeleton } from 'primereact/skeleton';
import { ProgressSpinner } from 'primereact/progressspinner';
import FocusTrap from 'focus-trap-react';


interface HomePageProps {
  logout: () => void;
}

interface Folder {
  id: string;
  name: string;
  subjects: Subject[];
}

interface Subject {
  id: string;
  name: string;
  notes: Note[];
  lastEditDate: string;
}

interface NewCategoryPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (categoryName: string) => void;
}

interface ShareNotePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (noteId: string, email: string, isEditor: boolean) => void;
  noteId: string | null;
}

interface NewNotePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, folderName: string, subjectName: string) => void;
  selectedFolderName: string | null;
  selectedSubjectName: string | null;
}

interface ErrorPopupProps {
  message: string;
  onClose: () => void;
}

  interface Note {
    id: string;
    title: string;
    content: string;
    updatedAt: string;
    folderName?: string;
    subjectName?: string;
    folder_name?: string;
    subject_name?: string;
    folderId?: string;   
    subjectId?: string;  
    color: string;
}
  
interface ConfirmationPopupProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  className?: string;
}

interface NewSubjectPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (subjectName: string) => void;
  folderId: string;
}

interface SharedNote {
  note_id: string;
  title: string;
  content: string;
  shared_by: string;
  folder_name: string;
  subject_name : string;
}

const ErrorPopup: React.FC<ErrorPopupProps> = ({ message, onClose }) => {
  return (
    <div className="error-popup-overlay">
      <div className="error-popup">
        <p>{message}</p>
        <button onClick={onClose} className="error-popup-button">OK</button>
      </div>
    </div>
  );
};

const ShareNotePopup: React.FC<ShareNotePopupProps> = ({ isOpen, onClose, onShare, noteId }) => {
  const [shareUserEmail, setShareUserEmail] = useState('');
  const [isEditor, setIsEditor] = useState(false);

  if (!isOpen || !noteId) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (shareUserEmail.trim()) {
      onShare(noteId, shareUserEmail, isEditor);
      setShareUserEmail('');
      setIsEditor(false);
    }
  };

  const handlePermissionChange = (newIsEditor: boolean) => {
    setIsEditor(newIsEditor);
  };

  return (
    <div className="popup-overlay">
      <FocusTrap>
        <div className="popup">
          <h2 className="popup-title">Share Note</h2>
          <form onSubmit={handleSubmit}>
            {/* Email Input Field */}
            <input
              type="email"
              placeholder="Enter email address"
              value={shareUserEmail}
              onChange={(e) => setShareUserEmail(e.target.value)}
              required
              autoFocus
              className="share-input"
              tabIndex={0}  // Email input in tab order
            />

            {/* Permission Radio Buttons */}
            <div className="permission-select">
              <div className="permission-options">
                {/* Viewer Option */}
                <label 
                  className={`permission-option ${!isEditor ? 'selected' : ''}`}
                  tabIndex={0}  // Ensure label is focusable
                  onClick={() => handlePermissionChange(false)}
                  onKeyPress={(e) => e.key === 'Enter' && handlePermissionChange(false)}
                >
                  <input
                    type="radio"
                    name="permission"
                    value="viewer"
                    checked={!isEditor}
                    onChange={() => handlePermissionChange(false)}
                    className="permission-radio"
                    tabIndex={-1}  // The radio itself does not need to be tabbable
                  />
                  <span className="permission-label">Viewer</span>
                </label>

                {/* Editor Option */}
                <label 
                  className={`permission-option ${isEditor ? 'selected' : ''}`}
                  tabIndex={0}  // Ensure label is focusable
                  onClick={() => handlePermissionChange(true)}
                  onKeyPress={(e) => e.key === 'Enter' && handlePermissionChange(true)}
                >
                  <input
                    type="radio"
                    name="permission"
                    value="editor"
                    checked={isEditor}
                    onChange={() => handlePermissionChange(true)}
                    className="permission-radio"
                    tabIndex={-1}  // The radio itself does not need to be tabbable
                  />
                  <span className="permission-label">Editor</span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="popup-buttons">
              <button type="submit" className="share-button" tabIndex={0}>
                Share
              </button>
              <button type="button" onClick={onClose} className="cancel-button" tabIndex={0}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </FocusTrap>
    </div>
  );
};

const NewCategoryPopup: React.FC<NewCategoryPopupProps> = ({ isOpen, onClose, onSubmit }) => {
  const [categoryName, setCategoryName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (categoryName.trim()) {
      onSubmit(categoryName);
      setCategoryName('');
    }
  };

  return (
    <div className="popup-overlay">
      <div className="popup">
        <h2 className="popup-title">Create New Category</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Category Name"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            required
            autoFocus
          />
          <div className="popup-buttons">
            <button type="submit" className="create-button">Create</button>
            <button type="button" onClick={onClose} className="cancel-button">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const NewNotePopup: React.FC<NewNotePopupProps> = ({ isOpen, onClose, onSubmit, selectedFolderName, selectedSubjectName }) => {
  const [title, setTitle] = useState('');
  const [folderName, setFolderName] = useState('');
  const [subjectName, setSubjectName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFolderName(selectedFolderName || '');
      setSubjectName(selectedSubjectName || '');
    }
  }, [isOpen, selectedFolderName, selectedSubjectName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(title, folderName, subjectName);
    resetForm();
    onClose();
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTitle('');
    setFolderName(selectedFolderName || '');
    setSubjectName(selectedSubjectName || '');
  };

  return (
    <div className="popup-overlay">
      <div className="popup">
        <h2 className="popup-title">Create New Note</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Note Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />
          <input
            type="text"
            placeholder="Category Name"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Subject Name"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            required
          />

          <div className="popup-buttons">
            <button type="submit" className="create-button">Create</button>
            <button type="button" onClick={handleCancel} className="cancel-button">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ConfirmationPopup: React.FC<ConfirmationPopupProps> = ({ isOpen, message, onConfirm, onCancel, className }) => {
  if (!isOpen) return null;

  return (
    <div className={`popup-overlay ${className || ''}`}>
      <div className="popup confirmation-popup">
        <p>{message}</p>
        <div className="popup-buttons">
          <button onClick={onConfirm} className="confirm-button">Confirm</button>
          <button onClick={onCancel} className="cancel-button">Cancel</button>
        </div>
      </div>
    </div>
  );
};

const NewSubjectPopup: React.FC<NewSubjectPopupProps> = ({ isOpen, onClose, onSubmit }) => {
  const [subjectName, setSubjectName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (subjectName.trim()) {
      onSubmit(subjectName);
      setSubjectName('');
    }
  };

  return (
    <FocusTrap>
      <div className="popup-overlay" onClick={onClose}>
        <div className="popup" onClick={(e) => e.stopPropagation()}>
          <h2 className="popup-title">Add New Subject</h2>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Subject Name"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              required
              autoFocus
              tabIndex={0} // Ensure input is focusable
            />
            <div className="popup-buttons">
              <button type="submit" className="create-button" tabIndex={0}>
                Add
              </button>
              <button type="button" onClick={onClose} className="cancel-button" tabIndex={0}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </FocusTrap>
  );
};



const HomePage: React.FC<HomePageProps & { showToast: (severity: 'success' | 'info' | 'warn' | 'error' | 'secondary' | 'contrast' | undefined, summary: string, detail: string) => void }> = ({ logout, showToast }) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [mainSearchTerm, setMainSearchTerm] = useState<string>('');
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState<'all' | 'folder' | Subject>('all');
  const [isNewNotePopupOpen, setIsNewNotePopupOpen] = useState(false);
  const [isNewCategoryPopupOpen, setIsNewCategoryPopupOpen] = useState(false);
  const [isSharingNotePopupOpen, setIsSharingNotePopupOpen] = useState(false);
  const [shareNoteId, setShareNoteId] = useState<string | null>(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(true);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [errorPopup, setErrorPopup] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' });
  const navigate = useNavigate();
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; noteId: string | null }>({ isOpen: false, noteId: null });  
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [username, setUsername] = useState<string>('User');
  const [email, setEmail] = useState<string>('User');
  const [tempUsername, setTempUsername] = useState<string>(username);
  const [tempEmail, setTempEmail] = useState<string>(email);

  const [isNewSubjectPopupOpen, setIsNewSubjectPopupOpen] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // Default to descending (newest first)
 
  const [inboxCount, setInboxCount] = useState<number>(0);
  const [sharedNotes, setSharedNotes] = useState<SharedNote[]>([]);

  const [currentNoteIndex, setCurrentNoteIndex] = useState<number>(0);
  const [isInboxPopupOpen, setIsInboxPopupOpen] = useState<boolean>(false);
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [categorySearchTerm, setCategorySearchTerm] = useState<string>('');

  //const [isLoadingNotes, setIsLoadingNotes] = useState(true);

  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Establish WebSocket connection
    socketRef.current = new WebSocket('ws://localhost:8000');

    socketRef.current.onopen = () => {
      console.log('Connected to WebSocket server');
    };

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'notification') {
        showToast('info', 'New Note Shared', data.message || 'New note has been shared');
        fetchSharedNotes();
      }
    };

    socketRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socketRef.current.onclose = () => {
      console.log('Disconnected from WebSocket server');
    };

    // Close the WebSocket connection
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const registerWebSocket = (userEmail: string) => {
    if (socketRef.current && userEmail) {
      socketRef.current.send(
        JSON.stringify({
          type: 'register',
          email: userEmail,
        })
      );
      console.log(`${userEmail} registered for real-time updates`);
    }
  };

  const colors = [
    '#a1b5a1',
    '#c1a7a7',
    '#b1a792',
    '#d4a5a5',
    '#a9c7a9',
    '#e0c699',
    '#c9b1d1',
    '#d1c3aa',
    '#9ab7d3',
    '#b3d1c8'
  ];
  const menu = React.useRef<Menu>(null);

  const [folderOptionsMenu, setFolderOptionsMenu] = useState<{ isOpen: boolean; folderId: string | null; top: number }>({
    isOpen: false,
    folderId: null,
    top: 0,
  });

  const [deleteCategoryConfirmation, setDeleteCategoryConfirmation] = useState<{ isOpen: boolean; folderId: string | null }>({ isOpen: false, folderId: null });
  const [deleteSubjectConfirmation, setDeleteSubjectConfirmation] = useState<{ isOpen: boolean; subjectId: string | null }>({ isOpen: false, subjectId: null });
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [deleteAccountConfirmation, setDeleteAccountConfirmation] = useState({ isOpen: false });

  const confirmDeleteAccount = async () => {
    try {
      await api.deleteAccount();
      logout();
      showToast('success', 'Account Deleted', 'Your account has been successfully deleted.');
    } catch (error) {
      console.error('Error deleting account:', error);
      showToast('error', 'Error', 'Failed to delete account. Please try again.');
    }
    setDeleteAccountConfirmation({ isOpen: false });
  };

  const [waitingForUsername, setWaitingForUsername] = useState(false);

  const handleSaveUsername = async () => {
    try {
      setWaitingForUsername(true);
      await api.updateUsername(tempUsername);
      setUsername(tempUsername);
      showToast('success', 'Success', 'Username updated successfully');
    } catch (error: unknown) {
      console.error('Error updating username:', error);

      const err = error as { response?: { status: number, data: { message: string } } };
      if (err.response && err.response.status === 400) {
        showToast('error', 'Error', err.response.data.message);
      } else {
        showToast('error', 'Error', 'Failed to update username. Please try again.');
      }
    } finally {
      setWaitingForUsername(false);
    }
  };

  const [waitingForEmail, setWaitingForEmail] = useState(false);
  
  const handleSaveEmail = async () => {
    try {
      setWaitingForEmail(true);
      await api.updateEmail(tempEmail);
      setEmail(tempEmail);
      showToast('success', 'Success', 'Email updated successfully');
    } catch (error: unknown) {
      console.error('Error updating email:', error);

      const err = error as { response?: { status: number, data: { message: string } } };
      if (err.response && err.response.status === 400) {
        showToast('error', 'Error', err.response.data.message);
      } else {
        showToast('error', 'Error', 'Failed to update email. Please try again.');
      }
    } finally {
      setWaitingForEmail(false);
    }
  };

  const handleEditFolder = (folderId: string) => {
    setEditingFolderId(folderId);
    setFolderOptionsMenu({ isOpen: false, folderId: null, top: 0 });
  };

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  const handleSaveFolderEdit = async (folderId: string, newName: string) => {
    if (newName.trim() === '') {
      showToast('error', 'Error', 'Category name cannot be empty');
      return;
    }

    const currentFolder = folders.find(folder => folder.id === folderId);
    if (currentFolder && currentFolder.name === newName) {
      setEditingFolderId(null);
      return; 
    }

    try {
      await api.editFolder(folderId, { name: newName });
      setFolders(prevFolders =>
        prevFolders.map(folder =>
          folder.id === folderId ? { ...folder, name: newName } : folder
        )
      );
      setEditingFolderId(null);
      showToast('info', 'Category Updated', 'Category name updated successfully');
    } catch (error) {
      console.error('Error editing category:', error);
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as { response?: { data: any, status: number } };
        console.error('Error response:', axiosError.response?.data);
        console.error('Error status:', axiosError.response?.status);
      }
      showToast('error', 'Error', `Failed to update category name: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSaveSubjectEdit = async (subjectId: string, newName: string) => {
    if (newName.trim() === '') {
      showToast('error', 'Error', 'Subject name cannot be empty');
      return;
    }
  
    const currentSubject = selectedFolder?.subjects.find(subject => subject.id === subjectId);
    if (currentSubject && currentSubject.name === newName) {
      setEditingSubjectId(null);
      return;
    }
  
    try {
      await api.editSubject(subjectId, { name: newName });
      
      // Update folders state
      setFolders(prevFolders =>
        prevFolders.map(folder => ({
          ...folder,
          subjects: folder.subjects.map(subject =>
            subject.id === subjectId ? { ...subject, name: newName } : subject
          )
        }))
      );
      
      // Update selectedFolder if necessary
      if (selectedFolder) {
        setSelectedFolder(prevFolder => {
          if (prevFolder && typeof prevFolder === 'object' && 'subjects' in prevFolder) {
            return {
              ...prevFolder,
              subjects: prevFolder.subjects.map(subject =>
                subject.id === subjectId ? { ...subject, name: newName } : subject
              ),
            };
          } else {
            // Return prevFolder as is if it's not the expected object
            return prevFolder;
          }
        });
      }
      
      // Update currentView if it's the edited subject
      if (typeof currentView !== 'string' && currentView.id === subjectId) {
        setCurrentView((prevView) => {
          if (typeof prevView === 'object' && prevView !== null) {
            return {
              ...prevView,
              name: newName // Update the name property
            };
          }
          return prevView; // Return unchanged if prevView is not valid
        });
      }
      
      setEditingSubjectId(null);
      showToast('info', 'Subject Updated', 'Subject name updated successfully');
    } catch (error) {
      console.error('Error editing subject:', error);
      showToast('error', 'Error', `Failed to update subject name: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSaveEdit = async (noteId: string, newTitle: string) => {
    if (newTitle.trim() === '') {
      showToast('error', 'Error', 'Note title cannot be empty');
      return;
    }
  
    const currentNote = notes.find(note => note.id === noteId);
    if (currentNote && currentNote.title === newTitle) {
      setEditingNoteId(null);
      return;
    }
  
    try {

      const userRoleResponse = await api.getUserRole(noteId);
      const userRole = userRoleResponse.data.role;

      if (userRole !== 'owner') {
        showToast('error', 'Error', 'Only owners can rename notes.');
        setEditingNoteId(null);
        return;
      }

      await api.editNote(noteId, { title: newTitle, content: '' });
      
      // Update notes state
      setNotes(prevNotes =>
        prevNotes.map(note =>
          note.id === noteId ? { ...note, title: newTitle } : note
        )
      );
      
      // Update folders state
      setFolders(prevFolders =>
        prevFolders.map(folder => ({
          ...folder,
          subjects: folder.subjects.map(subject => ({
            ...subject,
            notes: subject.notes.map(note =>
              note.id === noteId ? { ...note, title: newTitle } : note
            )
          }))
        }))
      );
      
    // Update currentView if it's a subject view
    if (typeof currentView !== 'string' && currentView.notes) {
      setCurrentView(prevView => {
        if (typeof prevView !== 'string') {
          return {
            ...prevView,
            notes: prevView.notes.map(note =>
              note.id === noteId ? { ...note, title: newTitle } : note
            )
          };
        } else {
          // Handle the case where prevView is a string, if necessary
          return prevView;
        }
      });
    }
      
      // Update selectedSubject if necessary
      if (selectedSubject) {
        setSelectedSubject(prevSubject => {
          if (prevSubject && typeof prevSubject === 'object' && 'notes' in prevSubject) {
            return {
              ...prevSubject,
              notes: prevSubject.notes.map(note =>
                note.id === noteId ? { ...note, title: newTitle } : note
              ),
            };
          } else {
            // Return prevSubject as is if it's not the expected object
            return prevSubject;
          }
        });
      }
      
      setEditingNoteId(null);
      showToast('info', 'Note Updated', 'Note title updated successfully');
    } catch (error) {
      console.error('Error editing note:', error);
      showToast('error', 'Error', `Failed to update note title: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().startsWith(categorySearchTerm.toLowerCase())
  );


  const handleFolderOptions = (e: React.MouseEvent, folderId: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const sidebarRect = document.querySelector('.sidebar')?.getBoundingClientRect();
    if (sidebarRect) {
      setFolderOptionsMenu({
        isOpen: folderOptionsMenu.folderId !== folderId || !folderOptionsMenu.isOpen,
        folderId: folderId,
        top: rect.top - sidebarRect.top,
      });
    }
  };

  const handleColorChange = async (noteId: string, color: string) => {
    try {
      const userRoleResponse = await api.getUserRole(noteId);
      const userRole = userRoleResponse.data.role;

      if (userRole !== 'owner') {
        showToast('error', 'Error', 'Only owners can change colors.');
        return;
      }

      await api.updateNoteColor(noteId, color);
      setNotes(prevNotes =>
        prevNotes.map(note =>
          note.id === noteId ? { ...note, color } : note
        )
      );
      showToast('info', 'Updated Note Color', 'Note color updated successfully');
      setShowColorPicker(null);
    } catch (error) {
      console.error('Error updating note color:', error);
      showToast('error', 'Error', 'Failed to update note color. Please try again.');
    }
  };

  const handleClickOutside = useCallback(() => {
    if (folderOptionsMenu.isOpen) {
      setFolderOptionsMenu({ isOpen: false, folderId: null, top: 0 });
    }
  }, [folderOptionsMenu.isOpen]);

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [handleClickOutside]);

  const handleDeleteFolder = (folderId: string) => {
    setDeleteCategoryConfirmation({ isOpen: true, folderId });
    setFolderOptionsMenu({ isOpen: false, folderId: null, top: 0 });
  };

  const handleDeleteSubject = (subjectId: string) => {
    setDeleteSubjectConfirmation({ isOpen: true, subjectId });
  };

  const confirmDeleteCategory = async () => {
    if (deleteCategoryConfirmation.folderId) {
      try {
        setDeleteCategoryConfirmation({ isOpen: false, folderId: null });
        setLoadingNewNote(true);
        await api.deleteFolder(deleteCategoryConfirmation.folderId);
        
        // Update folders state
        setFolders(prevFolders => prevFolders.filter(folder => folder.id !== deleteCategoryConfirmation.folderId));
        
        // Update currentView if necessary
        if (currentView === 'folder' && selectedFolder?.id === deleteCategoryConfirmation.folderId) {
          setCurrentView('all');
          setSelectedFolder(null);
        }
        
        // Update notes state to remove notes from the deleted category
        setNotes(prevNotes => prevNotes.filter(note => note.folderId !== deleteCategoryConfirmation.folderId));
        
        showToast('info', 'Category Deleted', 'Category deleted successfully');
      } catch (err) {
        console.error('Error deleting category:', err);
        showToast('error', 'Error', 'Failed to delete category. Please try again.');
      } finally {
        setLoadingNewNote(false);
      }
    }
  };

  const confirmDeleteSubject = async () => {
    if (deleteSubjectConfirmation.subjectId) {
      try {
        setDeleteSubjectConfirmation({ isOpen: false, subjectId: null });
        setLoadingNewNote(true);
        await api.deleteSubject(deleteSubjectConfirmation.subjectId);
        
        // Update folders state
        setFolders(prevFolders => 
          prevFolders.map(folder => ({
            ...folder,
            subjects: folder.subjects.filter(subject => subject.id !== deleteSubjectConfirmation.subjectId)
          }))
        );
        
        // Update selectedFolder if necessary
        if (selectedFolder) {
          setSelectedFolder(prevFolder => {
            if (prevFolder && typeof prevFolder === 'object' && 'subjects' in prevFolder) {
              return {
                ...prevFolder,
                subjects: prevFolder.subjects.filter(
                  subject => subject.id !== deleteSubjectConfirmation.subjectId
                ),
              };
            } else {
              return prevFolder;
            }
          });
        }
        
        // Update currentView if necessary
        if (typeof currentView !== 'string' && currentView.id === deleteSubjectConfirmation.subjectId) {
          setCurrentView('folder');
        }
        
        // Update notes state to remove notes from the deleted subject
        setNotes(prevNotes => prevNotes.filter(note => note.subjectId !== deleteSubjectConfirmation.subjectId));
        
        showToast('info', 'Subject Deleted', 'Subject deleted successfully');
      } catch (err) {
        console.error('Error deleting subject:', err);
        showToast('error', 'Error', 'Failed to delete subject. Please try again.');
      } finally {
        setLoadingNewNote(false);
      }
    }
  };

  const handleProfilePopupOpen = () => {
    setTempUsername(username);
    setTempEmail(email);
    setIsProfilePopupOpen(true);
  };

  const handleProfilePopupClose = () => {
    setIsProfilePopupOpen(false);
  };

  const menuItems = [
    {
      label: 'Profile',
      icon: 'pi pi-user',
      command: handleProfilePopupOpen,
      template: (item: any, options: any) => (
        <button
          onClick={options.onClick}
          tabIndex={0} // Ensure button is focusable
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 transition-colors duration-200"
        >
          <span className="flex items-center">
            <i className={`${item.icon} mr-2`}></i>
            <span>{item.label}</span>
          </span>
        </button>
      ),
    },
    {
      label: 'Inbox',
      icon: 'pi pi-inbox',
      command: () => handleInbox(),
      template: (item: any, options: any) => (
        <button
          onClick={options.onClick}
          tabIndex={0} // Ensure button is focusable
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 transition-colors duration-200"
        >
          <span className="flex items-center">
            <i className={`${item.icon} mr-2`}></i>
            <span>{item.label}</span>
          </span>
          {inboxCount > 0 && <Badge value={inboxCount} severity="danger" className="ml-2"></Badge>}
        </button>
      ),
    },
    {
      label: 'Logout',
      icon: 'pi pi-sign-out',
      command: () => logout(),
      template: (item: any, options: any) => (
        <button
          onClick={options.onClick}
          tabIndex={0} // Ensure button is focusable
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 transition-colors duration-200"
        >
          <span className="flex items-center">
            <i className={`${item.icon} mr-2`}></i>
            <span>{item.label}</span>
          </span>
        </button>
      ),
    },
  ];

  const handleInbox = () => {
    if (inboxCount > 0) {
      setIsInboxPopupOpen(true);
    } else {
      showToast('info', 'Inbox Empty', 'You have no shared notes.');
    }
  };

  const handleAcceptNote = async () => {
    const noteId = sharedNotes[currentNoteIndex]?.note_id;

    if (!noteId) {
      showToast('error', 'Error', 'No note selected to accept.');
      return;
    }

    try {
      const response = await api.acceptInvite({ noteId });

        const newNote = {
          id: response.data.note_id,
          title: response.data.title,
          content: response.data.content,
          subjectId: response.data.subject_id,
          folderId: response.data.folder_id,
          ownerId: response.data.owner_id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          color: response.data.color || '#637c99'

      };

      setFolders(prevFolders => {
          return prevFolders.map(folder => {
              if (folder.id === newNote.folderId) {
                  return {
                      ...folder,
                      subjects: folder.subjects.map(subject => {
                          if (subject.id === newNote.subjectId) {
                              return {
                                  ...subject,
                                  notes: [...subject.notes, newNote],
                              };
                          }
                          return subject;
                      }),
                  };
              }
              return folder;
          });
      });

      showToast('success', 'Note Accepted', 'The shared note has been added to your notes.');
      removeCurrentNote();
      await fetchFoldersAndSubjects;
      await fetchNotes();
      await fetchNotesThatAreSharedWithMe();

    } catch (error) {
      console.error('Error accepting note:', error);
      showToast('error', 'Error', 'Failed to accept the note. Please try again.');
    }
  };

  const handleRejectNote = async () => {

    const noteId = sharedNotes[currentNoteIndex].note_id;
    console.log('Rejecting Note ID:', noteId);

    if (!noteId) {
      showToast('error', 'Error', 'No note selected to accept.');
      return;
    }

    try {
      await api.rejectInvite(noteId);
      showToast('info', 'Note Rejected', 'The shared note has been rejected.');
      removeCurrentNote();
    } catch (error) {
      console.error('Error rejecting note:', error);
      showToast('error', 'Error', 'Failed to reject the note. Please try again.');
    }
  };


  const removeCurrentNote = () => {
    setSharedNotes(prev => prev.filter((_, index) => index !== currentNoteIndex));
    setInboxCount(prev => prev - 1);
    if (currentNoteIndex >= sharedNotes.length - 1) {
      setCurrentNoteIndex(0);
    }
    if (sharedNotes.length === 1) {
      setIsInboxPopupOpen(false);
    }
  };

  const fetchSharedNotes = useCallback(async () => {
    try {
      const response = await api.getPendingInvites();
      setSharedNotes(response.data);
      setInboxCount(response.data.length);
    } catch (err) {
      console.error('Error fetching shared notes:', err);
      showToast('error', 'Error', 'Failed to load shared notes');
    }
  }, [showToast]);

  useEffect(() => {
    fetchSharedNotes();
  }, [fetchSharedNotes]);


  const renderInboxPopup = () => {
    if (sharedNotes.length === 0) {
      return (
        <Dialog 
          header="Shared Note" 
          visible={isInboxPopupOpen} 
          style={{ width: '50vw', height: '60vh' }} 
          onHide={() => setIsInboxPopupOpen(false)}
          className="p-fluid shared-note-dialog"
        >
          <p>No pending invites.</p> {/* Display message when no invites */}
        </Dialog>
      );
    }
    const currentNote = sharedNotes[currentNoteIndex];

    if (!currentNote) {
      return null;
    }
  
  
    return (
      <Dialog 
        header="Shared Note" 
        visible={isInboxPopupOpen} 
        style={{ width: '50vw', height: '60vh' }} 
        onHide={() => setIsInboxPopupOpen(false)}
        className="p-fluid shared-note-dialog"
        draggable={false}
      >
        <div className="flex flex-col h-full">
          <div className="flex-grow flex items-center">
            <Button 
              icon="pi pi-chevron-left" 
              onClick={() => setCurrentNoteIndex(prev => (prev - 1 + sharedNotes.length) % sharedNotes.length)} 
              className="p-button-text h-12 w-12"
              disabled={sharedNotes.length <= 1}
            />
            <div className="flex-grow mx-2">
              <div className="note-card">
                <div className="note-content">
                  <h3 className="note-title">{currentNote.title}</h3>
                  <div className="note-preview-container">
                    <p className="note-preview">{getContentPreview(currentNote.content)}</p>
                  </div>
                  <div className="note-metadata">
                      <p className="note-category">Folder: {currentNote.folder_name || 'Uncategorized'}</p>
                      <p className="note-category">Subject: {currentNote.subject_name || 'Uncategorized'}</p>
                  </div>
                </div>
                <div className="note-footer">
                  <span className="shared-by">Shared by: {currentNote.shared_by}</span>
                </div>
              </div>
            </div>
            <Button 
              icon="pi pi-chevron-right" 
              onClick={() => setCurrentNoteIndex(prev => (prev + 1) % sharedNotes.length)} 
              className="p-button-text h-12 w-12"
              disabled={sharedNotes.length <= 1}
            />
          </div>
          <div className="flex justify-center items-center mt-2 space-x-4">
            <Button 
              label="Reject" 
              icon="pi pi-times" 
              onClick={handleRejectNote} 
              className="p-button-outlined p-button-danger hover:bg-light-blue p-2"
            />
            <Button 
              label="Accept" 
              icon="pi pi-check" 
              onClick={handleAcceptNote} 
              className="p-button-outlined p-button-success hover:bg-light-blue p-2"
            />
          </div>
        </div>
      </Dialog>
    );
  };


  const fetchUserData = async () => {
    try {
      const response = await api.getUserProfile();

      setUsername(response.data.username);
      setTempUsername(response.data.username);
      setProfileImageUrl(response.data.avatar_url || null);
      setEmail(response.data.email);
      setTempEmail(response.data.email);
      setLoading(false);
      registerWebSocket(response.data.email);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load user data');
      setLoading(false);
      showToast('error', 'Error', 'Failed to load user data');
    }
  };


  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  };


  const fetchNotes = useCallback(async () => {
    try {
      const response = await api.getNotes();
      const transformedNotes = response.data.notes.map((note: any) => ({
        ...note,
        id: note.id.toString(), 
        updatedAt: note.updated_at || note.updatedAt || new Date().toISOString(), //current date if both are missing
        folderName: note.folder_name || note.folderName || 'Uncategorized',
        subjectName: note.subject_name || note.subjectName || 'Uncategorized',
        content: note.content || '',
        color: note.color || '#637c99',
        isShared: false, // Add this flag
      }));
      return transformedNotes;
    } catch (err) {
      console.error('Error fetching notes:', err);
      setError('Failed to load notes');
      return [];
    }
  }, []);

  const fetchNotesThatAreSharedWithMe = useCallback(async () => {
    try {
      const response = await api.getShareNotes();
      const transformedSharedNotes = response.data.notes.map((note: any) => ({
        ...note,
        id: note.id.toString(),
        updatedAt: note.updated_at || note.updatedAt || new Date().toISOString(),
        folderName: 'Shared Notes',
        subjectName: 'All Shared Notes',
        content: note.content || '',
        color: note.color || '#637c99',
        isShared: true, // Add this flag
      }));
      return transformedSharedNotes;
    } catch (err) {
      console.error('Error fetching shared notes:', err);
      setError('Failed to load shared notes');
      return [];
    }
  }, []);

  useEffect(() => {
    const fetchAllNotes = async () => {
      setLoading(true);
      const [regularNotes, sharedNotes] = await Promise.all([
        fetchNotes(),
        fetchNotesThatAreSharedWithMe()
      ]);
      setNotes([...regularNotes, ...sharedNotes]);
      setLoading(false);
    };
    fetchAllNotes();
  }, [fetchNotes, fetchNotesThatAreSharedWithMe]);

  const fetchFoldersAndSubjects = useCallback(async () => {
    try {
      const response = await api.getFoldersAndSubjects();
      
      const transformedFolders = response.data.folders.map((folder: any) => ({
        ...folder,
        id: folder.id.toString(), 
        subjects: folder.subjects.map((subject: any) => ({
          ...subject,
          id: subject.id.toString(),
          notes: notes.filter(note => note.subjectName === subject.name),
          lastEditDate: subject.last_edit_date || subject.created_at
        })),
      }));
      
      setFolders(transformedFolders);
    } catch (err) {
      console.error('Error fetching folders and subjects:', err);
      setError('Failed to load folders and subjects');
      showToast('error', 'Error', 'Failed to load folders and subjects');
    }
  }, [notes, showToast]);

  const toggleFolder = (folderId: string) => {
    console.log('Toggling folder:', folderId);
    const folder = folders.find(f => f.id === folderId);
    console.log('Found folder:', folder);

    if (folder) {
      if (selectedFolder && selectedFolder.id === folderId) {
        // Deselecting the current folder
        setSelectedFolder(null);
        setCurrentView('all');
        setExpandedFolders([]);
      } else {
        // Selecting a new folder
        setSelectedFolder(folder);
        setCurrentView('folder');
        setExpandedFolders([folderId]);
      }
      setSelectedSubject(null);
    } else {
      console.error('Folder not found');
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []); 

  useEffect(() => {
    fetchFoldersAndSubjects();
  }, [fetchFoldersAndSubjects, notes]); 

  const handleAddNote = () => {
    setIsNewNotePopupOpen(true);
  };

  const handleMainSearch = () => {
    console.log('Main search clicked with term:', mainSearchTerm);
  };

  const handleAddSubject = (folderId: string) => {
    setSelectedFolderId(folderId);
    setIsNewSubjectPopupOpen(true);
  };

  const renderTitle = () => {
    if (currentView === 'all') {
      return <h1 className="current-view-title">All Notes</h1>;
    } else if (currentView === 'folder' && selectedFolder) {
      return <h1 className="current-view-title">{selectedFolder.name}</h1>;
    } else if (typeof currentView !== 'string' && selectedFolder) {
      return (
        <h1 className="current-view-title">
          <span 
            className="folder-title"
            onClick={() => {
              setCurrentView('folder');
              setSelectedSubject(null);
            }}
          >
            {selectedFolder.name}
          </span>
          <span className="title-separator"> - </span>
          <span className="subject-title">{currentView.name}</span>
        </h1>
      );
    }
    return null;
  };

  const handleNewSubjectSubmit = useCallback(async (subjectName: string) => {
    if (selectedFolderId) {
      try {
        setIsNewSubjectPopupOpen(false);
        setLoadingNewNote(true);
        console.log('Sending subject creation request:', { name: subjectName, folder_id: selectedFolderId });
        const response = await api.createSubject({
          name: subjectName,
          folder_id: selectedFolderId
        });

        console.log('Subject created successfully:', response.data);

        const newSubject = {
          id: response.data.id.toString(),
          name: response.data.name,
          notes: [],
          createdAt: new Date().toISOString(),
          lastEditDate: new Date().toISOString()
        };

        setFolders(prevFolders => {
          const updatedFolders = prevFolders.map(folder => 
            folder.id === selectedFolderId
              ? {
                  ...folder,
                  subjects: [
                    ...folder.subjects,
                    newSubject
                  ]
                }
              : folder
          );
          
          // If we're currently viewing the folder where the new subject was added,
          // update the selectedFolder state as well
          if (selectedFolder && selectedFolder.id === selectedFolderId) {
            setSelectedFolder(updatedFolders.find(f => f.id === selectedFolderId) || null);
          }
          
          return updatedFolders;
        });

        // Force a re-render of the current view
        setCurrentView(prevView => {
          if (prevView === 'folder') {
            // If we're in the folder view, toggle it to trigger a re-render
            setCurrentView('all');
            setTimeout(() => setCurrentView('folder'), 0);
          }
          return prevView;
        });

        showToast('info', 'Success', 'Subject created successfully');
      } catch (error) {
        console.error('Error creating subject:', error);
        setErrorPopup({ isOpen: true, message: 'Failed to create subject. Please try again.' });
        showToast('error', 'Error', 'Failed to create subject. Please try again.');
      } finally {
        setLoadingNewNote(false);
      }
    }
  }, [selectedFolderId, selectedFolder, showToast]);

  const sortNotes = (notesToSort: Note[]): Note[] => {
    return notesToSort.sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime();
      const dateB = new Date(b.updatedAt).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  };


  const getCurrentNotes = () => {
    let currentNotes;
    if (typeof currentView !== 'string') {
      currentNotes = currentView.notes;
    } else {
      currentNotes = notes;
    }
    
    if (mainSearchTerm) {
      currentNotes = currentNotes.filter(note => 
        note.title.toLowerCase().includes(mainSearchTerm.toLowerCase())
      );
    }

    return sortNotes(currentNotes);
  };

  const handleSubjectClick = useCallback((subject: Subject, folder: Folder) => {
    console.log('Subject clicked:', subject);
    console.log('Subject notes:', subject.notes);
    setSelectedFolder(folder);
    setSelectedSubject(subject);
    setCurrentView(subject);
  }, []);

  const handleNoteClick = (note: Note) => {
    navigate(`/notes/${note.id}`, { state: { note } });
  };

  const handleDeleteNote = async (noteId: string) => {
    setDeleteConfirmation({ isOpen: true, noteId });
  };

  const confirmDeleteNote = async () => {
    if (deleteConfirmation.noteId) {
      console.log('Attempting to delete note with id:', deleteConfirmation.noteId);
      try {
        setDeleteConfirmation({ isOpen: false, noteId: null });
        setLoadingNewNote(true);
        const response = await api.deleteNote(deleteConfirmation.noteId);
        console.log('Delete response:', response);
        
        if (response.status === 200) {
          // Remove the note from the notes state
          setNotes(prevNotes => prevNotes.filter(note => note.id !== deleteConfirmation.noteId));
          
          // Update folders state
          setFolders(prevFolders => 
            prevFolders.map(folder => ({
              ...folder,
              subjects: folder.subjects.map(subject => ({
                ...subject,
                notes: subject.notes.filter(note => note.id !== deleteConfirmation.noteId)
              }))
            }))
          );
          
          // Update currentView if it's a subject view
          if (typeof currentView !== 'string') {
            setCurrentView(prevView => {
              if (typeof prevView !== 'string' && prevView !== undefined) {
                return {
                  ...prevView,
                  notes: prevView.notes.filter(note => note.id !== deleteConfirmation.noteId)
                };
              } else {
                // Handle the case where prevView is a string or undefined
                return prevView;
              }
            });
          }
          
          // Update selectedSubject if necessary
          if (selectedSubject) {
            setSelectedSubject(prevSubject => {
              if (prevSubject && typeof prevSubject === 'object' && 'notes' in prevSubject) {
                return {
                  ...prevSubject,
                  notes: prevSubject.notes.filter(
                    note => note.id !== deleteConfirmation.noteId
                  ),
                };
              } else {
                // Return prevSubject as is if it's not the expected object
                return prevSubject;
              }
            });
          }
          
          showToast('info', 'Note Deleted', 'Note Deleted Successfully');
        } else {
          throw new Error('Unexpected response status');
        }
      } catch (error) {
        console.error('Error deleting note:', error);
        if (error instanceof Error && 'response' in error && error.response && typeof error.response === 'object' && 'data' in error.response) {
          console.error('Error response:', error.response.data);
          setErrorPopup({ isOpen: true, message: (error.response.data as { message?: string }).message || 'Failed to delete note. Please try again.' });
          showToast('error', 'Error', 'Failed to delete note. Please try again.');
        } else {
          setErrorPopup({ isOpen: true, message: 'Failed to delete note. Please try again.' });
          showToast('error', 'Error', 'Failed to delete note. Please try again.');
        }
      } finally {
        setLoadingNewNote(false);
      }
    }
  };


  const cancelDeleteNote = () => {
    setDeleteConfirmation({ isOpen: false, noteId: null });
  };

  const handleEditNote = (noteId: string) => {
    setEditingNoteId(noteId);
  };


  const handleEditSubject = (subjectId: string) => {
    setEditingSubjectId(subjectId);
  };

  const handleNoteShare = useCallback(async (noteId: string, shareUserEmail: string, isEditor: boolean) => {
    console.log('Attempting to share note:', { noteId, shareUserEmail, isEditor });
    
    if (shareUserEmail.toLowerCase() === email.toLowerCase()) {
      console.log('Sharing with self attempted');
      showToast('error', 'Error', 'You cannot share a note with yourself.');
      return;
    }
  
    try {
      setIsSharingNotePopupOpen(false);
      setLoadingNewNote(true);
  
      // Check if the current user is the owner of the note
      const userRoleResponse = await api.getUserRole(noteId);
      const userRole = userRoleResponse.data.role;
  
      if (userRole !== 'owner') {
        console.log('User is not the owner of the note');
        showToast('error', 'Error', 'Only owners can share notes.');
        return;
      }
  
      console.log('Checking if email exists:', shareUserEmail);
      const emailExists = await api.checkEmailExists(shareUserEmail);
      console.log('Email exists:', emailExists);
      
      if (!emailExists) {
        console.log('Email does not exist:', shareUserEmail);
        showToast('error', 'Error', 'The provided email does not exist.');
        return;
      }
  
      console.log('Sharing note:', { noteId, shareUserEmail, isEditor });
      await api.shareNote(noteId, shareUserEmail, isEditor);
      console.log('Note shared successfully');
      showToast('success', 'Success', 'Note shared successfully');
  
      // Notify the WebSocket server
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: 'share',
            sharedEmail: shareUserEmail,
            noteId,
            sharedBy: email,
          })
        );
      }
    } catch (error) {
      console.error('Error sharing note:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
      }
      showToast('error', 'Error', 'Failed to share note. Please try again.');
    } finally {
      setLoadingNewNote(false);
    }
  }, [email, showToast]);

  const handleNewCategorySubmit = useCallback(async (folderName: string) => {
    if (folderName) {
      if (folders.some(folder => folder.name.toLowerCase() === folderName.toLowerCase())) {
        showToast('error', 'Error', 'Category name already exists.');
        return;
      }
      try {
        setIsNewCategoryPopupOpen(false);
        setLoadingNewNote(true);
        const response = await api.createFolder(folderName);
        console.log('Category created successfully:', response.data);
        
        // Add the new folder to the state
        const newFolder: Folder = {
          id: response.data.id.toString(),
          name: response.data.name,
          subjects: []
        };
        
        setFolders(prevFolders => [...prevFolders, newFolder]);
        showToast('success', 'Success', 'Category created successfully');
        fetchFoldersAndSubjects();
      } catch (err) {
        console.error('Error creating category:', err);
        setErrorPopup({ isOpen: true, message: 'Failed to create category. Please try again.' });
        showToast('error', 'Error', 'Failed to create category. Please try again.');
      } finally {
        setLoadingNewNote(false);
      }
    }
  }, [folders, showToast, fetchFoldersAndSubjects]);

  const [loadingNewNote, setLoadingNewNote] = useState(false);

  const handleNewNoteSubmit = useCallback(async (title: string, folderName: string, subjectName: string) => {
    if (notes.length >= 1000) {
      setErrorPopup({ isOpen: true, message: 'Too Many Notes. Maximum limit reached.' });
      showToast('warn', 'Too Many Notes', 'Maximum limit reached.');
      return;
    }
  
    setLoadingNewNote(true);
  
    try {
      const currentDate = new Date().toISOString();
  
      const response = await api.createNote({
        title,
        content: '',
        folderName,
        subjectName,
        createdAt: currentDate,
      });
  
      const newNote = {
        ...response.data,
        id: response.data.id.toString(),
        updatedAt: response.data.updated_at || currentDate,
        folderName: response.data.folder_name || folderName,
        subjectName: response.data.subject_name || subjectName,
        color: response.data.color || '#637c99',
      };
  
      setNotes(prevNotes => [...prevNotes, newNote]);
  
      setFolders(prevFolders => {
        const updatedFolders = prevFolders.map(folder => {
          if (folder.name === folderName) {
            return {
              ...folder,
              subjects: folder.subjects.map(subject => {
                if (subject.name === subjectName) {
                  return {
                    ...subject,
                    notes: [...subject.notes, newNote],
                  };
                }
                return subject;
              }),
            };
          }
          return folder;
        });
  
        // If we're currently viewing the folder where the new note was added,
        // update the selectedFolder state as well
        if (selectedFolder && selectedFolder.name === folderName) {
          setSelectedFolder(updatedFolders.find(f => f.name === folderName) || null);
        }
  
        return updatedFolders;
      });
  
      // Update the current view if it's a subject
      if (typeof currentView !== 'string' && currentView.name === subjectName) {
        setCurrentView(prevView => {
          if (typeof prevView !== 'string' && prevView !== undefined) {
            return {
              ...prevView,
              notes: [...prevView.notes, newNote],
            };
          } else {
            return prevView;
          }
        });
      }
  
      setIsNewNotePopupOpen(false);
      showToast('info', 'New Note Created', 'Successfully created a new note');
    } catch (error) {
      console.error('Error creating note:', error);
      setErrorPopup({ isOpen: true, message: 'Failed to create note. Please try again.' });
      showToast('error', 'Error', 'Failed to create note. Please try again.');
    } finally {
      setLoadingNewNote(false);
    }
  }, [selectedFolder, currentView, showToast, notes]);

  const getContentPreview = (content: string, maxLength: number = 100) => {
    if (!content) return '';
    const strippedContent = content.replace(/<[^>]*>/g, '');

    if (strippedContent.length <= maxLength) return strippedContent;
    return strippedContent.substring(0, maxLength) + '...';
  };

  const handleSort = (order: 'asc' | 'desc') => {
    setSortOrder(order);
    setIsSortOpen(false);
    
    setCurrentView(prevView => {
      // Force a re-render of the current view
      if (typeof prevView === 'object' && prevView !== null && 'notes' in prevView) {
        return {
          ...prevView,
          notes: sortNotes([...prevView.notes || []]),
        };
      } else {
        return prevView;
      }
    });
    
    showToast('info', 'Sorted', `Notes sorted in ${order === 'asc' ? 'ascending' : 'descending'} order`);
  };

  const handleShare = useCallback((noteId: string,) => {
    console.log(`Sharing note with id: ${noteId}`);
    setShareNoteId(noteId);
    setIsSharingNotePopupOpen(true);
  }, []);

  const handleCreateFolder = async () => {
    setIsNewCategoryPopupOpen(true);
  };

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const resizeImage = (file: File, size: number): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          
          // Calculate the scaling factor
          const scale = Math.max(size / img.width, size / img.height);
          
          // Calculate the center position
          const x = (size - img.width * scale) / 2;
          const y = (size - img.height * scale) / 2;
          
          // Draw the image on the canvas
          ctx?.drawImage(img, x, y, img.width * scale, img.height * scale);
  
          // Convert canvas to blob
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            } else {
              reject(new Error('Canvas to Blob conversion failed'));
            }
          }, 'image/jpeg');
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setIsLoading(true);
        // Resize the image to 200x200 pixels
        const resizedFile = await resizeImage(file, 200);
  
        // Upload the resized image to Firebase storage
        const downloadURL = await api.uploadProfileImage(resizedFile);
        
        if (downloadURL) {
          // Update the profile with the new image URL
          await api.updateProfileImage(downloadURL);
          setProfileImageUrl(downloadURL);
          showToast('success', 'Profile Image Updated', 'Profile image updated and saved successfully');
        } else {
          throw new Error('Failed to get image URL from server');
        }
      } catch (error) {
        console.error('Error updating profile image:', error);
        showToast('error', 'Error', 'Failed to update and save profile image');
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="home-page">
      {loadingNewNote && (
        <div className="fixed inset-0 flex items-center justify-center bg-opacity-50 bg-gray-400 z-50">
          <ProgressSpinner
            style={{ width: '70px', height: '70px' }}
            strokeWidth="4"
            animationDuration="2s"
          />
        </div>
      )}
      <div className={`sidebar ${isSidebarVisible ? 'visible' : 'hidden'}`}>
        {inboxCount > 0 && !loading && (
        <Badge
          value={inboxCount} 
          severity="danger"
          onClick={handleInbox}
          className="absolute z-10 left-16 top-7 transform transition-transform hover:scale-105 active:scale-100 cursor-pointer"
        ></Badge>
        )}
        <div
          className="user-info flex items-center mb-8 relative"
          tabIndex={0}
        >
        
        <div className="flex">
          {loading ? (
            // Show skeleton for avatar while loading
            <Skeleton shape="circle" size="3rem" />
          ) : (
            <Avatar 
              image={profileImageUrl || undefined}
              icon={"pi pi-user"}
              className="w-12 h-12 rounded-full shadow-sm transform transition-transform hover:scale-110 focus:scale-110 active:scale-100 cursor-pointer object-cover overflow-hidden"
              size="large" 
              shape="circle" 
              onClick={(e) => menu.current?.toggle(e)} 
              onKeyPress={(e) => e.key === 'Enter' && menu.current?.toggle(e)}
              tabIndex={0}
            />
          )}
        </div>
        {loading ? (
        // Show skeleton for username while loading
          <Skeleton width="4rem" className="ml-3" />
        ) : (
          <span
            className="username ml-3 font-medium text-lg transform transition-transform hover:scale-110 focus:scale-110 active:scale-100 cursor-pointer"
            onClick={(e) => menu.current?.toggle(e)}
            onKeyPress={(e) => e.key === 'Enter' && menu.current?.toggle(e)}
            tabIndex={0}
          >
            {username}
          </span>
        )}
        <Menu 
          model={menuItems} 
          popup 
          ref={menu} 
          className="rounded-lg mt-2 w-full max-w-60 border-2 shadow-lg" 
        />
        </div>
        <div className="search-bar">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search Category"
              value={categorySearchTerm}
              onChange={(e) => setCategorySearchTerm(e.target.value)}
              className="search-input"
            />
            <button className="search-button">
              <FaSearch />
            </button>
          </div>
        </div>
        <div className="folder-structure">
          <div className="all-notes" onClick={() => {
            setCurrentView('all');
            setSelectedFolder(null);
            setSelectedSubject(null);
          }}>All Notes</div>
          {loading ? (
            // Show skeleton placeholders while loading
            <>
              <Skeleton height="3rem" className="mb-4" borderRadius="8px" />
              <Skeleton height="3rem" className="mb-4" borderRadius="8px" />
              <Skeleton height="3rem" className="mb-4" borderRadius="8px" />
              <Skeleton height="3rem" className="mb-4" borderRadius="8px" />
            </>
          ) : (
            filteredFolders.map((folder) => (
              <div key={folder.id} className="folder">
                <div
                  className={`folder-header ${selectedFolder?.id === folder.id ? 'selected' : ''}`}
                  onClick={() => toggleFolder(folder.id)}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      toggleFolder(folder.id);  // Trigger folder opening on Enter key
                    }
                  }}
                >
                  {editingFolderId === folder.id ? (
                    <input
                      type="text"
                      defaultValue={folder.name}
                      onBlur={(e) => handleSaveFolderEdit(folder.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.currentTarget.blur(); // This will trigger the onBlur event
                        }
                      }}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                      className="folder-edit-input" 
                    />
                  ) : (
                    <span>{folder.name}</span>
                  )}
                  <div className="folder-actions">
                    <button
                      className="folder-options-btn"
                      onClick={(e) => handleFolderOptions(e, folder.id)}
                      tabIndex={0}
                    >
                      <FaEllipsisV />
                    </button>
                    <span className="folder-toggle">
                      {expandedFolders.includes(folder.id) ? '▼' : '▶'}
                    </span>
                  </div>
                </div>
                {selectedFolder?.id === folder.id && (
                  <div className="subjects-container">
                    <div
                      className="subject add-subject flex items-center px-3 py-2 hover:bg-blue-500 hover:text-white focus:bg-blue-500 focus:text-white transition-colors duration-300 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddSubject(folder.id);
                      }}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddSubject(folder.id);
                        }
                      }}
                    >
                      <FaPlus className="mr-2 text-sm" /> <span>Add Subject</span>
                    </div>

                    <div className="subjects-scroll">
                      {folder.subjects.map((subject) => (
                        <div
                          key={subject.id}
                          className={`subject ${selectedSubject?.id === subject.id ? 'selected' : ''}`}
                          onClick={() => handleSubjectClick(subject, folder)}
                          tabIndex={0}
                        >
                          {editingSubjectId === subject.id ? (
                            <input
                              type="text"
                              defaultValue={subject.name}
                              onBlur={(e) => handleSaveSubjectEdit(subject.id, e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  e.currentTarget.blur(); // This will trigger the onBlur event
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              autoFocus
                            />
                          ) : (
                            <span>{subject.name}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        <div className="sidebar-footer">
          <button className="signout-btn" onClick={handleCreateFolder} tabIndex={0}>Create Category</button>
        </div>
      </div>
      {/* <div 
        className="burger-icon-container desktop-burger"
        style={{ left: isSidebarVisible ? '300px' : '0' }}
      >
        <FaBars 
          className="burger-icon cursor-pointer" 
          onClick={toggleSidebar} 
        />
      </div> */}
      <div 
        className="burger-icon-container mobile-burger w-16 top-8 right-8 rounded-md"
        onClick={toggleSidebar}
      >
        <FaBars 
          className="burger-icon cursor-pointer" 
        />
      </div>
        <div className="main-content">
          <div className="top-bar">
            {renderTitle()}
            <div className="top-bar-right">
              {currentView === 'all' && (
                <>
                  <div className="search-container">
                    <input
                      type="text"
                      placeholder="Search notes..."
                      value={mainSearchTerm}
                      onChange={(e) => setMainSearchTerm(e.target.value)}
                      className="search-input"
                      tabIndex={0}
                    />
                    <button onClick={handleMainSearch} className="search-button">
                      <FaSearch />
                    </button>
                  </div>
                </>
              )}
              {(currentView === 'all' || typeof currentView !== 'string') && (
                <button onClick={handleAddNote} className="add-note-button" tabIndex={0}>
                  <FaPlus /> Create Note
                </button>
              )}
            </div>
          </div>
        
        {currentView === 'all' && (
          <div className="notes-grid">
            {loading ? (
              <>
                <div className="note-card">
                  <Skeleton shape="rectangle" height="120px" className="mb-5" />
                  <Skeleton width="60%" className="mb-2" />
                  <Skeleton width="40%" className="mb-2" />
                  <Skeleton width="80%" className="mb-2" />
                </div>
                <div className="note-card">
                  <Skeleton shape="rectangle" height="120px" className="mb-5" />
                  <Skeleton width="60%" className="mb-2" />
                  <Skeleton width="40%" className="mb-2" />
                  <Skeleton width="80%" className="mb-2" />
                </div>
                <div className="note-card">
                  <Skeleton shape="rectangle" height="120px" className="mb-5" />
                  <Skeleton width="60%" className="mb-2" />
                  <Skeleton width="40%" className="mb-2" />
                  <Skeleton width="80%" className="mb-2" />
                </div>
                <div className="note-card">
                  <Skeleton shape="rectangle" height="120px" className="mb-5" />
                  <Skeleton width="60%" className="mb-2" />
                  <Skeleton width="40%" className="mb-2" />
                  <Skeleton width="80%" className="mb-2" />
                </div>
              </>
            ) : (
              getCurrentNotes().map((note) => (
                <div key={note.id} className="note-card" tabIndex={0} onClick={() => handleNoteClick(note)}>
                  <div 
                    className="note-thumbnail"
                    style={{
                      '--note-color-light': `${note.color}33`,
                      '--note-color-dark': `${note.color}cc`
                    } as React.CSSProperties}
                  >
                    <div className="note-preview">
                    </div>
                  </div>
                  <div className="note-content">
                    {editingNoteId === note.id ? (
                      <input
                        type="text"
                        defaultValue={note.title}
                        onBlur={(e) => handleSaveEdit(note.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            e.currentTarget.blur(); // This will trigger the onBlur event
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    ) : (
                      <h3 className="note-title">{note.title}</h3>
                    )}
                    <p className="note-category">{note.folderName}: {note.subjectName}</p>
                    <p className="note-date">Last Edited: {formatDate(note.updatedAt)}</p>
                  </div>
                  <div className="note-actions">
                    <button
                      className={`icon-button color-btn ${showColorPicker === note.id ? 'active' : ''}`}
                      aria-label="Change note color"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowColorPicker(prevState => prevState === note.id ? null : note.id);
                      }}
                    >
                      <FaPalette />
                    </button>
                    {showColorPicker === note.id && (
                      <div className="color-picker-tooltip">
                        {colors.map((color, index) => (
                          <button
                            key={index}
                            className="color-option"
                            style={{ backgroundColor: color }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleColorChange(note.id, color);
                            }}
                          />
                        ))}
                      </div>
                    )}
                    <button
                      className="icon-button edit-btn"
                      aria-label="Edit note"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditNote(note.id);
                      }}
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="icon-button delete-btn"
                      aria-label="Delete note"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(note.id);
                      }}
                    >
                      <FaTrash />
                    </button>
                    <button
                      className="icon-button share-btn"
                      aria-label="Share note"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(note.id);
                      }}
                    >
                      <FaShare />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        )}

        {currentView === 'folder' && selectedFolder && (
          <div className="subjects-grid">
            {selectedFolder.subjects && selectedFolder.subjects.length > 0 ? (
              selectedFolder.subjects.map(subject => (
                <div key={subject.id} className="subject-block" onClick={() => handleSubjectClick(subject, selectedFolder)}>
                  <div className="subject-content">
                    <h3 className="subject-title">{subject.name}</h3>
                    <p className="subject-info"></p>    
                  </div>
                  <div className="subject-actions">
                    <button 
                      className="subject-action-btn edit-subject-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditSubject(subject.id);
                      }}
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className="subject-action-btn delete-subject-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSubject(subject.id);
                      }}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-notes-message">No subjects found in this Category.</div>
            )}
          </div>
        )}
        
        {typeof currentView !== 'string' && (
          <div className="notes-grid">
            {currentView.notes && currentView.notes.length > 0 ? (
              currentView.notes.map((note) => (
                <div key={note.id} className="note-card" onClick={() => handleNoteClick(note)}>
                  <div 
                    className="note-thumbnail"
                    style={{
                      '--note-color-light': `${note.color}33`,
                      '--note-color-dark': `${note.color}cc`
                    } as React.CSSProperties}
                  >
                    <div className="note-preview">
                    </div>
                  </div>
                  <div className="note-content">
                    {editingNoteId === note.id ? (
                      <input
                        type="text"
                        defaultValue={note.title}
                        onBlur={(e) => handleSaveEdit(note.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            e.currentTarget.blur(); // This will trigger the onBlur event
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    ) : (
                      <h3 className="note-title">{note.title}</h3>
                    )}
                    <p className="note-category">{note.folderName}: {note.subjectName}</p>
                    <p className="note-date">Last Edited: {formatDate(note.updatedAt)}</p>
                  </div>
                  <div className="note-actions">
                    <button
                      className={`icon-button color-btn ${showColorPicker === note.id ? 'active' : ''}`}
                      aria-label="Change note color"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowColorPicker(prevState => prevState === note.id ? null : note.id);
                      }}
                    >
                      <FaPalette />
                    </button>
                    {showColorPicker === note.id && (
                      <div className="color-picker-tooltip">
                        {colors.map((color, index) => (
                          <button
                            key={index}
                            className="color-option"
                            style={{ backgroundColor: color }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleColorChange(note.id, color);
                            }}
                          />
                        ))}
                      </div>
                    )}
                    <button
                      className="icon-button edit-btn"
                      aria-label="Edit note"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditNote(note.id);
                      }}
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="icon-button delete-btn"
                      aria-label="Delete note"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNote(note.id);
                      }}
                    >
                      <FaTrash />
                    </button>
                    <button
                      className="icon-button share-btn"
                      aria-label="Share note"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(note.id);
                      }}
                    >
                      <FaShare />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-notes-message">No notes found in this subject.</div>
            )}
          </div>
        )}
  
      </div>
      {currentView !== 'folder' && (
        <div className="sort-container">
          <button className="sort-btn" onClick={() => setIsSortOpen(!isSortOpen)} aria-label="Sort">
          <FaSort />
        </button>
        {isSortOpen && (
          <div className="sort-popup">
            <button onClick={() => handleSort('desc')}>Most Recent</button>
            <button onClick={() => handleSort('asc')}>Least Recent</button>
          </div>
        )}
      </div>
      )}
      <NewNotePopup
        isOpen={isNewNotePopupOpen}
        onClose={() => setIsNewNotePopupOpen(false)}
        onSubmit={handleNewNoteSubmit}
        selectedFolderName={selectedFolder && selectedSubject ? selectedFolder.name : null}
        selectedSubjectName={selectedSubject ? selectedSubject.name : null}
      />
      {errorPopup.isOpen && (
        <ErrorPopup
          message={errorPopup.message}
          onClose={() => setErrorPopup({ isOpen: false, message: '' })}
        />
      )}
      <ConfirmationPopup
        isOpen={deleteConfirmation.isOpen}
        message="Are you sure you want to delete this note?"
        onConfirm={confirmDeleteNote}
        onCancel={cancelDeleteNote}
      />
      <NewCategoryPopup
        isOpen={isNewCategoryPopupOpen}
        onClose={() => setIsNewCategoryPopupOpen(false)}
        onSubmit={handleNewCategorySubmit}
      />
            <NewSubjectPopup
        isOpen={isNewSubjectPopupOpen}
        onClose={() => setIsNewSubjectPopupOpen(false)}
        onSubmit={handleNewSubjectSubmit}
        folderId={selectedFolderId || ''}
      />
      <ShareNotePopup
        isOpen={isSharingNotePopupOpen}
        onClose={() => setIsSharingNotePopupOpen(false)}
        onShare={handleNoteShare}
        noteId={shareNoteId}
      />
      <Dialog 
        visible={isProfilePopupOpen} 
        onHide={handleProfilePopupClose}
        className="w-full max-w-lg custom-header"
        header="Profile"
        style={{ width: '400px' }} 
        draggable={false}
        modal
      >
        <div className="flex flex-col items-center">
          <div className="relative inline-block mb-6 pt-6">
            <div 
              className="cursor-pointer transition-transform hover:scale-105 active:scale-100"
              onClick={handleAvatarClick}
            >
              <Avatar 
                image={profileImageUrl || undefined}
                icon={"pi pi-user"}
                size="xlarge" 
                shape="circle"
                className="w-24 h-24 rounded-full object-cover overflow-hidden"
              />
            </div>
            {isLoading && (
              <div className="absolute inset-0 top-5 flex items-center justify-center bg-opacity-70 bg-white rounded-full">
                <ProgressSpinner
                  style={{ width: '20px', height: '20px' }}
                  strokeWidth="5"
                  animationDuration="2s"
                />
              </div>
            )}
          </div>
          <div className="flex items-center mb-6">
            <div className="flex items-center">
              <input
                type="text"
                value={tempUsername}
                onChange={(e) => setTempUsername(e.target.value)}
                className="border rounded px-2 py-1 mr-2"
              />
              <button
                onClick={handleSaveUsername}
                className="bg-accentBlue text-white h-8 w-16 rounded hover:bg-primaryDark transition duration-300 ease-in-out"
              >
                {waitingForUsername ? (
                  <ProgressSpinner
                    style={{ width: '20px', height: '20px' }}
                    strokeWidth="5"
                    animationDuration="2s"
                    className="top-0.5"
                  />
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
          <div className="flex items-center mb-6">
            <div className="flex items-center">
              <input
                type="email"
                value={tempEmail}
                onChange={(e) => setTempEmail(e.target.value)}
                className="border rounded px-2 py-1 mr-2"
              />
              <button
                onClick={handleSaveEmail}
                className="bg-accentBlue text-white h-8 w-16 rounded hover:bg-primaryDark transition duration-300 ease-in-out"
              >
                {waitingForEmail ? (
                  <ProgressSpinner
                    style={{ width: '20px', height: '20px' }}
                    strokeWidth="5"
                    animationDuration="2s"
                    className="top-0.5"
                  />
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
          <div className="flex items-center mb-6">
            <button
              onClick={() => setDeleteAccountConfirmation({ isOpen: true })}
              className="py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-300 ease-in-out flex items-center justify-center"
            >
              <i className="pi pi-trash mr-2"></i>
              Delete Account
            </button>
          </div>
        </div>
      </Dialog>
      {renderInboxPopup()}
      <ConfirmationPopup
        isOpen={deleteCategoryConfirmation.isOpen}
        message="Are you sure you want to delete this category?"
        onConfirm={confirmDeleteCategory}
        onCancel={() => setDeleteCategoryConfirmation({ isOpen: false, folderId: null })}
      />
      <ConfirmationPopup
        isOpen={deleteSubjectConfirmation.isOpen}
        message="Are you sure you want to delete this subject?"
        onConfirm={confirmDeleteSubject}
        onCancel={() => setDeleteSubjectConfirmation({ isOpen: false, subjectId: null })}
      />
      <ConfirmationPopup
      isOpen={deleteAccountConfirmation.isOpen}
      message="Are you sure you want to delete your account? This action cannot be undone."
      onConfirm={confirmDeleteAccount}
      onCancel={() => setDeleteAccountConfirmation({ isOpen: false })}
      className="delete-account-confirmation" 
      />
      {folderOptionsMenu.isOpen && (
        <div 
          className="folder-options-menu"
          style={{
            position: 'absolute',
            top: `${folderOptionsMenu.top}px`,
            left: '300px', 
            transform: 'translateY(-30%)',
          }}
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the menu
        >
          <button 
            className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 transition-colors duration-200"
            onClick={() => handleEditFolder(folderOptionsMenu.folderId!)}
            tabIndex={0}
          >
            Rename
          </button>
          <button 
            className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 transition-colors duration-200"
            onClick={() => handleDeleteFolder(folderOptionsMenu.folderId!)}
            tabIndex={0}
          >
            Delete
          </button>
        </div>
      )}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
        accept="image/*"
      />
    </div>
  );
};

export default HomePage;