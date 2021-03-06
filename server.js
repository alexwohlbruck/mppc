// Development server

const express = require('express');
const app = express();

const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

const routes = require('./src/actions');

for (const route in routes) {
    app.post(`/${route}`, async (req, res) => {
        return res.json({
        	fulfillmentText: await routes[route](req.body)
        });
    });
}

app.listen(8080, () => console.log('Example app listening on port 8080!'));