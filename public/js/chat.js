// This file is executed in the browser, when people visit /chat/<random id>

$(function(){

  // Getting the id of the room from the url.
  var id = Number(window.location.pathname.match(/\/chat\/(\d+)$/)[1]);

  // Connect to the socket.
  var socket = io.connect('/socket');

  // Variables which hold data about this user.
  var room_id = Number(window.location.pathname.match(/\/chat\/(\d+)$/)[1]);
  var username;
  var has_face_controls

  // Cache some jQuery objects.
  // var section = $(".section");

  // On connection to server send the id of the room.
  socket.on('connect', function(){
    socket.emit('load', {
      room_id: room_id,
    });
  });

  socket.on('ok_to_login', function(data){

    // If this user is creating the room.
    if(data.how_many_in_room === 0){

      showMessage("connected");

      loginForm.on('submit', function(e) {
        e.preventDefault();
        username = $.trim(yourName.val());
        grants_face_controls = controlCheckbox.is(':checked');

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
          alert("There already is a \"" + username + "\" in this room!");
          return;
        }

        else {
          socket.emit('login', {
            username: username, 
            room_id: room_id,
          });
        }
      });
    }
  });


  socket.on('start_chat', function(data) {

    if (has_face_controls) {
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

      // If granting controls, broadcast a grant.
      if (grants_face_controls) {
        socket.emit('grant_face_controls', {});
        $('#client_title').html(data.users[1]);
        $('#clientFace').show();
      }
    }

    $('#host_title').html(data.users[0]);
    $('.face-images').show();
  })

  socket.on('leave',function(data){

    if(data.boolean && id==data.room){

      showMessage("somebodyLeft", data);
      chats.empty();
    }

  });

  socket.on('tooMany', function(data){

    if(data.boolean && username.length === 0) {

      showMessage('tooManyPeople');
    }
  });

  socket.on('receive', function(data){

      showMessage('chatStarted');

      createChatMessage(data.msg, data.username, moment());
      scrollToBottom();
      noMessages.hide();
  });

  socket.on('get_face_controls', function(){
    $('.face-buttons').show();
    $('#client_title').html(username);
    $('#clientFace').show();

    $('.face-buttons')
  });

  textarea.keypress(function(e){

    // Submit the form on enter

    if(e.which == 13) {
      e.preventDefault();
      chatForm.trigger('submit');
    }

  });

  chatForm.on('submit', function(e){

    e.preventDefault();
    if (textarea.val().trim().length > 0) {
      noMessages.hide();
      // Create a new chat message and display it directly

      showMessage("chatStarted");

      createChatMessage(textarea.val(), username, moment());
      scrollToBottom();

      // Send the message to the other person in the chat
      socket.emit('msg', {msg: textarea.val(), username: username});

      // Empty the textarea
      textarea.val("");
    }
  });

  // Update the relative time stamps on the chat messages every minute

  setInterval(function(){

    messageTimeSent.each(function(){
      var each = moment($(this).data('time'));
      $(this).text(each.fromNow());
    });

  },60000);

  // Function that creates a new chat message

  function createChatMessage(msg,user,now){

    var who = '';

    if(user===username) {
      who = 'me';
    }
    else {
      who = 'you';
    }

    var li = $(
      '<li class=' + who + '>'+
        '<div class="image">' +
          '<b></b>' +
          '<i class="timesent" data-time=' + now + '></i> ' +
        '</div>' +
        '<p></p>' +
      '</li>');

    // use the 'text' method to escape malicious user input
    li.find('p').text(msg);
    li.find('b').text(user);

    chats.append(li);

    messageTimeSent = $(".timesent");
    messageTimeSent.last().text(now.fromNow());
  }

  function setHostImage(image_id) {
    $('img.host_image').hide();
    $('img#host_image_' + image_id).show();
  }

  function setClientImage(image_id) {
    $('img.client_image').hide();
    $('img#client_image_' + image_id).show();
  }

  function scrollToBottom(){
    $("html, body").animate({ scrollTop: $(document).height()-$(window).height() },100);
  }

  function showMessage(status,data){

    if(status === "connected"){

      section.children().css('display', 'none');
      onConnect.fadeIn(1200);
    }

    else if(status === "inviteSomebody"){

      // Set the invite link content
      $("#link").text(window.location.href);

      onConnect.fadeOut(1200, function(){
        inviteSomebody.fadeIn(1200);
      });
    }

    else if(status === "personinchat"){

      onConnect.css("display", "none");
      personInside.fadeIn(1200);

      chatNickname.text(data.username);
    }

    else if(status === "youStartedChatWithNoMessages") {

      left.fadeOut(1200, function() {
        inviteSomebody.fadeOut(1200,function(){
          noMessages.fadeIn(1200);
          footer.fadeIn(1200);
        });
      });

      friend = data.users[1];
    }

    else if(status === "heStartedChatWithNoMessages") {

      personInside.fadeOut(1200,function(){
        noMessages.fadeIn(1200);
        footer.fadeIn(1200);
      });

      friend = data.users[0];
    }

    else if(status === "chatStarted"){

      section.children().css('display','none');
      chatScreen.css('display','block');
    }

    else if(status === "somebodyLeft"){

      leftNickname.text(data.username);

      section.children().css('display','none');
      footer.css('display', 'none');
      left.fadeIn(1200);
    }

    else if(status === "tooManyPeople") {

      section.children().css('display', 'none');
      tooManyPeople.fadeIn(1200);
    }
  }

});
