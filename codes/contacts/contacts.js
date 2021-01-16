const express = require("express");
const morgan = require("morgan");
const {body, validationResult} = require("express-validator");
const session = require('express-session');
const store = require("connect-loki");

const app = express();
const LokiStore = store(session); // database

const flash = require('express-flash');

const contactData = [
  {
    firstName: "Mike",
    lastName: "Jones",
    phoneNumber: "281-330-8004",
  },
  {
    firstName: "Jenny",
    lastName: "Keys",
    phoneNumber: "768-867-5309",
  },
  {
    firstName: "Max",
    lastName: "Entiger",
    phoneNumber: "214-748-3647",
  },
  {
    firstName: "Alicia",
    lastName: "Keys",
    phoneNumber: "515-489-4608",
  },
];

const sortContacts = contacts => {
  return contacts.slice().sort((contactA, contactB) => {
    if (contactA.lastName < contactB.lastName) {
      return -1;
    } else if (contactA.lastName > contactB.lastName) {
      return 1;
    } else if (contactA.firstName < contactB.firstName) {
      return -1;
    } else if (contactA.firstName > contactB.firstName) {
      return 1;
    } else {
      return 0;
    }
  })
};

const validateName = (name, whichName) => {
  return body(name)
          .trim()
          .isLength({min: 1})
          .withMessage(`${whichName} name is required.`)
          .bail()
          .isLength({max: 25})
          .withMessage(`${whichName} name is too long. Maximum length is 25 characters.`)
          .isAlpha()
          .withMessage(`${whichName} name contains invalid characters. The name must be alphabetic.`)
}

// basic config
app.set("views", "./views");
app.set("view engine", "pug");

function clone(object) {
  return JSON.parse(JSON.stringify(object));
};

// middlewares
app.use(express.static("public"));
app.use(express.urlencoded({extended: false}));
app.use(morgan("common"));
app.use(session({
    cookie: {
      httpOnly: true,
      maxAge: 31 * 24 * 60 * 60 * 1000,
      path: "/",
      secure: false,
    },

    name: "LauchSchool-contacts-manager-session-id",
    resave: false,
    saveUninitialized: true,
    secret: "this is not very secure",
    store: new LokiStore({}), // server side databse storage
}));
app.use(flash());


app.use((req, res, next) => {
  if (!("contactData" in req.session)) {
    req.session.contactData = clone(contactData);
  } else {
    console.log(`This is session identifer: ${req.session.id}`);
    console.log("This is session cookie sent back to the client\n", req.session.cookie);
    console.log("This is the session data 'contactData' gets stored on the server side\n", req.session.contactData)
  }
  next();
});

app.use((req, res, next) => {
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
})

// routes
app.get("/", (req, res) => {
  res.redirect("/contacts");
});

app.get("/contacts", (req, res) => {
  res.render("contacts", {
    contacts: sortContacts(req.session.contactData),
  });
});

app.get("/contacts/new", (req, res) => {
  res.render("form_new_contact", app.locals.userInputs)
});

app.post("/contacts",

  [
    validateName("firstName", "First"),
    validateName("lastName", "Last"),

    body("phoneNumber")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Phone number is required.")
      .bail()
      .matches(/^\d\d\d-\d\d\d-\d\d\d\d$/)
      .withMessage("Invalid phone number format. Use ###-###-####."),
    ],

    (req, res, next) => {
      let errors = validationResult(req);
      if (!errors.isEmpty()) {
        // errorMessages: errors.array().map(error => error.msg),
        errors.array().forEach(error => req.flash("error", error.msg));
        res.render("form_new_contact", {
          flash: req.flash(),
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          phoneNumber: req.body.phoneNumber,
        });
      } else {
        next();
      }
    },

    (req, res) => {
      req.session.contactData.push({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phoneNumber: req.body.phoneNumber,
      });

      req.flash("success", "New contact added to list!")
      res.redirect("/contacts");
    },
);

app.listen(3000, "localhost", () => {
  console.log("Listening on port 3000......")
});








































