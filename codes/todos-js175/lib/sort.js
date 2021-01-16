function sortByTitle(lists) {
  return lists.slice().sort((todoListA, todoListB) => {
    let titleA = todoListA.title.toLowerCase();
    let titleB = todoListB.title.toLowerCase();

    if (titleA > titleB) {
      return 1;
    } else if (titleA < titleB) {
      return -1;
    } else {
      return 0;
    }
  })
};

function sortByState(lists) {
  return lists.slice().sort((todoListA, todoListB) => {
    let stateA = todoListA.isDone();
    let stateB = todoListB.isDone();

    if (stateA === true && stateB === false) {
      return 1;
    } else if (stateA === false && stateB === true) {
      return -1;
    } else {
      return 0;
    }
  })
};

module.exports = {
  sortLists(lists) {
    return sortByState(sortByTitle(lists));
  },

  sortTodos(todos) {
    return sortByState(sortByTitle(todos));
  },
};