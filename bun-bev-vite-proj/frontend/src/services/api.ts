import axios from 'axios';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';

const API_URL = 'http://localhost:8000';

const apiClient = axios.create({
    baseURL: API_URL,
});

// Request interceptor to attach the auth token to headers
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
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
    rememberMe: boolean;
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
    getUserProfile: () => {
        return apiClient.get('/auth/users/profile');
    },
    getNotes: () => apiClient.get('/notes'),
    getShareNotes: () => apiClient.get('/notes/shared-notes'),
    getFoldersAndSubjects: () => apiClient.get('/auth/folders'),
    createFolder: (name: string) => apiClient.post('/auth/folders', { name }),    
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
    shareNote: async (noteId: string, email: string, editor: boolean) => {
        try {
            console.log('Sharing note:', { noteId, email, editor });
            const response = await apiClient.post('/auth/note-user', { noteId, email, editor });
            console.log('Share note response:', response.data);
            return response;
        } catch (error) {
            console.error('Error sharing note:', error);
            if (axios.isAxiosError(error)) {
                console.error('Error response:', error.response?.data);
                console.error('Error status:', error.response?.status);
            }
            throw error;
        }
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
    getUserRoleForNote: (noteId: string) => {
        return apiClient.get(`/auth/note-user/role/${noteId}`);
    },
    updateProfileImage: async (imageUrl: string) => {
        try {
            return apiClient.put('auth/users/profile-image', { imageUrl });
        } catch (error) {
            console.error('Error updating profile image:', error);
            throw error;
        }
    },
    deleteAccount: () => {
        return apiClient.delete('/auth/users/account');
    },
    updateUsername: (username: string) => {
        return apiClient.put('/auth/users/username', { username });
    },
    updateEmail: (email: string) => {
        return apiClient.put('/auth/users/email', { email });
    },
    resetPasswordRequest: (email: string) => {
        return apiClient.post('/auth/request-password-reset', { email });
    },
    resetPassword: (token: string, newPassword: string) => {
        return apiClient.post('/auth/reset-password', { token, newPassword });
    },
    checkEmailExists: async (email: string): Promise<boolean> => {
        try {
            console.log('Checking email existence for:', email);
            const response = await apiClient.post('/auth/users/check-email', { email });
            console.log('Email check response:', response.data);
            return response.data.exists;
        } catch (error) {
            console.error('Error checking email existence:', error);
            if (axios.isAxiosError(error)) {
                console.error('Error response:', error.response?.data);
                console.error('Error status:', error.response?.status);
            }
            throw error;
        }
    },
    getUserDetailsByEmails: (noteId: string, emails: string[]) => {
        return apiClient.post('/auth/users/getUserDetailsByEmails', { noteId, emails });
    },
    getUserRole: (noteId: string) => {
        return apiClient.post('/auth/users/getUserRole', { noteId });
    },
};

export default api;
