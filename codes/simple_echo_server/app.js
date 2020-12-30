const HTTP = require('http'),
      PORT = 3000;

const SERVER = HTTP.createServer((req, res) => {
  let path = req.url,
      method = req.method;

  if (path === '/favicon.ico') {
    res.statusCode = 404;
    res.end();
  } else {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.write(`${method} ${path}\n`);
    res.end();
  }
});

SERVER.listen(PORT, () => {  // start listening
  console.log(`Server listening on port ${PORT}...`);
});

