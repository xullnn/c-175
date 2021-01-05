const express = require('express');
const app = express();
const morgan = require('morgan');

const COUNTRY_DATA = [
  {
    path: "/english",
    flag: "flag-of-United-States-of-America.png",
    alt: "US Flag",
    title: "Go to US English site",
  },

  {
    path: "/french",
    flag: "flag-of-France.png",
    alt: "Drapeau de la france",
    title: "Aller sur le site français",
  },

  {
    path: "/serbian",
    flag: "flag-of-Serbia.png",
    alt: "Застава Србије",
    title: "Идите на српски сајт",
  },
];

app.set("views", "./views");
app.set("view engine", "pug");

app.use(express.static("public")); // middleware, position of code is important
app.use(morgan('common'));

const showEnglishView = (req, res) => {
  res.render("hello-world-english", {
    currentPath: req.path,
    language: "en-US",
  });
};

app.locals.currentPathClass = (path, currentPath) => {
  return path === currentPath ? "current" : '';
};

app.locals.countries = COUNTRY_DATA;

const LANGUAGE_CODES = {
  english: "en-US",
  french: "fr-FR",
  serbian: "sr-Cryl-rs",
};

app.get("/:language", (req, res, next) => {
  const language = req.params.language,
        language_code = LANGUAGE_CODES[req.params.language]
  if (!language_code) {
    next(new Error(`Language not supported: ${language}`));
  } else {
    res.render(`hello-world-${language}`, {
      currentPath: req.path,
      language: language_code,
    })
  }

});

app.listen(3000, 'localhost', () => {
  console.log("Listening to port 3000...");
});

app.use((err, req, res, _next) => {
  console.log(err);
  res.status(404).send(err.message);
});















