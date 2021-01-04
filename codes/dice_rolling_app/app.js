const HTTP = require('http'),
      PORT = 3000,
      URL = require('url').URL;

const SERVER = HTTP.createServer((req, res) => {
  let path = req.url,
      method = req.method;
      urlObject = new URL(path, 'http://localhost:3000'),
      params = urlObject.searchParams;

  if (params.get('pathname') === '/favicon.ico') {
    res.statusCode = 404;
    res.end();
  } else {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.write(`${method} ${path}\n`);

    if (/^\/roll/.test(path)) {
      res.write(respondTextForRolling(params))
    };

    res.end();
  }

});

SERVER.listen(PORT, () => {  // start listening
  console.log(`Server listening on port ${PORT}...`);
});


function randomWithinSix(sides) {
  return Math.floor((sides + 1) * Math.random());
};

function respondTextForRolling(params) {
  let rolls = parseInt(params.get('rolls')) || 1,
      sides = parseInt(params.get('sides')) || 6,
      responseText = '',
      rolled = 0;

  while (rolled < rolls) {
    responseText += `\nYou rolled ${randomWithinSix(sides)}`;
    rolled += 1;
  }

  return responseText;
}

