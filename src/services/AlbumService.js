/**
 * Album Service - Handles all album-related operations
 */

export class AlbumService {
    constructor(database) {
        this.db = database;
    }

    /**
     * Get all albums with their photo counts
     */
    async getAllAlbums() {
        try {
            const query = `
                SELECT 
                    a.id,
                    a.name,
                    a.created_date,
                    a.cover_photo_id,
                    a.sort_order,
                    COUNT(p.id) as photo_count,
                    MAX(p.date_added) as last_photo_added
                FROM albums a
                LEFT JOIN photos p ON a.id = p.album_id
                GROUP BY a.id
                ORDER BY a.sort_order ASC, a.created_date DESC
            `;
            
            return this.db.query(query);
        } catch (error) {
            console.error('Failed to get all albums:', error);
            throw new Error('Failed to retrieve albums');
        }
    }

    /**
     * Get a single album by ID
     */
    async getAlbumById(albumId) {
        try {
            const query = `
                SELECT 
                    a.id,
                    a.name,
                    a.created_date,
                    a.cover_photo_id,
                    a.sort_order,
                    COUNT(p.id) as photo_count
                FROM albums a
                LEFT JOIN photos p ON a.id = p.album_id
                WHERE a.id = ?
                GROUP BY a.id
            `;
            
            const results = this.db.query(query, [albumId]);
            return results.length > 0 ? results[0] : null;
        } catch (error) {
            console.error('Failed to get album by ID:', error);
            throw new Error('Failed to retrieve album');
        }
    }

    /**
     * Create a new album
     */
    async createAlbum(albumData) {
        try {
            const { name, sort_order = 0 } = albumData;
            
            if (!name || name.trim().length === 0) {
                throw new Error('Album name is required');
            }

            if (name.length > 100) {
                throw new Error('Album name must be less than 100 characters');
            }

            const query = 'INSERT INTO albums (name, sort_order) VALUES (?, ?)';
            const albumId = this.db.run(query, [name.trim(), sort_order]);
            
            // Save database state
            this.db.save();
            
            return this.getAlbumById(albumId);
        } catch (error) {
            console.error('Failed to create album:', error);
            throw error;
        }
    }

    /**
     * Update an existing album
     */
    async updateAlbum(albumId, albumData) {
        try {
            const { name } = albumData;
            
            if (!name || name.trim().length === 0) {
                throw new Error('Album name is required');
            }

            if (name.length > 100) {
                throw new Error('Album name must be less than 100 characters');
            }

            const query = 'UPDATE albums SET name = ? WHERE id = ?';
            this.db.run(query, [name.trim(), albumId]);
            
            // Save database state
            this.db.save();
            
            return this.getAlbumById(albumId);
        } catch (error) {
            console.error('Failed to update album:', error);
            throw error;
        }
    }

    /**
     * Delete an album and all its photos
     */
    async deleteAlbum(albumId) {
        try {
            // This will cascade delete all photos due to foreign key constraint
            const query = 'DELETE FROM albums WHERE id = ?';
            this.db.run(query, [albumId]);
            
            // Save database state
            this.db.save();
            
            return true;
        } catch (error) {
            console.error('Failed to delete album:', error);
            throw new Error('Failed to delete album');
        }
    }

    /**
     * Reorder albums based on new order
     */
    async reorderAlbums(albums) {
        try {
            const updateQuery = 'UPDATE albums SET sort_order = ? WHERE id = ?';
            
            albums.forEach((album, index) => {
                this.db.run(updateQuery, [index, album.id]);
            });
            
            // Save database state
            this.db.save();
            
            return true;
        } catch (error) {
            console.error('Failed to reorder albums:', error);
            throw new Error('Failed to reorder albums');
        }
    }

    /**
     * Set album cover photo
     */
    async setAlbumCover(albumId, photoId) {
        try {
            // Verify the photo belongs to this album
            const photoCheck = this.db.query(
                'SELECT id FROM photos WHERE id = ? AND album_id = ?',
                [photoId, albumId]
            );
            
            if (photoCheck.length === 0) {
                throw new Error('Photo does not belong to this album');
            }

            const query = 'UPDATE albums SET cover_photo_id = ? WHERE id = ?';
            this.db.run(query, [photoId, albumId]);
            
            // Save database state
            this.db.save();
            
            return true;
        } catch (error) {
            console.error('Failed to set album cover:', error);
            throw error;
        }
    }

    /**
     * Search albums by name
     */
    async searchAlbums(query) {
        try {
            const searchQuery = `
                SELECT 
                    a.id,
                    a.name,
                    a.created_date,
                    a.cover_photo_id,
                    a.sort_order,
                    COUNT(p.id) as photo_count
                FROM albums a
                LEFT JOIN photos p ON a.id = p.album_id
                WHERE a.name LIKE ?
                GROUP BY a.id
                ORDER BY a.sort_order ASC, a.created_date DESC
            `;
            
            const searchTerm = `%${query}%`;
            return this.db.query(searchQuery, [searchTerm]);
        } catch (error) {
            console.error('Failed to search albums:', error);
            throw new Error('Failed to search albums');
        }
    }

    /**
     * Get album statistics
     */
    async getAlbumStats(albumId) {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_photos,
                    SUM(file_size) as total_size,
                    MIN(date_added) as oldest_photo,
                    MAX(date_added) as newest_photo
                FROM photos
                WHERE album_id = ?
            `;
            
            const results = this.db.query(query, [albumId]);
            return results.length > 0 ? results[0] : null;
        } catch (error) {
            console.error('Failed to get album stats:', error);
            throw new Error('Failed to retrieve album statistics');
        }
    }
}