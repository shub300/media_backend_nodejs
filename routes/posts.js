const express = require('express');
const PostsController = require('../controllers/PostController');

var router = express.Router();

router.get('/', PostsController.ListPosts);
router.get('/:id', PostsController.ListPostsId);
router.post('/add', PostsController.AddPost);
router.put('/update/:id', PostsController.UpdatePostById);
router.delete('/:id', PostsController.DeletePostById);

module.exports = router;
