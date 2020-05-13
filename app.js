var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var config = require('./config');
var fs = require('fs');
var path = require('path')

app.use(express.static('public'))


var date = new Date();
let peopleInside = 0;

fs.readdir('./log/', (err, files) => { //get old value
  if(files == ''){
    peopleInside = 0;
    return true;
  }
  let j = 1;
  let filePath = files[files.length - 1].split('-').slice(-1) == 'ERROR.log' ? files[files.length - 2] : files[files.length - 1];
  fs.readFile(`./log/${filePath}`, 'utf8', function(err, contents) {
    let i = 1;
    if(contents == ''){
      peopleInside = 0;
      return true;
    }
    while(contents.split('\n').slice(-i-1, -i)[0].split(" ").includes('{"message":"ERROR') || contents.split('\n').slice(-i-1, -i)[0].split(" ").includes('exitedWhileDisconnected')){
      i++;
      if(i > contents.split('\n').length-2){
        peopleInside = 0;
        return true;
      }
    }
    if (!contents.split('\n').slice(-i-1, -i)[0].split(" ").includes('{"message":"ERROR')) {
      let array = contents.split('\n').slice(-i-1, -i)[0].split(" ");
      peopleInside = Number(array[array.findIndex((e) => e == 'people') - 1]);
      peopleInside = peopleInside < 0  ? 0 : peopleInside;
    }
  });
});

var winston = require('winston');
require('winston-daily-rotate-file');

var logger = winston.createLogger({ //create 2 logs files
    transports: [
      new (winston.transports.DailyRotateFile)({
          level: 'info',
          frequency: '30m',
          filename: '%DATE%-COMBINED.log',
          datePattern: 'YYYY-MM-DD-HH[h]mm',
          dirname: './log'
        }),
      new (winston.transports.DailyRotateFile)({
          level: 'error',
          frequency: '30m',
          filename: '%DATE%-ERROR.log',
          datePattern: 'YYYY-MM-DD-HH[h]mm',
          dirname: './log'
        }),
    ]
  });

const checkMaxPeopleInside = () => {
  if(peopleInside > config.maxPeopleInside){
    const date = new Date();
    logger.error(`ERROR : Max people inside (${config.maxPeopleInside}) exceeded : ${peopleInside} people inside at ${date.toString()}`)
  }
}
const checkMinPeopleInside = () =>{
  if(peopleInside < 0){
    const date = new Date();
    logger.error(`ERROR : Less than 0 people inside at ${date.toString()}`)
    peopleInside = 0;
  }
}

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
  //res.send('Hello ' + peopleInside );
});

io.on('connection', (socket) => {
  socket.emit('peopleInside', {peopleInside});
  socket.emit('maxPeopleInside', config.maxPeopleInside);

  socket.on('+', function (data) { // someone get out
    if(data != undefined){
      if(data.password != undefined){
        if(data.password == config.password){
          const date = new Date();
          peopleInside = peopleInside + 1
          socket.emit('peopleInside', {"peopleInside": peopleInside});
          socket.broadcast.emit('peopleInside', {"peopleInside": peopleInside});
          logger.info(`${date.toString()} / enter from :${data.nomSmartphone} / ${peopleInside} people inside`);
          checkMaxPeopleInside();
        }
      }else{
        if(data == config.password){
          const date = new Date();
          peopleInside = peopleInside + 1
          socket.emit('peopleInside', {"peopleInside": peopleInside});
          socket.broadcast.emit('peopleInside', {"peopleInside": peopleInside});
          logger.info(`${date.toString()} / enter / ${peopleInside} people inside`);
          checkMaxPeopleInside();
        }
      }
    }
  });

  socket.on('-', function (data) { // someone get in
    if(data != undefined){
      if(data.password != undefined){
        if(data.password == config.password){
          const date = new Date();
          peopleInside = peopleInside - 1
          checkMinPeopleInside();
          socket.emit('peopleInside', {"peopleInside": peopleInside});
          socket.broadcast.emit('peopleInside', {"peopleInside": peopleInside});
          logger.info(`${date.toString()} / exit from :${data.nomSmartphone} / ${peopleInside} people inside`);
        }
      }else{
        if(data == config.password){
          const date = new Date();
          peopleInside = peopleInside - 1
          checkMinPeopleInside();
          socket.emit('peopleInside', {"peopleInside": peopleInside});
          socket.broadcast.emit('peopleInside', {"peopleInside": peopleInside});
          logger.info(`${date.toString()} / exit / ${peopleInside} people inside`);
        }
      }
    }
  });

  socket.on('exitedWhileDisconnected', function (data) { //people who get out while server or phone were disconnected
    if(data != undefined){
      if(data.password != undefined){
        if(data.password == config.password){
          peopleInside = peopleInside - data.value;
          logger.info(`${date.toString()} / exitedWhileDisconnected from:${data.nomSmartphone} / ${data.value} exited while server was disconnected. Now ${peopleInside} people inside`);
          checkMinPeopleInside();
          socket.emit('peopleInside', {peopleInside});
          socket.broadcast.emit('peopleInside', {"peopleInside": peopleInside});
        }
      }else{
        peopleInside = peopleInside - data;
        logger.info(`${date.toString()} / exitedWhileDisconnected / ${data} exited while server was disconnected. Now ${peopleInside} people inside`);
        checkMinPeopleInside();
        socket.emit('peopleInside', {peopleInside});
        socket.broadcast.emit('peopleInside', {"peopleInside": peopleInside});
      }
    }
  });

});

http.listen(config.port, function(){

});
