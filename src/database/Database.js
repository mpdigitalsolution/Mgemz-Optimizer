/**
 * Database management class for SQLite operations
 * Uses sql.js for browser compatibility
 */

export class Database {
    constructor() {
        this.SQL = null;
        this.db = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the database connection and create tables
     */
    async initialize() {
        try {
            // Dynamically import sql.js to avoid issues with bundlers
            const initSqlJs = await import('sql.js');
            const SQL = await initSqlJs.default({
                locateFile: file => `https://sql.js.org/dist/${file}`
            });
            
            this.SQL = SQL;
            
            // Create new database or load from localStorage
            const savedDb = localStorage.getItem('photoAlbumDb');
            if (savedDb) {
                const buffer = new Uint8Array(JSON.parse(savedDb));
                this.db = new SQL.Database(buffer);
            } else {
                this.db = new SQL.Database();
                await this.createTables();
            }
            
            this.isInitialized = true;
            console.log('Database initialized successfully');
        } catch (error) {
            console.error('Failed to initialize database:', error);
            throw new Error('Database initialization failed');
        }
    }

    /**
     * Create database tables from schema
     */
    async createTables() {
        const schema = `
            CREATE TABLE albums (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                cover_photo_id INTEGER,
                sort_order INTEGER DEFAULT 0,
                FOREIGN KEY (cover_photo_id) REFERENCES photos(id) ON DELETE SET NULL
            );

            CREATE TABLE photos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                album_id INTEGER NOT NULL,
                file_path TEXT NOT NULL,
                file_name TEXT NOT NULL,
                file_size INTEGER,
                date_taken DATETIME,
                date_added DATETIME DEFAULT CURRENT_TIMESTAMP,
                thumbnail_path TEXT,
                sort_order INTEGER DEFAULT 0,
                width INTEGER,
                height INTEGER,
                mime_type TEXT,
                FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
            );

            CREATE INDEX idx_albums_sort_order ON albums(sort_order);
            CREATE INDEX idx_photos_album_id ON photos(album_id);
            CREATE INDEX idx_photos_sort_order ON photos(sort_order);
            CREATE INDEX idx_photos_date_added ON photos(date_added);
        `;

        try {
            this.db.run(schema);
            console.log('Database tables created successfully');
        } catch (error) {
            console.error('Failed to create tables:', error);
            throw new Error('Table creation failed');
        }
    }

    /**
     * Execute a SQL query and return results
     */
    query(sql, params = []) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        try {
            const statement = this.db.prepare(sql);
            if (params.length > 0) {
                statement.bind(params);
            }
            
            const results = [];
            while (statement.step()) {
                results.push(statement.getAsObject());
            }
            statement.free();
            
            return results;
        } catch (error) {
            console.error('Query failed:', sql, params, error);
            throw new Error(`Query execution failed: ${error.message}`);
        }
    }

    /**
     * Execute a SQL statement (INSERT, UPDATE, DELETE)
     */
    run(sql, params = []) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        try {
            const statement = this.db.prepare(sql);
            if (params.length > 0) {
                statement.bind(params);
            }
            statement.step();
            statement.free();
            
            // Return the ID of the last inserted row
            if (sql.toLowerCase().startsWith('insert')) {
                return this.db.exec("SELECT last_insert_rowid() as id")[0].values[0][0];
            }
            return true;
        } catch (error) {
            console.error('Statement execution failed:', sql, params, error);
            throw new Error(`Statement execution failed: ${error.message}`);
        }
    }

    /**
     * Save database to localStorage
     */
    save() {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        try {
            const data = this.db.export();
            const json = JSON.stringify(Array.from(data));
            localStorage.setItem('photoAlbumDb', json);
            console.log('Database saved successfully');
        } catch (error) {
            console.error('Failed to save database:', error);
            throw new Error('Database save failed');
        }
    }

    /**
     * Close the database connection
     */
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
            this.isInitialized = false;
        }
    }

    /**
     * Get database statistics
     */
    getStats() {
        const stats = {};
        
        try {
            const albumCount = this.query("SELECT COUNT(*) as count FROM albums")[0].count;
            const photoCount = this.query("SELECT COUNT(*) as count FROM photos")[0].count;
            
            stats.albums = albumCount;
            stats.photos = photoCount;
            stats.totalSize = localStorage.getItem('photoAlbumDb')?.length || 0;
            
            return stats;
        } catch (error) {
            console.error('Failed to get stats:', error);
            return { albums: 0, photos: 0, totalSize: 0 };
        }
    }
}

// Singleton instance
let databaseInstance = null;

export const getDatabase = async () => {
    if (!databaseInstance) {
        databaseInstance = new Database();
        await databaseInstance.initialize();
    }
    return databaseInstance;
};