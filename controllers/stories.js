const Story = require("../models/Story");
const csrf = require("host-csrf");

const getAllStories = async (req, res) => {
  const userId = req.user._id.toString();
  const stories = await Story.find({ createdBy: userId }).sort("createdAt");
  console.log("Fetched stories:", stories);
  console.log("Request keys:", Object.keys(req));
  res.render("stories", { stories });
};

const newStory = async (req, res) => {
  res.render("story", { story: null });
}

const createStory = async (req, res) => {
  req.body.createdBy = req.user._id.toString();
  const { title, description, tags, isFavorite, imageUrl, storyDate  } = req.body;
  
  if (title === '' || description === '' ) {
    req.flash('error', 'All required fields cannot be empty.');
    return res.redirect('/stories/new');
  }
  
  if (tags && typeof tags === 'string') {
    req.body.tags = tags.split(',').map(tag => tag.trim());
  } else {
    req.body.tags = [];
  }
  req.body.isFavorite = req.body.isFavorite === 'on' ? true : false;
  
  const story = await Story.create({ ...req.body });
  console.log(story);

  res.redirect('/stories');
};

const editStory = async (req, res) => {
  const storyId = req.params.id;
  const userId = req.user._id.toString();
  console.log(storyId, userId);
  
  const story = await Story.findOne({
    _id: storyId,
    createdBy: userId,
  });
  if (!story) {
    req.flash("error", `No story with id: ${storyId}`);
    res.redirect("/stories");
  }
  res.render("story", { story });
}

const updateStory = async (req, res) => {
  const userId = req.user._id.toString();
  const storyId = req.params.id;
  const { title, description, tags, isFavorite, imageUrl, storyDate } = req.body;
  req.body.isFavorite = req.body.isFavorite === 'on' ? true : false;
  
  if (!title || !description ) {
    req.flash('error', 'All required fields cannot be empty.');
    return res.redirect(`/stories/edit/${storyId}`);
  }
  
  req.body.description = req.body.description.trim();
  
  const story = await Story.findOneAndUpdate(
    { _id: storyId, createdBy: userId },
    req.body,
    { new: true, runValidators: true }
  );
  
  if (!story) {
    req.flash("error", `No story with id: ${storyId}`);
    res.redirect("/stories");
  }
  res.redirect("/stories");
};

const deleteStory = async (req, res) => {
  const userId = req.user._id.toString();
  const storyId = req.params.id;
  
  const story = await Story.findOneAndDelete({
    _id: storyId,
    createdBy: userId,
  });
  if (!story) {
    req.flash("error", `No story with id: ${storyId}`);
  }
  res.redirect("/stories");
};

module.exports = {
  getAllStories,
  newStory,
  createStory,
  editStory,
  updateStory,
  deleteStory,
};