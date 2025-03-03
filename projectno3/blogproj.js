import express from 'express';
import db from './dbs.js'; // Ensure this is the correct path to your database module
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';

const app = express();
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 2885;
const SECRET_KEY = 'your_secret_key';

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Middleware for authentication
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).send('Access Denied');
  
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).send('Invalid Token');
    req.user = user;
    next();
  });
};

app.listen(PORT, () => {
  console.log(`Server Running on port ${PORT}`);
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const query = `INSERT INTO users (username, password) VALUES (?, ?)`;
  db.query(query, [username, hashedPassword], (err, results) => {
    if (err) return res.status(500).send('Error registering user');
    res.status(201).send('User registered');
  });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const query = `SELECT * FROM users WHERE username = ?`;
  db.query(query, [username], async (err, results) => {
    if (err || results.length === 0) return res.status(400).send('Invalid credentials');
    const user = results[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).send('Invalid credentials');
    const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY);
    res.status(200).json({ token });
  });
});

// Add a new post with categories and tags
app.post('/posts', upload.single('image'), (req, res) => {
  const { title, content, author, categories, tags } = req.body;
  if (title && content && author) {
    const image = `/uploads/${req.file.filename}`;
    const query = `INSERT INTO posts (title, content, author, image) VALUES (?, ?, ?, ?)`;
    db.query(query, [title, content, author, image], (err, results) => {
      if (err) return res.status(500).send('Error creating blog post');
      const postId = results.insertId;

      // Insert categories
      if (categories && categories.length > 0) {
        const categoryQueries = categories.map(categoryId => {
          return new Promise((resolve, reject) => {
            const query = `INSERT INTO post_categories (post_id, category_id) VALUES (?, ?)`;
            db.query(query, [postId, categoryId], (err, results) => {
              if (err) reject(err);
              resolve(results);
            });
          });
        });
        Promise.all(categoryQueries).catch(err => console.error('Error adding categories:', err));
      }

      // Insert tags
      if (tags && tags.length > 0) {
        const tagQueries = tags.map(tagId => {
          return new Promise((resolve, reject) => {
            const query = `INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)`;
            db.query(query, [postId, tagId], (err, results) => {
              if (err) reject(err);
              resolve(results);
            });
          });
        });
        Promise.all(tagQueries).catch(err => console.error('Error adding tags:', err));
      }

      res.status(201).send({ msg: 'Blog Created', postId });
    });
  } else {
    res.status(400).send('Missing title, content, or author');
  }
});

// Get a post with categories and tags
app.get('/posts/:id', (req, res) => {
  const id = req.params.id;
  const parsedID = parseInt(id);
  if (isNaN(parsedID)) return res.status(400).send('Invalid ID');
  
  const query = `SELECT * FROM posts WHERE id = ?`;
  db.query(query, [parsedID], (err, results) => {
    if (err) return res.status(500).send('Error fetching post');
    if (results.length === 0) return res.status(404).send('Post not found');
    const post = results[0];

    // Fetch categories
    const categoryQuery = `SELECT categories.id, categories.name FROM categories
                           JOIN post_categories ON categories.id = post_categories.category_id
                           WHERE post_categories.post_id = ?`;
    db.query(categoryQuery, [parsedID], (err, categoryResults) => {
      if (err) return res.status(500).send('Error fetching categories');
      post.categories = categoryResults;

      // Fetch tags
      const tagQuery = `SELECT tags.id, tags.name FROM tags
                        JOIN post_tags ON tags.id = post_tags.tag_id
                        WHERE post_tags.post_id = ?`;
      db.query(tagQuery, [parsedID], (err, tagResults) => {
        if (err) return res.status(500).send('Error fetching tags');
        post.tags = tagResults;
        res.status(200).json(post);
      });
    });
  });
});

// Like a post
app.post('/posts/:id/like', (req, res) => {
  const { id } = req.params;
  const query = `UPDATE posts SET likes = likes + 1 WHERE id = ?`;
  db.query(query, [id], (err, results) => {
    if (err) return res.status(500).send('Error liking post');
    if (results.affectedRows === 0) return res.status(404).send('Post not found');
    res.status(200).send('Post liked');
  });
});

app.get('/posts', (req, res) => {
  db.query('SELECT * FROM posts', (err, results) => {
    if (err) return res.status(500).json({ error: 'Database query failed', details: err });
    res.status(200).json(results);
  });
});

app.patch('/posts/:id', (req, res) => {
  const { body, params: { id } } = req;
  const parsedID = parseInt(id);
  if (isNaN(parsedID)) return res.status(400).send('Invalid ID');
  const query = `UPDATE posts SET ? WHERE id = ?`;
  db.query(query, [body, parsedID], (err, results) => {
    if (err) return res.status(500).send('Error updating blog post');
    if (results.affectedRows === 0) return res.status(404).send('Post not found');
    res.status(200).send('Patch Updated Successfully');
  });
});

app.delete('/posts/:id', (req, res) => {
  const { id } = req.params;
  const parsedId = parseInt(id);
  if (isNaN(parsedId)) return res.status(400).send('Invalid ID');
  const query = `DELETE FROM posts WHERE id = ?`;
  db.query(query, [parsedId], (err, results) => {
    if (err) return res.status(500).send('Error deleting blog post');
    if (results.affectedRows === 0) return res.status(404).send('Post not found');
    res.status(200).send('Deleted Successfully!');
  });
});

// Add a new comment to a post
app.post('/posts/:id/comments', (req, res) => {
  const { id } = req.params;
  const { author, content } = req.body;
  const query = `INSERT INTO comments (post_id, author, content) VALUES (?, ?, ?)`;
  db.query(query, [id, author, content], (err, results) => {
    if (err) return res.status(500).send('Error adding comment');
    res.status(201).send({ msg: 'Comment added', commentId: results.insertId });
  });
});

// Get comments for a post
app.get('/posts/:id/comments', (req, res) => {
  const { id } = req.params;
  const query = `SELECT * FROM comments WHERE post_id = ? ORDER BY created_at DESC`;
  db.query(query, [id], (err, results) => {
    if (err) return res.status(500).send('Error fetching comments');
    res.status(200).json(results);
  });
});

app.listen(PORT, () => {
  console.log(`Server Running on port ${PORT}`);
});



