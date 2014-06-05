// Client

var room_id;
var username;
var has_face_controls = false;
var grants_face_controls = false;

socket.on('connect', function(){
  room_id = Number(window.location.pathname.match(/\/chat\/(\d+)$/)[1]);

  socket.emit('load', {
    room_id: room_id,
  });
});

socket.on('people_in_chat', function(data){

  // If this user is creating the room.
  if(data.how_many_in_room === 0){

    has_face_controls = true;
    showMessage("connected");

    loginForm.on('submit', function(e) {
      e.preventDefault();
      username = $.trim(yourName.val());
      grants_face_controls = controlCheckbox.attr('checked');

      if (username.length < 1) {
        alert("Please enter a nick name longer than 1 character!");
        return;
      }

      else {
        showMessage("inviteSomebody");
        socket.emit('login', {
          username: username, 
          room_id: room_id,
          grants_face_controls: grants_face_controls,
        });
      }
    });
  }

  // If this user is joinging an already created room.
  else if (data.how_many_in_room === 1) {

    showMessage("personinchat",data);

    loginForm.on('submit', function(e) {
      e.preventDefault();
      username = $.trim(hisName.val());

      if (username.length < 1) {
        alert("Please enter a nick name longer than 1 character!");
        return;
      }

      if (username == data.username) {
        alert("There already is a \"" + name + "\" in this room!");
        return;
      }

      else {
        socket.emit('login', {
          username: username, 
          room_id: room_id,
          grants_face_controls: grants_face_controls,
        });
      }
    });
  }
});

socket.on('start_chat', function(data) {
  if (has_face_controls || data.grant_face_controls) {
    $('.face-buttons').show();
  }

  if(data.room_id == room_id) {
    chats.empty();

    if(username === data.users[0]) {
      showMessage("youStartedChatWithNoMessages",data);
    }

    else {
      showMessage("heStartedChatWithNoMessages",data);
    }

    chatNickname.text(friend);
  }
})

// TODO: Socket on too many people
// TODO: Make sure all the showMessage have data they need
