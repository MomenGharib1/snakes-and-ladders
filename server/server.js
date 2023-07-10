const express = require("express");
const cors = require("cors");

const app = express();

var corsOptions = {
  origin: "*",
};
app.use(cors(corsOptions));

const socketIO = require('socket.io')(http, {
  cors: {
      origin: "*"
  }
});

socketIO.on('connection', (socket) => {
  console.log(`${socket.id} just connected!`);

  socket.on('x', (data) => {
    socketIO.emit('server_event',{
            f1: PORT,
            f2: data.field_1
        })
  });

  socket.on('disconnect', () => {
    console.log('someone disconnected');
  });
  let counter = 0 

  // setInterval(()=>{
  //     socket.emit('server_event',{
  //         f1: PORT,
  //         f2: `${counter}`
  //     })
  //     console.log(counter)
  //     counter += 10
  // },2000)
});


// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

const db = require("./app/models");

// db.sequelize.sync()
//   .then(() => {
//     console.log("Synced db.");
//   })
//   .catch((err) => {
//     console.log("Failed to sync db: " + err.message);
//   });


app.use(require("./app/routes/routes.js"));
app.use((error, req, res, next) => {
  res.status(500).json({ message: " exception : " + error });
});
// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
