let currentId = 0;

function nextId() {
  currentId += 1;
  return currentId;
};

module.exports = nextId;

// nextId is the only accessible interface for the files that require this file
// other interfaces are kept private