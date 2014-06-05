// This file is required by app.js. It sets up event listeners
// for the two main URL endpoints of the application - /create and /chat/:id
// and listens for socket.io messages.

var room_control_grants = {};

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

	// Initialize a new socket.io application, named 'chat'
	var chat = io.of('/socket').on('connection', function (socket) {

		socket.on('load',function(data){
			if(chat.clients(data.room_id).length === 0 ) {
				socket.emit('people_in_chat', {
					how_many_in_room: 0,
				});
			}

			else if(chat.clients(data.room_id).length === 1) {
				socket.emit('people_in_chat', {
					how_many_in_room: 1,
					username: chat.clients(data.room_id)[0].username,
				});
			}

			else if(chat.clients(data.room_id).length >= 2) {
				socket.emit('too_many_people', {
					room_has_too_many: true,
				});
			}
		});

		socket.on('login', function(data) {
			if(chat.clients(data.room_id).length < 2) {
				socket.username = data.username;
				socket.room_id = data.room_id;

				room_control_grants[data.room_id] = data.grants_face_controls;

				socket.join(data.room_id);

				if(chat.clients(data.room_id).length == 2) {

					var usernames = [];
					usernames.push(chat.clients(data.room_id)[0].username);
					usernames.push(chat.clients(data.room_id)[1].username);

					chat.in(data.room_id).emit('start_chat', {
						room_id: data.room_id,
						users: usernames,
					});

					if (room_control_grants[data.room_id]) {
						chat.in(data.room_id).emit('get_face_controls', {});
					}
				} 

			} 

			else {
				socket.emit('too_many_people', {
					room_has_too_many: true,
				});
			}
		});

		// Somebody left the chat
		socket.on('disconnect', function() {

			// Notify the other person in the chat room
			// that his partner has left

			socket.broadcast.to(this.room_id).emit('leave', {
				boolean: true,
				room_id: this.room_id,
				username: this.username
			});

			// leave the room
			socket.leave(socket.room_id);
		});


		// Handle the sending of messages
		socket.on('msg', function(data){

			// When the server receives a message, it sends it to the other person in the room.
			socket.broadcast.to(socket.room_id).emit('receive', {msg: data.msg, username: data.username});
		});

		socket.on('grant_face_controls', function() {
			socket.broadcast.to(socket.room_id).emit('get_face_controls', {});
		})
	});
};

// TODO: Make sure logs are separated by chat room. 
function writeLogObject(obj) {

}

