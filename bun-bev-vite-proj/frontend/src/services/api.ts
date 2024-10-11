import axios from 'axios';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';

const API_URL = 'http://localhost:8000';

const apiClient = axios.create({
    baseURL: API_URL,
});

// Request interceptor to attach the auth token to headers
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// API function types
interface RegisterData {
    email: string;
    username: string;
    password: string;
}

interface LoginData {
    email: string;
    password: string;
}

interface NoteData {
    title: string;
    content: string;
    folderName: string;
    subjectName: string;
    createdAt: string;
}

interface EditNoteData {
    title: string;
    content: string;
}

interface CreateSubjectData {
    name: string;
    folder_id: string;
}

interface EditFolderData {
    name: string;
    content?: string;
}

interface EditSubjectData {
    name: string;
}

// API functions
const api = {
    login(data: LoginData) {
        return apiClient.post('/auth/login', data);
    },
    register(data: RegisterData) {
        return apiClient.post('/auth/register', data);
    },
    createNote: (noteData: NoteData) => {
        return apiClient.post('/notes', noteData);
    },
    getUserData: () => {
        return apiClient.get('/auth/users/profile');
    },
    getNotes: () => apiClient.get('/notes'),
    getFoldersAndSubjects: () => apiClient.get('/auth/folders'),
    createFolder: (name: string) => apiClient.post('/auth/folders', { name }),    
    // Add this new function
    deleteNote: (noteId: string) => {
        return apiClient.delete(`/notes/${noteId}`);
    },
    editNote: (noteId: string, data: EditNoteData) => {
        return apiClient.put(`/notes/${noteId}`, data);
    },
    getNote: (noteId: string) => {
        return apiClient.get(`/notes/${noteId}`);
    },
    deleteFolder: (folderId: string) => {
        return apiClient.delete(`/auth/folders/${folderId}`);
    },
    createSubject: (data: CreateSubjectData) => {
        return apiClient.post('/auth/subjects', data);
    },
    acceptInvite: (data: { noteId: string }) => {
        return apiClient.post('/auth/note-user/accept', data);
    },
    rejectInvite: (noteId: string) => {
        return apiClient.delete(`/auth/note-user/reject/${noteId}`);
    },
    shareNote: (noteId: string, email: string, editor: boolean) => {
        return apiClient.post('/auth/note-user', { noteId, email, editor });
    },
    getPendingInvites: () => {
        return apiClient.get('/auth/note-user/pending-invites');
    },
    editFolder: (folderId: string, data: { name: string }) => {
        return apiClient.put(`/auth/folders/${folderId}`, data);
    },
    editSubject: (subjectId: string, data: EditSubjectData) => {
        return apiClient.put(`/auth/subjects/${subjectId}`, data);
    },
    deleteSubject: (subjectId: string) => {
        return apiClient.delete(`/auth/subjects/${subjectId}`);
    },
    updateNoteColor: (noteId: string, color: string) => {
        return apiClient.put(`/notes/${noteId}/color`, { color });
    },
    uploadProfileImage: async (file: File): Promise<string> => {
        try {
            console.log("Starting file upload...");
            if (!storage) {
                throw new Error("Firebase storage is not initialized");
            }
            const storageRef = ref(storage, `profile_images/${Date.now()}_${file.name}`);            
            await uploadBytes(storageRef, file);            
            const downloadURL = await getDownloadURL(storageRef);            
            return downloadURL;
        } catch (error) {
            console.error("Error in uploadProfileImage:", error);
            if (error instanceof Error) {
                throw new Error(`Failed to upload image: ${error.message}`);
            } else {
                throw new Error("Failed to upload image: Unknown error");
            }
        }
    },
    updateProfileImage: async (imageUrl: string) => {
        //TODO: Implement this function to set the string in the user document
        
    },
};

export default api;