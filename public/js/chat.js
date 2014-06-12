// This file is executed in the browser, when people visit /chat/<random id>

$(function(){

  // Getting the id of the room from the url.
  var room_id = Number(window.location.pathname.match(/\/chat\/(\d+)$/)[1]);

  // Connect to the socket.
  var socket = io.connect('/socket');

  // Variables which hold data about this user.
  var username;
  var is_host;
  var controls_allowed;

  // The "What's your name?" login form shown to the host.
  var host_form = $('form#host-form');

  // The input field on the host's login form.
  var host_name = $('input#host-name');

  // The checkbox field on the host's login form.
  var allow_face_controls = $('#allow-face-controls');

  // The "What's your name?" login form shown to the client.
  var client_form = $('#client-form');

  // The input field on the client's login form.
  var client_name = $('#client-name');

  // The area which displays the client's selected image if they have those controls.
  var client_face = $('div#client-face');

  // The area which displays the 6 face control buttons if the user has those controls.
  var face_controls = $('#face-controls');

  // The input field for sending a chat message.
  var chat_field = $('input#chat-field');

  // The form for sending a chat message.
  var chat_form = $('form#chat-form');

  var start_new_chat = $('#start-new-chat');
  var invite_link = $("#invite-link");
  var invite_to_chat = $('#invite-to-chat');

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

      start_new_chat.fadeIn(600);

      host_form.on('submit', function(e) {
        e.preventDefault();
        username = $.trim(host_name.val());
        controls_allowed = allow_face_controls.is(':checked');

        if (username.length < 1) {
          alert("Please enter a nick name longer than 1 character!");
          return;
        }
        else {

          // Set the invite link content
          invite_link.text(window.location.href);
          invite_link.attr('href', window.location.href);

          start_new_chat.fadeOut(600, function(){
            invite_to_chat.fadeIn(600);
          });

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

      $('#join-chat-button').text("Chat with " + data.host_name);
      $('#join-chat').fadeIn(600);

      controls_allowed = data.controls_allowed;

      client_form.on('submit', function(e) {
        e.preventDefault();
        username = $.trim(client_name.val());

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
        face_controls.show();
        face_controls.find('button').click(function(event) {
          face_controls.find('button').removeClass('active');
          $(this).addClass('active');
          var id = $(this).attr('id');
          socket.emit('face_change', {
            id: id,
            is_host: is_host
          });
        });

        $(document).bind('keydown', 'ctrl+1', function(){
          $('button#1').trigger('click');
        });  

        $(document).bind('keydown', 'ctrl+2', function(){
          $('button#2').trigger('click');
        });  

        $(document).bind('keydown', 'ctrl+3', function(){
          $('button#3').trigger('click');
        });  

        $(document).bind('keydown', 'ctrl+4', function(){
          $('button#4').trigger('click');
        });  

        $(document).bind('keydown', 'ctrl+5', function(){
          $('button#5').trigger('click');
        });  

        $(document).bind('keydown', 'ctrl+6', function(){
          $('button#6').trigger('click');
        });  

      }

      if (controls_allowed) {
        client_face.show();
      }

      $('#host-name-title').text(data.host);
      $('#client-name-title').text(data.client);

      var callback = function() {
        $('#chat').fadeIn(600);
        $('#footer').fadeIn(600);
      }

      if (is_host) {
        invite_to_chat.fadeOut(600, callback);
      } else {
        $('#join-chat').fadeOut(600, callback);
      }
    }
  })

  socket.on('face_change', function(data) {
    var face_img = $(data.is_host ? 'img#host-face-img' : 'img#client-face-img');
    var new_src = '../img/' + data.id + '.jpg';
    face_img.attr('src', new_src);
  });

  socket.on('leave',function(data){
    // TODO: Something?
  });

  socket.on('too_many_people', function(data){
    // TODO: Something?
  });

  socket.on('receive', function(data){
    createChatMessage(data.msg, data.username, moment());
    scrollToBottom();
  });

  chat_field.keypress(function(e){
    if(e.which == 13) {
      e.preventDefault();
      chat_form.trigger('submit');
    }
  });

  chat_form.on('submit', function(e){
    e.preventDefault();
    if (chat_field.val().trim().length > 0) {
      createChatMessage(chat_field.val(), username, moment());
      scrollToBottom();

      // Send the message to the other person in the chat
      socket.emit('msg', {msg: chat_field.val(), username: username});

      chat_field.val("");
    }
  });

  // Update the relative time stamps on the chat messages every minute

  setInterval(function(){

    $('.timesent').each(function(){
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

    $(".timesent").last().text(now.fromNow());
  }

  function scrollToBottom(){
    $("html, body").animate({ scrollTop: $(document).height()-$(window).height()+500 },100);
  }

});
