Blog Project
This is a simple blog project built with Express.js. It includes user authentication, blog post creation, and comment functionality.

.qodo/
blogproj.js
dbs.js
netstat
public/
    html/
        .qodo/
        about.html
        admin.html
        blog.html
        contact.html
        css/
            animate.min.css
            bootstrap-grid.css
            bootstrap-grid.css.map
            bootstrap-grid.min.css
            bootstrap-grid.min.css.map
            bootstrap-reboot.css
            bootstrap-reboot.css.map
            ...
        features.html
        fonts/
        images/
        index.html
        js/
        post.html
    uploads/
        1740907064226.jpg
        1740910604774.jpg
        1740911082657.jpg
        1740911173844.jpg
        1740914694390.jpg
        I watching you!.jpg



1. Installation
Clone the repository:
  git clone <repository-url>

2. Navigate to the project directory:
  cd projectno3

3. Install the dependencies:
     npm install


Configuration
Create a .env file in the root directory and add the following environment variables:  
    PORT=2885
SECRET_KEY=your_secret_key

Usage
Start the server:
  npm start
The server will be running on http://localhost:2885

API Endpoints
User Authentication
Register a new user

POST /register


{
  "username": "example",
  "password": "password"
}


POST /login


{
  "username": "example",
  "password": "password"
}




Blog Posts
Create a new post

  POST /posts



  {
  "title": "Post Title",
  "content": "Post content",
  "author": "Author Name",
  "categories": [1, 2],
  "tags": [1, 2]
}


Get a post by ID

  GET /posts/:id
Like a post

  POST /posts/:id/like
Get all posts

  GET /posts

{
  "title": "Updated Title",
  "content": "Updated content"
}


Delete a post:

DELETE /posts/:id

Add a comment to a post:
  POST /posts/:id/comments


Get comments for a post:
  GET /posts/:id/comments


  
        
