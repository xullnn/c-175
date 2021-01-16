const express = require("express");
const morgan = require("morgan");
const TodoList = require('./lib/todolist');
const Todo = require("./lib/todo");
const flash = require("express-flash");
const session = require("express-session");
const {body, validationResult} = require("express-validator"); // `body` use to create validators, and `alidationResult` use to validate the results.
const {sortLists, sortTodos} = require("./lib/sort");
const store = require("connect-loki");


const app = express();
const host = "localhost";
const port = 3000;
const LokiStore = store(session); // returns a constructor

//let todoLists = require("./lib/seed-data");

function loadTodo(todoLists, listId, todoId) {
  let list = todoLists.find(list => list.id === listId);
  if (!list) return undefined;
  let todo = list.todos.find(todo => todo.id === todoId);
  return todo;
};

function ObjectifyListAndTodos(rawListsArray) {
//	List
//		- id
//		- title
//		- todos
//			- id
//			- title
	let list, todo;
	return rawListsArray.map(rawList => {
		list = new TodoList(rawList.title);
		list.id = rawList.id;
		list.todos = (rawList.todos || []).map(rawTodo => {
			todo = new Todo(rawTodo.title);
			todo.id = rawTodo.id;
			todo.done = rawTodo.done;
			return todo;
		});
		
		return list;
	})
};

app.set("views", "./views");
app.set("view engine", "pug");

app.use(morgan("common"));
app.use(express.static("public"));
app.use(express.urlencoded({extended: false}));
app.use(session({
	cookie: {
		httpOnly: true,
		maxAge: 31 * 24 * 60 * 60 * 1000,
		path: "/",
		secure: false,
	},
	
  name: "launch-school-todos-session-id",
  resave: false,
  saveUninitialized: true,
  secret: "this is not very secure",
	store: new LokiStore({}),
}));
app.use(flash());

app.use((req, res, next) => {
	if (!("todoLists" in req.session)) {
		req.session.todoLists = []
	} else {
		req.session.todoLists = ObjectifyListAndTodos(req.session.todoLists)
	}
	next();
})

// flash is stored in req.session.flash on the server side
app.use((req, res, next) => {
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
})

app.get("/", (req, res, next) => {
  res.redirect("/lists");
});

app.get("/lists/new", (req, res, next) => {
  res.render("new-list");
})

app.get("/lists", (req, res, next) => {
  res.render("lists", {
    todoLists: sortLists(req.session.todoLists),
  });
});

app.post("/lists", [
  body("todoListTitle")
    .trim()
    .isLength({min: 1})
    .withMessage("The list title is required.")
    .isLength({max: 100})
    .withMessage("List title must be between 1 and 100 characters.")
										.custom((title, {req}) => {
      let dupliate = req.session.todoLists.find(list => list.title === title);
      return dupliate === undefined;
    })
    .withMessage("List title must be unique."),

  ],
  (req, res, next) => {
    let errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().forEach(message => req.flash("error", message.msg));
      res.render("new-list", {
        todoListTitle: req.body.todoListTitle,
        flash: req.flash()
      })
    } else {
      req.flash("success", "The todo list has been created successfully.");
			req.session.todoLists.push(new TodoList(req.body.todoListTitle));
      res.redirect("/lists");
    }
  });

app.get("/lists/:todoListId", (req, res, next) => {
  let todoListId = req.params.todoListId;
  let list = req.session.todoLists.find(list => list.id === Number(todoListId));
  if (!list) {
    next(new Error("Not Found"));
  } else {
    res.render("list", {
      todoList: list,
      todos: sortTodos(list.toArray()),
    })
  }
});

app.post("/lists/:todoListId/todos/:todoId/toggle", (req, res, next) => {
  let toBeDone = req.body.done,
      listId = req.params.todoListId,
      todoId = req.params.todoId,
      todo = loadTodo(req.session.todoLists, Number(listId), Number(todoId));

  if (!todo) next(new Error("Can't find list"));

  if (toBeDone.trim() === "true") {
    todo.markDone();
    req.flash("success", `${todo.title} is marked as Done!`)
  } else {
    todo.markUndone();
    req.flash("success", `${todo.title} is marked as Not Done!`)
  };

  res.redirect(`/lists/${listId}`)
});

