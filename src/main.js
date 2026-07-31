/**
 * Main application entry point
 * Initializes the app and handles routing between views
 */

import { getDatabase } from './database/Database.js';
import { AlbumService } from './services/AlbumService.js';
import { PhotoService } from './services/PhotoService.js';
import { AlbumGrid } from './components/AlbumGrid.js';
import { PhotoGrid } from './components/PhotoGrid.js';
import { ModalManager } from './components/ModalManager.js';

class PhotoAlbumApp {
    constructor() {
        this.database = null;
        this.albumService = null;
        this.photoService = null;
        this.albumGrid = null;
        this.photoGrid = null;
        this.modalManager = null;
        this.currentAlbum = null;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            console.log('Initializing Photo Album App...');
            
            // Initialize database
            this.database = await getDatabase();
            
            // Initialize services
            this.albumService = new AlbumService(this.database);
            this.photoService = new PhotoService(this.database);
            
            // Initialize components
            this.albumGrid = new AlbumGrid(this.albumService);
            this.photoGrid = new PhotoGrid(this.photoService);
            this.modalManager = new ModalManager();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Load initial data
            await this.loadAlbums();
            
            this.isInitialized = true;
            console.log('Photo Album App initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    setupEventListeners() {
        // Album creation
        const createAlbumBtn = document.getElementById('createAlbumBtn');
        const createFirstAlbumBtn = document.getElementById('createFirstAlbumBtn');
        
        if (createAlbumBtn) {
            createAlbumBtn.addEventListener('click', () => this.showCreateAlbumModal());
        }
        
        if (createFirstAlbumBtn) {
            createFirstAlbumBtn.addEventListener('click', () => this.showCreateAlbumModal());
        }

        // Navigation
        const backToAlbumsBtn = document.getElementById('backToAlbumsBtn');
        if (backToAlbumsBtn) {
            backToAlbumsBtn.addEventListener('click', () => this.showAlbumsView());
        }

        // Photo addition
        const addPhotosBtn = document.getElementById('addPhotosBtn');
        const addFirstPhotosBtn = document.getElementById('addFirstPhotosBtn');
        
        if (addPhotosBtn) {
            addPhotosBtn.addEventListener('click', () => this.showAddPhotosModal());
        }
        
        if (addFirstPhotosBtn) {
            addFirstPhotosBtn.addEventListener('click', () => this.showAddPhotosModal());
        }

        // Album actions
        const albumSettingsBtn = document.getElementById('albumSettingsBtn');
        const deleteAlbumBtn = document.getElementById('deleteAlbumBtn');
        
        if (albumSettingsBtn) {
            albumSettingsBtn.addEventListener('click', () => this.showAlbumSettings());
        }
        
        if (deleteAlbumBtn) {
            deleteAlbumBtn.addEventListener('click', () => this.deleteCurrentAlbum());
        }

        // Search
        const albumSearch = document.getElementById('albumSearch');
        if (albumSearch) {
            albumSearch.addEventListener('input', (e) => this.searchAlbums(e.target.value));
        }

        // View options
        const viewBtns = document.querySelectorAll('.view-btn');
        viewBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.changeView(e.target.dataset.view));
        });

        // Album grid events
        this.albumGrid.onAlbumClick = (album) => this.showAlbumPhotos(album);
        this.albumGrid.onAlbumReorder = (albums) => this.handleAlbumReorder(albums);

        // Photo grid events
        this.photoGrid.onPhotoClick = (photo) => this.showPhotoViewer(photo);
        this.photoGrid.onPhotoRemove = (photo) => this.removePhoto(photo);
    }

    async loadAlbums() {
        try {
            this.showLoading('Loading albums...');
            const albums = await this.albumService.getAllAlbums();
            this.albumGrid.render(albums);
            this.hideLoading();
        } catch (error) {
            console.error('Failed to load albums:', error);
            this.showError('Failed to load albums');
        }
    }

    async showAlbumPhotos(album) {
        try {
            this.currentAlbum = album;
            this.showLoading('Loading photos...');
            
            // Update UI
            document.getElementById('albumTitle').textContent = album.name;
            
            // Load photos for this album
            const photos = await this.photoService.getPhotosByAlbum(album.id);
            this.photoGrid.render(photos);
            
            // Switch views
            this.showPhotosView();
            this.hideLoading();
        } catch (error) {
            console.error('Failed to load album photos:', error);
            this.showError('Failed to load album photos');
        }
    }

    showAlbumsView() {
        document.getElementById('albumsSection').style.display = 'block';
        document.getElementById('photosSection').style.display = 'none';
        this.currentAlbum = null;
    }

    showPhotosView() {
        document.getElementById('albumsSection').style.display = 'none';
        document.getElementById('photosSection').style.display = 'block';
    }

    showCreateAlbumModal() {
        this.modalManager.showAlbumModal((albumData) => this.createAlbum(albumData));
    }

    showAddPhotosModal() {
        if (!this.currentAlbum) return;
        this.modalManager.showAddPhotosModal((files) => this.addPhotos(files));
    }

    showPhotoViewer(photo) {
        this.modalManager.showPhotoViewer(photo);
    }

    showAlbumSettings() {
        if (!this.currentAlbum) return;
        // TODO: Implement album settings modal
        console.log('Album settings for:', this.currentAlbum);
    }

    async createAlbum(albumData) {
        try {
            await this.albumService.createAlbum(albumData);
            await this.loadAlbums();
            this.modalManager.hideModal();
        } catch (error) {
            console.error('Failed to create album:', error);
            this.showError('Failed to create album');
        }
    }

    async addPhotos(files) {
        try {
            this.showLoading('Adding photos...');
            
            for (const file of files) {
                await this.photoService.addPhoto(this.currentAlbum.id, file);
            }
            
            // Reload photos for current album
            await this.showAlbumPhotos(this.currentAlbum);
            this.hideLoading();
            this.modalManager.hideModal();
        } catch (error) {
            console.error('Failed to add photos:', error);
            this.showError('Failed to add photos');
        }
    }

    async removePhoto(photo) {
        if (!confirm('Are you sure you want to remove this photo from the album?')) {
            return;
        }

        try {
            await this.photoService.removePhoto(photo.id);
            await this.showAlbumPhotos(this.currentAlbum);
        } catch (error) {
            console.error('Failed to remove photo:', error);
            this.showError('Failed to remove photo');
        }
    }

    async deleteCurrentAlbum() {
        if (!this.currentAlbum) return;
        
        if (!confirm(`Are you sure you want to delete "${this.currentAlbum.name}" album? This action cannot be undone.`)) {
            return;
        }

        try {
            await this.albumService.deleteAlbum(this.currentAlbum.id);
            this.showAlbumsView();
            await this.loadAlbums();
        } catch (error) {
            console.error('Failed to delete album:', error);
            this.showError('Failed to delete album');
        }
    }

    async handleAlbumReorder(albums) {
        try {
            await this.albumService.reorderAlbums(albums);
        } catch (error) {
            console.error('Failed to reorder albums:', error);
            this.showError('Failed to reorder albums');
        }
    }

    searchAlbums(query) {
        // TODO: Implement search functionality
        console.log('Search albums for:', query);
    }

    changeView(view) {
        // Update active view button
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        // TODO: Implement view switching
        console.log('Change view to:', view);
    }

    showLoading(message = 'Loading...') {
        const loadingOverlay = document.getElementById('loadingOverlay');
        const loadingText = document.getElementById('loadingText');
        
        if (loadingText) loadingText.textContent = message;
        if (loadingOverlay) loadingOverlay.style.display = 'flex';
    }

    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    }

    showError(message) {
        alert(message); // Simple error display - can be improved with better UI
        this.hideLoading();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    const app = new PhotoAlbumApp();
    await app.initialize();
});