// Server

var room_control_grants = {};

socket.on('load',function(data){
  if(chat.clients(data.room_id).length === 0 ) {
    socket.emit('people_in_chat', {
      how_many_in_room: 0,
    });
  }

  else if(chat.clients(data).length === 1) {
    socket.emit('people_in_chat', {
      how_many_in_room: 1,
      username: chat.clients(data)[0].username,
    });
  }

  else if(chat.clients(data).length >= 2) {
    socket.emit('too_many_people', {
      room_has_too_many: true,
    });
  }
});

socket.on('login', function(data) {
  if(chat.clients(data.room_id).length < 2) {
    socket.username = data.username;
    socket.room_id = data.room_id;

    // If the creator of the room has opted to grant face controls, 
    // broadcast that.
    if (data.grants_face_controls) {
      room_control_grants[data.room_id] = true;
    }

    socket.join(data.room_id);

    if(chat.clients(data.room_id).length == 2) {

      var usernames = [];
      usernames.push(chat.clients(data.room_id)[0].username);
      usernames.push(chat.clients(data.room_id)[1].username);

      chat.in(data.room_id).emit('start_chat', {
        room_id: data.room_id,
        users: usernames,
        grant_face_controls: room_control_grants[data.room_id],
      });
    } 
  } 

  else {
    socket.emit('too_many_people', {
      room_has_too_many: true,
    });
  }
});