app.post("/lists/:todoListId/todos/:todoId/destroy", (req, res, next) => {
  let listId = req.params.todoListId,
      todoId = req.params.todoId,
      todo = loadTodo(req.session.todoLists, Number(listId), Number(todoId));

  if (!todo) next(new Error("Can't find list"));

  let list = req.session.todoLists.find(list => list.id === Number(listId)),
      index = list.findIndexOf(todo),
      todoTitle = todo.title;

  list.removeAt(index),
  req.flash("Error", `${todoTitle} has been deleted.`)
  res.redirect(`/lists/${listId}`);
});

app.post("/lists/:todoListId/complete_all", (req, res, next) => {
  let listId = req.params.todoListId,
      list = req.session.todoLists.find(list => list.id === Number(listId));

  if (!list) next(new Error("Can't find list"));

  let listTitle = list.title;
  list.markAllDone();
  req.flash("success", `${listTitle} has been marked ALL DONE!`)
  res.redirect(`/lists/${listId}`);
});


app.post("/lists/:todoListId/todos", [ body("todoTitle")
    .trim()
    .isLength({min: 1})
    .withMessage("The todo name is required.")
    .isLength({max: 100})
    .withMessage("Todo title must be between 1 and 100 characters.")

], (req, res, next) => {
  let errors = validationResult(req);
  let listId = Number(req.params.todoListId);
  let list = req.session.todoLists.find(list => list.id === listId);

  if (!errors.isEmpty()) {
    errors.array().forEach(error => req.flash("error", error.msg));

    res.render("list", {
      flash: req.flash(),
      todoList: list,
      todos: sortTodos(list.toArray()),
      todoTitle: list.title,
    })
  } else {
    if (!list) next(new Error("Can't find list"));

    let title = req.body.todoTitle.trim();
    let newTodo = new Todo(title);
    list.add(newTodo);
    req.flash("success", `${title} has been added to ${list.title}.`)
  }

  res.redirect(`/lists/${listId}`);
});

app.get("/lists/:todoListId/edit", (req, res, next) => {
  let todoListId = req.params.todoListId;
  let list = req.session.todoLists.find(list => list.id === Number(todoListId));
  if (!list) {
    next(new Error("Not Found"));
  } else {
    res.render("edit-list", {
      todoList: list,
    })
  }
});

app.post("/lists/:todoListId/destroy", (req, res, next) => {
  let todoListId = req.params.todoListId;
  let list = req.session.todoLists.find(list => list.id === Number(todoListId));
  if (!list) {
    next(new Error("Not Found"));
  } else {
    let listIndex = req.session.todoLists.indexOf(list);
    let listTitle = list.title;
		req.session.todoLists.splice(listIndex, 1);
    req.flash("success", `${listTitle} has been deteled.`)
    res.redirect("/lists");
  }
});

app.post("/lists/:todoListId/", [
  body("todoListTitle")
    .trim()
    .isLength({min: 1})
    .withMessage("The list title is required.")
    .isLength({max: 100})
    .withMessage("List title must be between 1 and 100 characters.")
    .custom(title => {
      let dupliate = req.session.todoLists.find(list => list.title === title);
      return dupliate === undefined;
    })
    .withMessage("List title must be unique."),
], (req, res, next) => {
  let todoListId = req.params.todoListId;
  let list = req.session.todoLists.find(list => list.id === Number(todoListId));
  let newTitle = req.body.todoListTitle.trim();
  let errors = validationResult(req);
  if (!list) {
    next(new Error("Not Found"));
  } else if (!errors.isEmpty()) {
    errors.array().forEach(error => req.flash("error", error.msg));
    res.render("edit-list", {
      flash: req.flash(),
      todoList: list,
      todoListTitle: newTitle,
    })
  } else {
    list.setTitle(newTitle);
    req.flash("success", `List title has been updated to ${newTitle}`);
    res.redirect(`/lists/${todoListId}`)
  }

})

app.use((err, req, res, _next) => {
  console.log(err);
  res.status(404).send(err.message);
})

app.listen(port, host, () => {
  console.log(`Todo is listening on port ${port} of ${host}!`);
});
