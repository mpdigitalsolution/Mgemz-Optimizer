/**
 * Photo Service - Handles all photo-related operations
 */

export class PhotoService {
    constructor(database) {
        this.db = database;
    }

    /**
     * Get all photos for a specific album
     */
    async getPhotosByAlbum(albumId) {
        try {
            const query = `
                SELECT 
                    p.id,
                    p.album_id,
                    p.file_path,
                    p.file_name,
                    p.file_size,
                    p.date_taken,
                    p.date_added,
                    p.thumbnail_path,
                    p.sort_order,
                    p.width,
                    p.height,
                    p.mime_type
                FROM photos p
                WHERE p.album_id = ?
                ORDER BY p.sort_order ASC, p.date_added DESC
            `;
            
            return this.db.query(query, [albumId]);
        } catch (error) {
            console.error('Failed to get photos by album:', error);
            throw new Error('Failed to retrieve photos');
        }
    }

    /**
     * Get a single photo by ID
     */
    async getPhotoById(photoId) {
        try {
            const query = `
                SELECT 
                    p.id,
                    p.album_id,
                    p.file_path,
                    p.file_name,
                    p.file_size,
                    p.date_taken,
                    p.date_added,
                    p.thumbnail_path,
                    p.width,
                    p.height,
                    p.mime_type,
                    a.name as album_name
                FROM photos p
                JOIN albums a ON p.album_id = a.id
                WHERE p.id = ?
            `;
            
            const results = this.db.query(query, [photoId]);
            return results.length > 0 ? results[0] : null;
        } catch (error) {
            console.error('Failed to get photo by ID:', error);
            throw new Error('Failed to retrieve photo');
        }
    }

    /**
     * Add a photo to an album
     */
    async addPhoto(albumId, file) {
        try {
            // Validate file
            if (!file || !file.type.startsWith('image/')) {
                throw new Error('Invalid image file');
            }

            // Get file metadata
            const fileName = file.name;
            const fileSize = file.size;
            const mimeType = file.type;

            // Create thumbnail (simplified - in real implementation, use canvas)
            const thumbnailPath = URL.createObjectURL(file); // Temporary approach

            // Get next sort order
            const maxSortQuery = 'SELECT COALESCE(MAX(sort_order), -1) as max_sort FROM photos WHERE album_id = ?';
            const maxSortResult = this.db.query(maxSortQuery, [albumId]);
            const nextSortOrder = maxSortResult[0].max_sort + 1;

            const query = `
                INSERT INTO photos (
                    album_id, file_path, file_name, file_size, 
                    date_added, thumbnail_path, sort_order, mime_type
                ) VALUES (?, ?, ?, ?, datetime('now'), ?, ?, ?)
            `;

            const photoId = this.db.run(query, [
                albumId,
                thumbnailPath, // Using thumbnail as file_path for now
                fileName,
                fileSize,
                thumbnailPath,
                nextSortOrder,
                mimeType
            ]);

            // Save database state
            this.db.save();

            return this.getPhotoById(photoId);
        } catch (error) {
            console.error('Failed to add photo:', error);
            throw error;
        }
    }

    /**
     * Remove a photo from an album
     */
    async removePhoto(photoId) {
        try {
            const query = 'DELETE FROM photos WHERE id = ?';
            this.db.run(query, [photoId]);
            
            // Save database state
            this.db.save();
            
            return true;
        } catch (error) {
            console.error('Failed to remove photo:', error);
            throw new Error('Failed to remove photo');
        }
    }

    /**
     * Reorder photos within an album
     */
    async reorderPhotos(albumId, photos) {
        try {
            const updateQuery = 'UPDATE photos SET sort_order = ? WHERE id = ? AND album_id = ?';
            
            photos.forEach((photo, index) => {
                this.db.run(updateQuery, [index, photo.id, albumId]);
            });
            
            // Save database state
            this.db.save();
            
            return true;
        } catch (error) {
            console.error('Failed to reorder photos:', error);
            throw new Error('Failed to reorder photos');
        }
    }

    /**
     * Update photo metadata
     */
    async updatePhoto(photoId, photoData) {
        try {
            const { file_name, date_taken, width, height } = photoData;
            
            const query = `
                UPDATE photos 
                SET file_name = ?, date_taken = ?, width = ?, height = ?
                WHERE id = ?
            `;
            
            this.db.run(query, [file_name, date_taken, width, height, photoId]);
            
            // Save database state
            this.db.save();
            
            return this.getPhotoById(photoId);
        } catch (error) {
            console.error('Failed to update photo:', error);
            throw new Error('Failed to update photo');
        }
    }

    /**
     * Generate thumbnail for a photo (simplified implementation)
     */
    async generateThumbnail(photoId, maxWidth = 200, maxHeight = 200) {
        try {
            const photo = await this.getPhotoById(photoId);
            if (!photo) {
                throw new Error('Photo not found');
            }

            // In a real implementation, you would use Canvas API to resize the image
            // For now, we'll just return the original file path as thumbnail
            const thumbnailPath = photo.file_path;

            // Update photo with thumbnail path
            const updateQuery = 'UPDATE photos SET thumbnail_path = ? WHERE id = ?';
            this.db.run(updateQuery, [thumbnailPath, photoId]);
            
            // Save database state
            this.db.save();
            
            return thumbnailPath;
        } catch (error) {
            console.error('Failed to generate thumbnail:', error);
            throw new Error('Failed to generate thumbnail');
        }
    }

    /**
     * Get recent photos across all albums
     */
    async getRecentPhotos(limit = 20) {
        try {
            const query = `
                SELECT 
                    p.id,
                    p.album_id,
                    p.file_path,
                    p.file_name,
                    p.file_size,
                    p.date_added,
                    p.thumbnail_path,
                    a.name as album_name
                FROM photos p
                JOIN albums a ON p.album_id = a.id
                ORDER BY p.date_added DESC
                LIMIT ?
            `;
            
            return this.db.query(query, [limit]);
        } catch (error) {
            console.error('Failed to get recent photos:', error);
            throw new Error('Failed to retrieve recent photos');
        }
    }

    /**
     * Get photo statistics for an album
     */
    async getPhotoStats(albumId) {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_photos,
                    SUM(file_size) as total_size,
                    MIN(date_added) as oldest_photo,
                    MAX(date_added) as newest_photo,
                    GROUP_CONCAT(DISTINCT mime_type) as mime_types
                FROM photos
                WHERE album_id = ?
            `;
            
            const results = this.db.query(query, [albumId]);
            return results.length > 0 ? results[0] : null;
        } catch (error) {
            console.error('Failed to get photo stats:', error);
            throw new Error('Failed to retrieve photo statistics');
        }
    }
}