const express = require("express");
const router = express.Router();
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");
const passport = require("passport");

//Load user model
const User = require("../../models/User");

// @route   GET api/users/test
// @desc    Tests users route
// @access  public
router.get("/test", (req, res) => {
  res.json({ msg: "Users works!!!" });
});

// @route   POST api/users/register
// @desc    Register a user
// @access  public
router.post("/register", (req, res) => {
  //Check if email already exists in the database
  User.findOne({ email: req.body.email }).then((user) => {
    if (user) {
      return res.status(400).json({ email: "Email already exists" });
    }
    //Register the new user if the user didn't exist
    else {
      avatar = gravatar.url(req.body.email, {
        s: "200", //Size
        r: "pg", //Rating
        d: "mm", //Default
      });
      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        avatar,
        password: req.body.password,
      });

      //Encrypt the password before saving it to the database
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then((user) => res.json(user))
            .catch((err) => console.log(err));
        });
      });
    }
  });
});

// @route   POST api/users/login
// @desc    Login user / Return the JWT
// @access  public
router.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  //Find the user by email
  User.findOne({ email }).then((user) => {
    if (!user) {
      return res.status(404).json({ email: "User not found" });
    }

    //Check password
    bcrypt.compare(password, user.password).then((isMatch) => {
      if (isMatch) {
        //User Matched

        const payload = { id: user.id, name: user.name, avatar: user.avatar }; //Create JWT Payload

        //Sign the token
        jwt.sign(
          payload,
          keys.secretOrKey,
          { expiresIn: 3600 },
          (err, token) => {
            res.json({
              success: true,
              token: "Bearer " + token,
            });
          }
        );
      } else {
        return res.status(400).json({ passowrd: "Incorrect password" });
      }
    });
  });
});

// @route   GET api/users/current(
// @desc    Return the current user
// @access  private
router.get(
  "/current",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.json({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      avatar: req.user.avatar,
    });
  }
);

module.exports = router;
