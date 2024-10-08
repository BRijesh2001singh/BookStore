const router = require("express").Router();
const bookmodel = require("../models/bookmodel");
const usermodel = require("../models/user");
const favourite = require("../models/favourite");
const reviewmodel = require('../models/review');
const jwt = require("jsonwebtoken");
const redis = require("../redis/redisClient.js");
const blogsmodel = require("../models/blogs.js");
//cookie settings
const expirationDate = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);
const cookieOptions = {
  sameSite: "None",
  secure: true,
  expires: expirationDate,
};

//health
router.get("/health", async (req, res) => {
  res.send(200);
})
//add boook REquest
router.post("/add", async (req, res) => {
  try {
    const data = req.body;
    const newBook = new bookmodel(data);
    await redis.del('books');
    await newBook.save().then(() => {
      res.status(200).json({ message: "Book Added successfully" });
    });
  }
  catch (error) {
    console.log(error);
  }
})
//Get request
router.get("/get", async (req, res) => {
  const cachedValue = await redis.get('books');
  if (cachedValue) {

    return res.status(200).json({ books: JSON.parse(cachedValue) });
  }
  else {
    try {
      books = await bookmodel.find();
      await redis.set('books', JSON.stringify(books), 'EX', 300)
      res.status(200).json({ books });
    }
    catch (error) {
      console.log(error);
    }
  }
});
//Get request for user profile
router.post("/:id/getaddedbooks", async (req, res) => {
  const userId = req.params.id;
  try {
    books = await bookmodel.find({ addedBy: userId });
    res.status(200).json({ books });

  }
  catch (error) {
    console.log(error);
  }
});
//get req using ID
router.get("/get/:id", async (req, res) => {
  let book;
  const id = req.params.id;
  try {
    book = await bookmodel.findById(id);
    res.status(200).json({ book })
  }
  catch (error) {
    console.log(error);
  }
});
//update books using ID
router.put("/update/:id", async (req, res) => {
  const id = req.params.id;
  const { bookname, description, author, image, readonline, price } = req.body;
  let updatedbook;
  try {
    updatedbook = await bookmodel.findByIdAndUpdate(id, { bookname, description, author, image, readonline, price });
    await updatedbook.save().then(() => res.json({ message: "BOOK ADDED" }));
  }
  catch (error) {
    console.log(error);
  }
});
//delete book by ID
router.delete("/deleteBook/:id", async (req, res) => {
  const id = req.params.id;
  try {
    await bookmodel.findByIdAndDelete(id).then(() => res.status(201).json({ message: "Book Deleted" }));
  }
  catch (error) {
    console.log(error);
  }
})
//Register USERS
router.post("/register", async (req, res) => {
  const userdata = req.body;
  const { name, email } = req.body;
  if (await usermodel.findOne({ email })) {
    return res.status(409).json({ message: "User Already Exists" });
  }
  const newuser = new usermodel(userdata);
  await newuser.save().then(() => {

    return res.status(200).json({ message: "User has been added" });
  }).catch((err) => {
    console.log(err);
  })
});
//signin USERS
router.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await usermodel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User Not Found" });
    }
    const passwordmatch = await user.comparePassword(password, user.password);
    if (passwordmatch) {
      const jwttoken = jwt.sign({ email: email }, process.env.PRIVATE_KEY);
      res.cookie("useruid", jwttoken, cookieOptions);
      res.status(200).json({ message: "User signed in" });
    }
    else {
      return res.status(401).json({ message: "Wrong password" });
    }
  } catch (err) {
    return res.status(500).json({ message: "ERROR FROM SERVER" });
  }
})
// //getallusers
// router.get("/getallusers", async (req, res) => {
//   const allusers = await usermodel.find();
//   res.json({ allusers });
// })
//get user
router.post("/getuser", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await usermodel.findOne({ email });
    if (!user) return res.json({ message: "USER NOT FOUND" });

    return res.json({ name: user.name, id: user._id, favbook: user.favbook });
  } catch (err) {
    console.log(err);
  }
})
//add fav books
router.patch("/:userId/addfavbook", async (req, res) => {
  try {
    const userId = req.params.userId;
    const newfavbookId = req.body.newfavbookId;
    //when new user adds fav book
    let userexists = await favourite.findOne({ userId });
    if (!userexists) {
      let newuserfav = new favourite({ userId, favbookId: [] });
      await newuserfav.save();
    }
    //this is when user is already present
    await redis.del(`favbook-${userId}`);
    const updatedFavbooks = await favourite.findOneAndUpdate({ userId }, { $push: { favbookId: newfavbookId } }, { new: true });
    res.status(200).json({ favbookId: updatedFavbooks.favbookId });

  } catch (err) {
    console.log(err);
  }
})
//delete fav books
router.delete("/:userId/deletefavbook", async (req, res) => {
  const userId = req.params.userId;
  const favbookId = req.body.favbookId;
  try {
    await favourite.findOneAndUpdate({ userId }, { $pull: { favbookId: favbookId } }, { new: true });
    await redis.del(`favbook-${userId}`);
    res.status(200).json({ message: "Book Removed" });
  } catch (err) {
    console.log(err);
  }
})
//get favbooks 
router.get("/:userId/getfavbook", async (req, res) => {
  userId = req.params.userId;
  try {
    const cachedValue = await redis.get(`favbook-${userId}`);
    if (cachedValue) {
      return res.status(200).json({ favbooklist: JSON.parse(cachedValue) });
    }
    const favbook = await favourite.findOne({ userId }).populate({ path: "favbookId", select: "bookname author readonline" });
    if (!favbook) return res.json({ message: "No favourite books" });
    const favbooklist = favbook.favbookId || [];
    await redis.set(`favbook-${userId}`, JSON.stringify(favbooklist), 'EX', 600);
    res.status(200).json({ favbooklist });
  }
  catch (err) {
    console.log(err);
  }
})
module.exports = router;

//add a review 
router.post("/:userId/addreview/:bookId", async (req, res) => {
  try {
    const { review } = req.body;
    const { userId, bookId } = req.params;
    const newreview = new reviewmodel({
      userId,
      bookId,
      review
    })
    await newreview.save();
    return res.status(201).send({ message: "Review added successfully", review: newreview });

  } catch (error) {
    res.status(500).send({ message: "An error occured" });
  }
})
//get book review
router.get('/reviews/:bookId', async (req, res) => {
  try {
    const { bookId } = req.params;
    const reviews = await reviewmodel.find({ bookId })
      .populate('userId', 'name');
    if (!reviews.length) {
      return res.status(404).json({ message: 'No reviews found for this book' });
    }
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
//post blogs
router.post("/postblogs", async (req, res) => {
  try {
    const { userId, title, blog, tag } = req.body;
    const newBlog = new blogsmodel({
      userId,
      title,
      blog,
      tag
    })
    await newBlog.save();
    await redis.del('blogs');
    return res.status(201).json({ message: "blog added" });
  } catch (error) {
    res.status(500).send({ message: "An error occured" });
  }
})
router.get("/readblogs", async (req, res) => {
  try {
    const cachedValue = await redis.get('blogs');
    if (cachedValue) {
      return res.status(200).json({ blogs: JSON.parse(cachedValue) });
    }
    else {
      const allblogs = await blogsmodel.find().populate('userId', 'name');
      if (!allblogs.length) {
        return res.status(404).json({ message: 'No blogs found' });
      }
      await redis.set('blogs', JSON.stringify(allblogs), 'EX', 300);
      return res.json({ blogs: allblogs });
    }
  } catch (error) {
    console.log(error);
  }

})