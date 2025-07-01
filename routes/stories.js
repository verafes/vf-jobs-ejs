const express = require("express");
const router = express.Router();

const {
    getAllStories,
    createStory,
    updateStory,
    newStory,
    editStory,
    deleteStory,
} = require("../controllers/stories");

router.get ("/", getAllStories);
router.post ("/", createStory);
router.get ("/new", newStory);
router.get ("/edit/:id", editStory);
router.post ("/update/:id", updateStory);
router.post ("/delete/:id", deleteStory);

module.exports = router;
