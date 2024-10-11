import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaPalette, FaSearch, FaPlus, FaEdit, FaTrash, FaShare, FaSort, FaEllipsisV } from 'react-icons/fa';
import '../styles/HomePage.css';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Avatar } from 'primereact/avatar';
import { Menu } from 'primereact/menu';
import { Dialog } from 'primereact/dialog';
import { Badge } from 'primereact/badge';
import { Button } from 'primereact/button';


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
    color: string;
}
  
interface ConfirmationPopupProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
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
  const [email, setEmail] = useState('');
  const [isEditor, setIsEditor] = useState(false);

  if (!isOpen || !noteId) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      onShare(noteId, email, isEditor);
      setEmail('');
      setIsEditor(false);
    }
  };

  const handlePermissionChange = (newIsEditor: boolean) => {
    setIsEditor(newIsEditor);
  };

  return (
    <div className="popup-overlay">
      <div className="popup">
        <h2 className="popup-title">Share Note</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Enter email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            className="share-input"
          />
          <div className="permission-select">
            <div className="permission-options">
              <label 
                className={`permission-option ${!isEditor ? 'selected' : ''}`}
                onClick={() => handlePermissionChange(false)}
              >
                <input
                  type="radio"
                  name="permission"
                  value="viewer"
                  checked={!isEditor}
                  onChange={() => {}}
                  className="permission-radio"
                />
                <span className="permission-label">Viewer</span>
              </label>
              <label 
                className={`permission-option ${isEditor ? 'selected' : ''}`}
                onClick={() => handlePermissionChange(true)}
              >
                <input
                  type="radio"
                  name="permission"
                  value="editor"
                  checked={isEditor}
                  onChange={() => {}}
                  className="permission-radio"
                />
                <span className="permission-label">Editor</span>
              </label>
            </div>
          </div>
          <div className="popup-buttons">
            <button type="submit" className="share-button">Share</button>
            <button type="button" onClick={onClose} className="cancel-button">Cancel</button>
          </div>
        </form>
      </div>
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
    if (selectedFolderName && selectedSubjectName) {
      setFolderName(selectedFolderName);
      setSubjectName(selectedSubjectName);
    } else {
      setFolderName('');
      setSubjectName('');
    }
  }, [selectedFolderName, selectedSubjectName]);

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
    setFolderName('');
    setSubjectName('');
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

const ConfirmationPopup: React.FC<ConfirmationPopupProps> = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="popup-overlay">
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
    <div className="popup-overlay">
      <div className="popup">
        <h2 className="popup-title">Add New Subject</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Subject Name"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            required
            autoFocus
          />
          <div className="popup-buttons">
            <button type="submit" className="create-button">Add</button>
            <button type="button" onClick={onClose} className="cancel-button">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};



