export const setupMessageHandlers = (socket: any, io: any) => {
  socket.on('send_message', async (data: any) => {
    // Handle message sending
    console.log('Message received:', data);
    io.to(data.conversationId).emit('message_received', data);
  });

  socket.on('typing', (data: any) => {
    socket.broadcast.emit('user_typing', data);
  });

  socket.on('stop_typing', (data: any) => {
    socket.broadcast.emit('user_stopped_typing', data);
  });
};
