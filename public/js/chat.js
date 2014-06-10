// This file is executed in the browser, when people visit /chat/<random id>

$(function(){

  // Getting the id of the room from the url.
  var id = Number(window.location.pathname.match(/\/chat\/(\d+)$/)[1]);

  // Connect to the socket.
  var socket = io.connect('/socket');

  // This chat room's id
  var room_id = Number(window.location.pathname.match(/\/chat\/(\d+)$/)[1]);

  // Variables which hold data about this user.
  var username;
  var is_host;
  var controls_allowed;

  // TODO Cache some jQuery objects.

  // On connection to server send the id of the room.
  socket.on('connect', function(){
    socket.emit('load', {
      room_id: room_id,
    });
  });

  socket.on('ok_to_login', function(data){

    is_host = data.host;

    // This user is the host.
    if(is_host) {
      showMessage("start-new-chat");

      $('#host-form').on('submit', function(e) {
        e.preventDefault();
        username = $.trim($('#host-name').val());
        controls_allowed = $('#allow-face-controls').is(':checked');

        if (username.length < 1) {
          alert("Please enter a nick name longer than 1 character!");
          return;
        }
        else {
          showMessage("invite-to-chat");
          socket.emit('login', {
            username: username, 
            room_id: room_id,
            controls_allowed: controls_allowed,
          });
        }
      });
    }

    // This user is the client.
    else {
      showMessage("join-chat",data);
      controls_allowed = data.controls_allowed;

      $('#client-form').on('submit', function(e) {
        e.preventDefault();
        username = $.trim($('#client-name').val());

        if (username.length < 1) {
          alert("Please enter a nick name longer than 1 character!");
          return;
        }

        if (username == data.host_name) {
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
    if(data.room_id == room_id) {

      if (is_host || controls_allowed) {
        $('#face-controls').show();
        // TODO: Function for each face control.
        // WITH THE IDs YOU JUST GAVE THE BUTTONS
      }

      if (controls_allowed) {
        $('#client-face').show();
      }

      showMessage("chat", data);
    }
  })

  socket.on('leave',function(data){

    if(data.boolean && id==data.room){

      showMessage("somebodyLeft", data);
      $('#messages').empty();
    }

  });

  socket.on('too_many_people', function(data){
    alert('too many');
  });

  socket.on('receive', function(data){

      showMessage('chatStarted');

      createChatMessage(data.msg, data.username, moment());
      scrollToBottom();
      noMessages.hide();
  });

  $('#chat-field').keypress(function(e){
    if(e.which == 13) {
      e.preventDefault();
      $('#chat-form').trigger('submit');
    }
  });

  $('#chat-form').on('submit', function(e){

    e.preventDefault();
    if ($('#chat-field').val().trim().length > 0) {
      createChatMessage($('#chat-field').val(), username, moment());
      scrollToBottom();

      // Send the message to the other person in the chat
      socket.emit('msg', {msg: $('#chat-field').val(), username: username});

      $('#chat-field').val("");
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

    $('#messages').append(li);

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
    $("html, body").animate({ scrollTop: $(document).height()-$(window).height()+500 },100);
  }

  function showMessage(status,data){

    if(status === "start-new-chat"){
      $('#start-new-chat').fadeIn(600);
    }

    else if(status === "invite-to-chat"){
      // Set the invite link content
      $("#invite-link").text(window.location.href);
      $("#invite-link").attr('href', window.location.href);

      $('#start-new-chat').fadeOut(600, function(){
        $('#invite-to-chat').fadeIn(600);
      });
    }

    else if(status === "join-chat"){
      $('#join-chat-button').text("Chat with " + data.host_name);
      $('#join-chat').fadeIn(600);
    }

    else if(status === "chat"){
      $('#host-name-title').text(data.host);
      $('#client-name-title').text(data.client);

      var callback = function() {
        $('#chat').fadeIn(600);
        $('#footer').fadeIn(600);
      }

      if (is_host) {
        $('#invite-to-chat').fadeOut(600, callback);
      } else {
        $('#join-chat').fadeOut(600, callback);
      }

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
