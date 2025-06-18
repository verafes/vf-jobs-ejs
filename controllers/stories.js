const Story = require("../models/Story");

const getAllStories = async (req, res) => {
  const stories = await Story.find({ createdBy: req.user.userId }).sort(
    "createdAt"
  );
  res.render("stories", { stories, csrfToken: req.csrfToken()});
};

const newStory = async (req, res) => {
  res.render("story", { story: null });
}

const createStory = async (req, res) => {
  req.body.createdBy = req.user._id.toString();
  const { title, description } = req.body;
  
  if (title === '' || description === '' ) {
    req.flash('error', 'All required fields cannot be empty.');
    res.redirect('/stories/new');
  }
  
  const story = await Story.create({ ...req.body });
  console.log(story);
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
  res.render("story", {story});
}

const updateStory = async (req, res) => {
  const userId = req.user._id.toString();
  const storyId = req.params.id;
  const { title, description, tags, isFavorite, imageUrl, storyDate } = req.body;
  
  if (!title || !description ) {
    req.flash('error', 'All required fields cannot be empty.');
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
  
  const story = await Story.findOneAndRemove({
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