export const setupNotificationHandlers = (socket: any, io: any) => {
  socket.on('notify', (data: any) => {
    // Handle notifications
    console.log('Notification:', data);
    io.to(data.userId).emit('notification_received', data);
  });

  socket.on('mark_read', (data: any) => {
    io.to(data.userId).emit('notification_read', data);
  });
};
