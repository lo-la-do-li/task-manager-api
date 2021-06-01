const express = require('express');
const cors = require('cors');
require('./db/mongoose');
// const cookieParser = require('cookie-parser');
const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(cors());
app.options('*', cors());
app.use(userRouter);
app.use(taskRouter);

// Cookie-parser for auth additions
app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());

app.listen(port, () => {
	console.log(`Server is up on ${port}`);
});
