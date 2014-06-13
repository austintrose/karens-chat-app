// Export a function, so that we can pass 
// the app and io instances from the app.js file:
module.exports = function(app,io){

	// Render views/home.html
	app.get('/', function(req,res){
		res.render('home'); 
	});

	// Redirect to a random room
	app.get('/create', function(req,res){
		var id = Math.round((Math.random() * 1000000));
		res.redirect('/chat/'+id);
	});

	// Render views/chat.html
	app.get('/chat/:id', function(req,res){
		res.render('chat');
	});

	// Initialize a new socket.io application, named 'chat'.
	var chat = io.of('/socket').on('connection', function (socket) {

		// Somebody has connected to the room.
		socket.on('load',function(data){

			// Respond allowning the host to login.
			if(chat.clients(data.room_id).length === 0 ) {
				socket.emit('ok_to_login', {
					host: true,
					controls_allowed: true,
				});
			}

			// Respond allowing the client to login.
			else if(chat.clients(data.room_id).length === 1) {
				socket.emit('ok_to_login', {
					host: false,
					host_name: chat.clients(data.room_id)[0].username,
					controls_allowed: chat.clients(data.room_id)[0].controls_allowed,
				});
			}

			// Deny the connection.
			else {
				socket.emit('too_many_people', {
					room_has_too_many: true,
				});
			}
		});

		// Somebody is attempting to log into the room.
		socket.on('login', function(data) {

			// Make sure the room isn't full.
			if(chat.clients(data.room_id).length < 2) {

				// This socket is unique per user - assign some data about them.
				socket.username = data.username;
				socket.room_id = data.room_id;
				socket.join(data.room_id);

				// The host just logged in.
				if(chat.clients(data.room_id).length == 1) {
					socket.controls_allowed = data.controls_allowed;
				}

				// The client just logged in.
				if(chat.clients(data.room_id).length == 2) {
					var usernames = [];
					usernames.push(chat.clients(data.room_id)[0].username);
					usernames.push(chat.clients(data.room_id)[1].username);

					var data = {
						event_type: 'start_chat',
						host: usernames[0],
						client: usernames[1],
						room_id: data.room_id,
					}

					// Start the chat.
					chat.in(data.room_id).emit('start_chat', data);
					writeLogObject(data)
				} 
			} 

			else {
				socket.emit('too_many_people', {
					room_has_too_many: true,
				});
			}
		});

		// Broadcast face-display changes.
		socket.on('face_change', function(data) {
			socket.broadcast.to(socket.room_id).emit('face_change',data);
			socket.emit('face_change',data);

			data['event_type'] = 'face_change';
			writeLogObject(data);
		});

		// Somebody left the chat
		socket.on('disconnect', function() {
			socket.broadcast.to(this.room_id).emit('leave', {
				partner_left: true,
			});
		});

		// Somebody sent a message
		socket.on('msg', function(data){
			// When the server receives a message, it sends it to the other person in the room.
			socket.broadcast.to(socket.room_id).emit('receive', {msg: data.msg, username: data.username});
			data['event_type'] = 'message';
			writeLogObject(data);
		});
	});
};

// TODO: Make sure logs are separated by chat room. 
function writeLogObject(obj) {
	var now = (new Date).toUTCString();
	obj['timestamp'] = now;
	console.log(obj);
}

