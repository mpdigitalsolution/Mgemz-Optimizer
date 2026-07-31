-- Database Schema for Photo Album Organizer

-- Albums table stores album information
CREATE TABLE albums (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    cover_photo_id INTEGER,
    sort_order INTEGER DEFAULT 0,
    FOREIGN KEY (cover_photo_id) REFERENCES photos(id) ON DELETE SET NULL
);

-- Photos table stores photo information
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

-- Create indexes for better performance
CREATE INDEX idx_albums_sort_order ON albums(sort_order);
CREATE INDEX idx_photos_album_id ON photos(album_id);
CREATE INDEX idx_photos_sort_order ON photos(sort_order);
CREATE INDEX idx_photos_date_added ON photos(date_added);

-- Insert sample data for testing
INSERT INTO albums (name, sort_order) VALUES 
    ('Vacation 2024', 0),
    ('Family Photos', 1),
    ('Nature', 2);

-- Views for common queries
CREATE VIEW album_stats AS
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
GROUP BY a.id;

CREATE VIEW recent_photos AS
SELECT 
    p.id,
    p.file_name,
    p.file_path,
    p.thumbnail_path,
    p.date_added,
    a.name as album_name
FROM photos p
JOIN albums a ON p.album_id = a.id
ORDER BY p.date_added DESC
LIMIT 20;