const HomePage: React.FC<HomePageProps & { showToast: (severity: 'success' | 'info' | 'warn' | 'error' | 'secondary' | 'contrast' | undefined, summary: string, detail: string) => void }> = ({ logout, showToast }) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [subjectSearchTerm, setSubjectSearchTerm] = useState('');
  const [mainSearchTerm, setMainSearchTerm] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState<'all' | 'folder' | Subject>('all');
  const [isNewNotePopupOpen, setIsNewNotePopupOpen] = useState(false);
  const [isNewCategoryPopupOpen, setIsNewCategoryPopupOpen] = useState(false);
  const [isSharingNotePopupOpen, setIsSharingNotePopupOpen] = useState(false);
  const [shareNoteId, setShareNoteId] = useState<string | null>(null);

  //const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [errorPopup, setErrorPopup] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' });
  const navigate = useNavigate();
  const [isSortOpen, setIsSortOpen] = useState(false);
  //const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  // const [showProfileOptions, setShowProfileOptions] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; noteId: string | null }>({ isOpen: false, noteId: null });  
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [username, setUsername] = useState<string>('User');
  const [isNewSubjectPopupOpen, setIsNewSubjectPopupOpen] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // Default to descending (newest first)
 
  const [inboxCount, setInboxCount] = useState<number>(0);
  const [sharedNotes, setSharedNotes] = useState<SharedNote[]>([]);

  const [currentNoteIndex, setCurrentNoteIndex] = useState<number>(0);
  const [isInboxPopupOpen, setIsInboxPopupOpen] = useState<boolean>(false);
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);



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

  const handleEditFolder = (folderId: string) => {
    setEditingFolderId(folderId);
  };


  const handleSaveFolderEdit = async (folderId: string, newName: string) => {
    console.log('Saving folder edit:', folderId, newName);
    try {
      const response = await api.editFolder(folderId, { name: newName });
      console.log('Edit folder response:', response);
      setFolders(prevFolders =>
        prevFolders.map(folder =>
          folder.id === folderId ? { ...folder, name: newName } : folder
        )
      );
      setEditingFolderId(null);
      showToast('success', 'Success', 'Folder name updated successfully');
    } catch (error) {
      console.error('Error editing folder:', error);
      if (error instanceof Error && 'response' in error) {
        const axiosError = error as { response?: { data: any, status: number } };
        console.error('Error response:', axiosError.response?.data);
        console.error('Error status:', axiosError.response?.status);
      }
      showToast('error', 'Error', `Failed to update folder name: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

  };

  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      await api.updateNoteColor(noteId, color);
      setNotes(prevNotes =>
        prevNotes.map(note =>
          note.id === noteId ? { ...note, color } : note
        )
      );
      showToast('info', 'Success', 'Note color updated successfully');
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
  };

  const handleDeleteSubject = (subjectId: string) => {
    setDeleteSubjectConfirmation({ isOpen: true, subjectId });
  };

  const confirmDeleteCategory = async () => {
    if (deleteCategoryConfirmation.folderId) {
      try {
        await api.deleteFolder(deleteCategoryConfirmation.folderId);
        setFolders(prevFolders => prevFolders.filter(folder => folder.id !== deleteCategoryConfirmation.folderId));
        showToast('success', 'Success', 'Category deleted successfully');
      } catch (err) {
        console.error('Error deleting category:', err);
        showToast('error', 'Error', 'Failed to delete category. Please try again.');
      }
    }
    setDeleteCategoryConfirmation({ isOpen: false, folderId: null });
  };

  const confirmDeleteSubject = async () => {
    if (deleteSubjectConfirmation.subjectId) {
      try {
        await api.deleteSubject(deleteSubjectConfirmation.subjectId);
        setFolders(prevFolders => 
          prevFolders.map(folder => ({
            ...folder,
            subjects: folder.subjects.filter(subject => subject.id !== deleteSubjectConfirmation.subjectId)
          }))
        );
        showToast('success', 'Success', 'Subject deleted successfully');
      } catch (err) {
        console.error('Error deleting subject:', err);
        showToast('error', 'Error', 'Failed to delete subject. Please try again.');
      }
    }
    setDeleteSubjectConfirmation({ isOpen: false, subjectId: null });
  };


  const menuItems = [
    {
      label: 'Profile',
      icon: 'pi pi-user',
      command: () => setIsProfilePopupOpen(true),
      template: (item: any, options: any) => (
        <button onClick={options.onClick} className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-100 transition-colors duration-200">
          <span className="flex items-center">
            <i className={`${item.icon} mr-2`}></i>
            <span>{item.label}</span>
          </span>
        </button>
      )
    },
    { 
      label: 'Inbox', 
      icon: 'pi pi-inbox', 
      command: () => handleInbox(),
      template: (item: any, options: any) => (
        <button onClick={options.onClick} className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-100 transition-colors duration-200">
          <span className="flex items-center">
            <i className={`${item.icon} mr-2`}></i>
            <span>{item.label}</span>
          </span>
          {inboxCount > 0 && <Badge value={inboxCount} severity="danger" className="ml-2"></Badge>}
        </button>
      )
    },
    {
      label: 'Logout',
      icon: 'pi pi-sign-out',
      command: () => logout(),
      template: (item: any, options: any) => (
        <button onClick={options.onClick} className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-100 transition-colors duration-200">
          <span className="flex items-center">
            <i className={`${item.icon} mr-2`}></i>
            <span>{item.label}</span>
          </span>
        </button>
      )
    }
  ];

  const handleInbox = () => {
    if (inboxCount > 0) {
      setIsInboxPopupOpen(true);
    } else {
      showToast('info', 'Inbox Empty', 'You have no shared notes.');
    }
  };

  const handleAcceptNote = async () => {
    const noteId = sharedNotes[currentNoteIndex].note_id;

    if (!noteId) {
      showToast('error', 'Error', 'No note selected to accept.');
      return; // Exit if noteId is undefined
    }

    try {
      await api.acceptInvite({ noteId });
      showToast('success', 'Note Accepted', 'The shared note has been added to your notes.');
      removeCurrentNote();
      await fetchNotes();
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
      return; // Exit if noteId is undefined
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
      const response = await api.getUserData();

      setUsername(response.data.username);
      setProfileImageUrl(response.data.profile_image_url || null);

      console.log('User data:', response.data);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load user data');
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
      }));
      console.log('Transformed notes:', transformedNotes);
      setNotes(transformedNotes);
    } catch (err) {
      console.error('Error fetching notes:', err);
      setError('Failed to load notes');
    }
  }, []);


  const fetchFoldersAndSubjects = useCallback(async () => {
    try {
      const response = await api.getFoldersAndSubjects();
      console.log('Raw folders and subjects response:', response.data);
      
      const transformedFolders = response.data.folders.map((folder: any) => ({
        ...folder,
        id: folder.id.toString(), 
        subjects: folder.subjects.map((subject: any) => ({
          ...subject,
          id: subject.id.toString(),
          createdAt: subject.created_at || subject.createdAt || new Date().toISOString(),
          lastEditDate: subject.last_edit_date || subject.lastEditDate || subject.createdAt,
          notes: subject.notes ? subject.notes.map((note: any) => ({
            ...note,
            id: note.id.toString(),
            updatedAt: note.updated_at || note.updatedAt || new Date().toISOString(),
          })) : [],
        })),
      }));
      
      console.log('Transformed folders:', transformedFolders);
      setFolders(transformedFolders);
    } catch (err) {
      console.error('Error fetching folders and subjects:', err);
      setError('Failed to load folders and subjects');
      showToast('error', 'Error', 'Failed to load folders and subjects');
    }
  }, [showToast]);

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
    fetchNotes();
    fetchFoldersAndSubjects();
  }, [fetchNotes, fetchFoldersAndSubjects, selectedFolder, selectedSubject]);

  const handleAddNote = () => {
    setIsNewNotePopupOpen(true);
  };

  const handleSidebarSearch = () => {
    console.log('Sidebar search clicked with term:', subjectSearchTerm);
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
        console.log('Sending subject creation request:', { name: subjectName, folder_id: selectedFolderId });
        const response = await api.createSubject({
          name: subjectName,
          folder_id: selectedFolderId
        });

        console.log('Subject created successfully:', response.data);

        const newSubject = {
          id: response.data.id.toString(),
          name: response.data.name,
          notes: []
        };

        setFolders(prevFolders => {
          const updatedFolders = prevFolders.map(folder => 
            folder.id === selectedFolderId
              ? {
                  ...folder,
                  subjects: [
                    ...folder.subjects,
                    {
                      id: newSubject.id,
                      name: newSubject.name,
                      notes: [],
                      createdAt: new Date().toISOString(),
                      lastEditDate: new Date().toISOString()
                    }
                  ]
                }
              : folder
          );
          return updatedFolders;
        });

        setIsNewSubjectPopupOpen(false);
        showToast('success', 'Success', 'Subject created successfully');
        
        // Refresh folders and subjects
        await fetchFoldersAndSubjects();
      } catch (error) {
        console.error('Error creating subject:', error);
        if (error instanceof Error && 'response' in error) {
          const axiosError = error as { response?: { data: any, status: number } };
          console.error('Error response:', axiosError.response?.data);
          console.error('Error status:', axiosError.response?.status);
        } else if (error instanceof Error) {
          if ('request' in error) {
            console.error('Error request:', error.request);
          } else {
            console.error('Error:', error.message);
          }
        }
        setErrorPopup({ isOpen: true, message: 'Failed to create subject. Please try again.' });
        showToast('error', 'Error', 'Failed to create subject. Please try again.');
      }
    }
  }, [selectedFolderId, showToast, fetchFoldersAndSubjects]);

  const sortNotes = (notesToSort: Note[]): Note[] => {
    return notesToSort.sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime();
      const dateB = new Date(b.updatedAt).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  };


  const getCurrentNotes = () => {
    let currentNotes;
    if (currentView === 'all') {
      currentNotes = notes;
    } else {
      currentNotes = notes.filter(note => 
        currentView !== "folder" && note.subjectName === currentView.name
      );
    }
    return sortNotes(currentNotes);
  };

  const handleSubjectClick = useCallback((subject: Subject) => {
    console.log('Subject clicked:', subject);
    // Find the notes that belong to this subject
    const subjectNotes = notes.filter(note => 
      note.subjectName === subject.name && 
      note.folderName === selectedFolder?.name
    );
    console.log('Notes for this subject:', subjectNotes);
    setSelectedSubject({...subject, notes: subjectNotes});
    setCurrentView({...subject, notes: subjectNotes});
  }, [notes, selectedFolder]);

  const handleNoteClick = (note: Note) => {
    navigate(`/notes/${note.id}`, { state: { note } });
  };

  const handleDeleteNote = (noteId: string) => {
    setDeleteConfirmation({ isOpen: true, noteId });
  };

  const confirmDeleteNote = async () => {
    if (deleteConfirmation.noteId) {
      console.log('Attempting to delete note with id:', deleteConfirmation.noteId);
      try {
        const response = await api.deleteNote(deleteConfirmation.noteId);
        console.log('Delete response:', response);
        
        if (response.status === 200) {
          setNotes(prevNotes => prevNotes.filter(note => note.id !== deleteConfirmation.noteId));
          setErrorPopup({ isOpen: true, message: 'Note deleted successfully' });
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
      }
    }
    setDeleteConfirmation({ isOpen: false, noteId: null });
  };


  const cancelDeleteNote = () => {
    setDeleteConfirmation({ isOpen: false, noteId: null });
  };

  const handleEditNote = (noteId: string) => {
    setEditingNoteId(noteId);
  };

  const handleSaveEdit = async (noteId: string, newTitle: string) => {
    try {
      await api.editNote(noteId, { title: newTitle, content: '' });
      setNotes(prevNotes =>
        prevNotes.map(note =>
          note.id === noteId ? { ...note, title: newTitle } : note
        )
      );
      setEditingNoteId(null);
      showToast('success', 'Success', 'Note title updated successfully');
    } catch (error) {
      console.error('Error editing note:', error);
      showToast('error', 'Error', 'Failed to update note title. Please try again.');
    }
  };

const handleEditSubject = (subjectId: string) => {
  setEditingSubjectId(subjectId);
};

const handleSaveSubjectEdit = async (subjectId: string, newName: string) => {
  try {
    await api.editSubject(subjectId, { name: newName });
    setFolders(prevFolders =>
      prevFolders.map(folder => ({
        ...folder,
        subjects: folder.subjects.map(subject =>
          subject.id === subjectId ? { ...subject, name: newName } : subject
        )
      }))
    );
    setEditingSubjectId(null);
    showToast('success', 'Success', 'Subject name updated successfully');
  } catch (error) {
    console.error('Error editing subject:', error);
    showToast('error', 'Error', 'Failed to update subject name. Please try again.');
  }
};

  const handleNoteShare = useCallback(async (noteId: string, email: string, isEditor: boolean) => {
    try {
      await api.shareNote(noteId, email, isEditor);
      showToast('success', 'Success', 'Note shared successfully');
      setIsSharingNotePopupOpen(false);
    } catch (error) {
      console.error('Error sharing note:', error);
      showToast('error', 'Error', 'Failed to share note. Please try again.');
    }
  }, [showToast]);

  const handleNewCategorySubmit = useCallback(async (folderName: string) => {
    if (folderName) {
      if (folders.some(folder => folder.name.toLowerCase() === folderName.toLowerCase())) {
        showToast('error', 'Error', 'Category name already exists.');
        return;
      }
      try {
        const response = await api.createFolder(folderName);
        console.log('Category created successfully:', response.data);
        
        // Add the new folder to the state
        const newFolder: Folder = {
          id: response.data.id.toString(),
          name: response.data.name,
          subjects: []
        };
        
        setFolders(prevFolders => [...prevFolders, newFolder]);
        fetchFoldersAndSubjects();
      } catch (err) {
        console.error('Error creating category:', err);
        setErrorPopup({ isOpen: true, message: 'Failed to create category. Please try again.' });
        showToast('error', 'Error', 'Failed to create category. Please try again.');
      }
    }
    setIsNewCategoryPopupOpen(false)
  }, [fetchFoldersAndSubjects, showToast]); 

  const handleNewNoteSubmit = useCallback(async (title: string, folderName: string, subjectName: string) => {
    
    if (notes.length >= 1000) {
      setErrorPopup({ isOpen: true, message: 'Too Many Notes. Maximum limit reached.' });
      showToast('warn', 'Too Many Notes', 'Maximum limit reached.');
      return;
    }    

    try {
      const response = await api.createNote({
        title,
        content: '',
        folderName,
        subjectName,
        createdAt: new Date().toISOString()
      });
          
      console.log('Note created successfully:', response.data);
      setIsNewNotePopupOpen(false);
      fetchNotes();
      fetchFoldersAndSubjects();
    } catch (error) {
      console.error('Error creating note:', error);
      setErrorPopup({ isOpen: true, message: 'Failed to create note. Please try again.' });
      showToast('error', 'Error', 'Failed to create note. Please try again.');
    }
  }, [fetchNotes, fetchFoldersAndSubjects]);

  const getContentPreview = (content: string, maxLength: number = 100) => {
    if (!content) return '';
    const strippedContent = content.replace(/<[^>]*>/g, '');

    if (strippedContent.length <= maxLength) return strippedContent;
    return strippedContent.substring(0, maxLength) + '...';
  };

  const handleSort = (order: 'asc' | 'desc') => {
    setSortOrder(order);
    setIsSortOpen(false);
    showToast('success', 'Sorted', `Notes sorted in ${order === 'asc' ? 'ascending' : 'descending'} order`);
  };

  const handleShare = useCallback((noteId: string,) => {
    console.log(`Sharing note with id: ${noteId}`);
    setShareNoteId(noteId);
    setIsSharingNotePopupOpen(true);
  }, []);

  const handleCreateFolder = async () => {
    setIsNewCategoryPopupOpen(true);
  };

  const handleEditProfile = () => {
    console.log('Edit profile clicked');
    // Implement edit profile logic here
  };

  const handleDeleteAccount = () => {
    console.log('Delete account clicked');
    // Implement delete account logic here
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const imageUrl = await api.uploadProfileImage(file);
        await api.updateProfileImage(imageUrl);
        setProfileImageUrl(imageUrl);
        showToast('success', 'Success', 'Profile image updated successfully');
      } catch (error) {
        console.error('Error updating profile image:', error);
        showToast('error', 'Error', 'Failed to update profile image');
      }
    }
  };

 

  // This is replaced with showToast(). TODO: remove
  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="home-page">
      <div className="sidebar">
        <div className="user-info flex items-center mb-8 relative">
          <div className="relative">
            <Avatar 
              image={profileImageUrl || undefined}
              icon={!profileImageUrl ? "pi pi-user" : undefined}
              className="shadow-sm transform transition-transform hover:scale-110 active:scale-100 cursor-pointer"
              size="large" 
              shape="circle" 
              onClick={(e) => menu.current?.toggle(e)} 
            />
            {inboxCount > 0 && (
              <Badge 
                value={inboxCount} 
                severity="danger" 
                className="absolute -top-2 -right-2"
              ></Badge>
            )}
          </div>
          <span 
            className="username ml-3 font-medium text-lg transform transition-transform hover:scale-110 active:scale-100 cursor-pointer" 
            onClick={(e) => menu.current?.toggle(e)}
          >
            {username}
          </span>
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
              value={subjectSearchTerm}
              onChange={(e) => setSubjectSearchTerm(e.target.value)}
              className="search-input"
            />
            <button onClick={handleSidebarSearch} className="search-button">
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
          {folders.map((folder) => (
            <div key={folder.id} className="folder">
              <div
                className={`folder-header ${selectedFolder?.id === folder.id ? 'selected' : ''}`}
                onClick={() => toggleFolder(folder.id)}
              >
                {editingFolderId === folder.id ? (
                  <input
                    type="text"
                    defaultValue={folder.name}
                    onBlur={(e) => handleSaveFolderEdit(folder.id, e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveFolderEdit(folder.id, e.currentTarget.value);
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                ) : (
                  <span>{folder.name}</span>
                )}
                <div className="folder-actions">
                  <button 
                    className="folder-options-btn"
                    onClick={(e) => handleFolderOptions(e, folder.id)}
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
                    className="subject add-subject flex items-center px-3 py-2 hover:bg-blue-500 hover:text-white transition-colors duration-300 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddSubject(folder.id);
                    }}
                  >
                    <FaPlus className="mr-2 text-sm" /> <span>Add Subject</span>
                  </div>

                  <div className="subjects-scroll">
                    {folder.subjects.map((subject) => (
                      <div
                        key={subject.id}
                        className={`subject ${selectedSubject?.id === subject.id ? 'selected' : ''}`}
                      >
                        {editingSubjectId === subject.id ? (
                          <input
                            type="text"
                            defaultValue={subject.name}
                            onBlur={(e) => handleSaveSubjectEdit(subject.id, e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveSubjectEdit(subject.id, e.currentTarget.value);
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
          ))}
        </div>
        <button className="signout-btn" onClick={handleCreateFolder}>Create Category</button>
      </div>
      <div className="main-content">
        <div className="top-bar">
          {renderTitle()}
          <div className="top-bar-right">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search notes..."
                value={mainSearchTerm}
                onChange={(e) => setMainSearchTerm(e.target.value)}
                className="search-input"
              />
              <button onClick={handleMainSearch} className="search-button">
                <FaSearch />
              </button>
            </div>
            <button onClick={handleAddNote} className="add-note-button">
              <FaPlus /> Create Note
            </button>
          </div>
        </div>
        
        {currentView === 'all' && (
          <div className="notes-grid">
          {getCurrentNotes().map((note) => (
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
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveEdit(note.id, e.currentTarget.value);
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
          ))}
        </div>
        )}

        {currentView === 'folder' && selectedFolder && (
          <div className="subjects-grid">
            {selectedFolder.subjects && selectedFolder.subjects.length > 0 ? (
              selectedFolder.subjects.map(subject => (
                <div key={subject.id} className="subject-block">
                  <div onClick={() => handleSubjectClick(subject)}>
                    <h3 className="subject-title">{subject.name}</h3>
                    <p className="subject-info">Created on {"TODO FIX: formatDate(subject.createdAt) gives error"}</p>
                    {subject.notes && subject.notes.length > 0 && (
                      <p className="subject-info">
                        Last edited: {formatDate(subject.notes[0].updatedAt)}
                      </p>
                    )}
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
              <p>No subjects found in this folder.</p>
            )}
          </div>
        )}
        
        {typeof currentView !== 'string' && (
          <div className="notes-grid">
            {currentView.notes && currentView.notes.length > 0 ? (
              currentView.notes.map(note => (
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
                    <h3 className="note-title">{note.title}</h3>
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
                    <button className="icon-button edit-btn" aria-label="Edit note" onClick={(e) => { e.stopPropagation();}}>
                      <FaEdit />
                    </button>
                    <button className="icon-button delete-btn" aria-label="Delete note" onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}>
                      <FaTrash />
                    </button>
                    <button className="icon-button share-btn" aria-label="Share note" onClick={(e) => { e.stopPropagation(); handleShare(note.id); }}>                      <FaShare />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p>No notes found in this subject.</p>
            )}
          </div>
        )}
  
      </div>
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
        onHide={() => setIsProfilePopupOpen(false)}
        className="w-full max-w-lg"
        header="Profile"
        modal
      >
        <div className="flex flex-col items-center">
          <div 
            className="cursor-pointer transition-transform hover:scale-105 active:scale-100 mb-6"
            onClick={handleAvatarClick}
          >
            <Avatar 
              image={profileImageUrl || undefined}
              icon={!profileImageUrl ? "pi pi-user" : undefined}
              size="xlarge" 
              shape="circle"
              className="w-24 h-24"
            />
          </div>
          <h2 className="text-2xl font-bold mb-6">{username}</h2>
          <div className="w-full space-y-4">
            <button
              onClick={handleEditProfile}
              className="w-full py-2 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-300 ease-in-out flex items-center justify-center"
            >
              <i className="pi pi-user-edit mr-2"></i>
              Edit Profile
            </button>
            <button
              onClick={handleDeleteAccount}
              className="w-full py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-300 ease-in-out flex items-center justify-center"
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
      {folderOptionsMenu.isOpen && (
        <div 
          className="folder-options-menu"
          style={{
            position: 'absolute',
            top: `${folderOptionsMenu.top}px`,
            left: '300px', // Adjust this value based on your sidebar width
            transform: 'translateY(-30%)',
          }}
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the menu
        >
          <button 
            className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors duration-200"
            onClick={() => handleEditFolder(folderOptionsMenu.folderId!)}
          >
            Rename
          </button>
          <button 
            className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors duration-200"
            onClick={() => handleDeleteFolder(folderOptionsMenu.folderId!)}
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