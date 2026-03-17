import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import confessionRoutes from './routes/confessionRoutes.js';
import crushRoutes from './routes/crushRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import systemRoutes from './routes/systemRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import Message from './models/Message.js';

dotenv.config({ path: '../.env' });

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/confessions', confessionRoutes);
app.use('/api/crushes', crushRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/admin', adminRoutes);

// Basic Route
app.get('/', (req: express.Request, res: express.Response) => {
  res.send('ClgCrush API is running...');
});

// Socket.io Connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on('send_message', async (data) => {
    const { room, senderId, content, isGroup } = data;
    
    try {
      // Save to database
      const newMessage = await Message.create({
        sender: senderId,
        content,
        room: room,
        isGroup: isGroup || false
      });

      // Broadcast to room
      socket.to(room).emit('receive_message', {
        ...data,
        room,
        _id: newMessage._id,
        createdAt: newMessage.createdAt
      });
    } catch (error) {
      console.error('Socket message save failed', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
