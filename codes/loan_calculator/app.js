// m = monthly payment
// p = loan amount ?
// j = monthly interest rate 5%
// n = loan duration in months ?

// m = p * (j / (1 - (1 + j)**(-n)))

// http://localhost:3000/?amount=5000&duration=10

const HTTP = require('http'),
      PORT = 3000,
      URL = require('url').URL,
      ARP = 5,
      HANDLEBARS = require('handlebars'),
      // PATH = require('path'),
      QUERYSTRING = require('querystring'),
      // FS = require('fs'),
      ROUTER = require('router'),
      FINALHANDLER = require('finalhandler'),
      SERVESTATIC = require('serve-static');

const MIME_TYPES = {
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

const LOAN_OFFER_SOURCE = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <link rel="stylesheet" href="/assets/css/styles.css">
          <title>Loan Calculator</title>
        </head>
        <body>
          <article>
            <h1>Loan Calculator</h1>
            <table>
              <tbody>
              <tr>
                 <th>Amount: </th>
                 <td>
                  <a href='/loan-offer?amount={{decresedAmount}}&duration={{duration}}' >- $100</a>
                  $ {{amount}}
                  <a href='/loan-offer?amount={{incresedAmount}}&duration={{duration}}' >+ $100</a>
                  </td>
               </tr>

                <tr>
                 <th>Duration: </th>
                 <td>
                  <a href='/loan-offer?amount={{amount}}&duration={{decreaseDuration}}' >- 1</a>
                  {{duration}} years
                  <a href='/loan-offer?amount={{amount}}&duration={{increaseDuration}}' >+ 1</a>
                  </td>
               </tr>

                <tr>
                  <th>ARP: </th>
                  <td>{{monthly_rate}} %</td>
                </tr>

                <tr>
                  <th>Monthly Payment: </th>
                  <td>$ {{monthly_payment}}</td>
                </tr>
              </tbody>
            </table>
          </article>
        </body>
      </html>`;

const LOAN_FORM_SOURCE = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Loan Calculator</title>
    <link rel="stylesheet" href="/assets/css/styles.css">
  </head>
  <body>
    <article>
      <h1>Loan Calculator</h1>
      <form action="/loan-offer" method="post">
        <p>All loans are offered at an APR of {{apr}}%.</p>
        <label for="amount">How much do you want to borrow (in dollars)?</label>
        <input type="number" name="amount" value="">
        <label for="amount">How much time do you want to pay back your loan?</label>
        <input type="number" name="duration" value="">
        <input type="submit" name="" value="Get loan offer!">
      </form>
    </article>
  </body>
</html>
`

const LOAN_OFFER_TMEPLATE =  HANDLEBARS.compile(LOAN_OFFER_SOURCE),
      LOAN_FORM_TEMPLATE = HANDLEBARS.compile(LOAN_FORM_SOURCE);

function render(template, data) {
  return template(data)
};

function getPathName(path) {
  const url = new URL(path, `http://localhost:${PORT}`)
  return url.pathname;
};

function calculateMonthlyPay(amount, years) {
  let months = years * 12,
      monthlyRate = ARP / 12;
  return  (amount * (monthlyRate / (1 - (1 + monthlyRate)**(-months)))).toFixed(2);
};

function parseFormData(request, callback) {
  let body = '';
  request.on('data', chunk => body += chunk.toString());
  request.on('end', () => {
    let data = QUERYSTRING.parse(body);
    data.amount = Number(data.amount);
    data.duration = Number(data.duration);
    callback(data);
  })
};

function getParams(path) {
  const url = new URL(path, `http://localhost:${PORT}`);

  let searchParams = url.searchParams;
  let data = {};
  data.amount = Number(searchParams.get('amount'));
  data.duration = Number(searchParams.get('duration'));

  return data;
}

function createLoanOffer(data) {
  let monthlyPay = calculateMonthlyPay(data.amount, data.duration);

  data.amount = data.amount,
  data.duration = data.duration,
  data.monthly_rate = ARP,
  data.monthly_payment = monthlyPay,
  data.incresedAmount = data.amount + 100,
  data.decresedAmount = data.amount - 100,
  data.increaseDuration = data.duration + 1,
  data.decreaseDuration = data.duration - 1

  return data;
};

let router = ROUTER();
router.use(SERVESTATIC('public'));

router.get('/',(_, res) => {
  let content = render(LOAN_FORM_TEMPLATE, {arp: ARP})

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');
  res.write(content);
  res.end();
});

router.get('/loan-offer', (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html');

  let data = createLoanOffer(getParams(req.url));
  console.log(data);
  res.write(LOAN_OFFER_TMEPLATE(data));
  res.end();
});

router.post('/loan-offer', (req, res) => {
  parseFormData(req, parsedData => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');

    let data = createLoanOffer(parsedData)
    console.log(data);
    res.write(LOAN_OFFER_TMEPLATE(data));
    res.end();
  })
});

router.get('*', (_, res) => {
  res.statusCode = 404;
  res.end();
})


const SERVER = HTTP.createServer((req, res) => {
  router(req, res, FINALHANDLER(req, res));
  // let path = req.url,
  //     method = req.method,
  //     pathname = getPathName(path),
  //     fileExtension = PATH.extname(pathname),
  //     params = (new URL(path, 'http://localhost:3000')).searchParams,
  //     paramAmount = parseInt(params.get('amount')),
  //     paramsyears = parseInt(params.get('duration'));
  //
  // console.log(pathname);
  //
  // FS.readFile(`./public/${pathname}`, (err, data) => {
  //   if (data) {
  //     res.statusCode = 200;
  //     res.setHeader('Content-Type', `${MIME_TYPES[fileExtension]}`);
  //     res.write(data);
  //     res.end();
  //   } else {
  //     if (method === 'GET' && pathname === '/') {
  //       getIndex(res);
  //     } else if (method === 'GET' && pathname === '/loan-offer') {
  //       getLoanOffer(res, path);
  //     } else if (method === 'POST' && pathname === '/loan-offer') {
  //       postLoanOffer(req, res);
  //     } else {
  //
  //     }
  //   }
  // })
})

SERVER.listen(PORT, () => {
  console.log(`Local Server listening on port ${PORT}...`);
})


