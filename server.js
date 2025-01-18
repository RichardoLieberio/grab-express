require('dotenv').config();
const express = require('express');
const http = require('http');
const {Server} = require('socket.io');
const ejsMate = require('ejs-mate');
const path = require('path');
const cookieParser = require('cookie-parser');

const {connectDB} = require('./models/database');
const {dropDB, createAndUseDB, createTable, seedUser, seedPayment, seedUserPayment, seedDriver} = require('./services/seedDatabase');

const websocket = require('./websocket');

const publicRoutes = require('./routes/public');
const configRoutes = require('./routes/config');
const pesananRoutes = require('./routes/pesanan');

connectDB()
    .then(async () => {
        await dropDB();
        await createAndUseDB();
        await createTable();
        await seedUser();
        await seedPayment();
        await seedUserPayment();
        await seedDriver();
    }).catch((err) => {
        console.error(err);
        process.exit();
    });

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.engine('ejs', ejsMate);
app.set('io', io);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'views')));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

io.on('connection', websocket);

app.use('/', publicRoutes);
app.use('/api/config', configRoutes);
app.use('/api/pesanan', pesananRoutes);

server.listen(3000, function() {
    console.log('Listening on port 3000');
});