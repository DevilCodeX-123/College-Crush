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
import qrRoutes from './routes/qrRoutes.js';

import Message from './models/Message.js';
import User from './models/User.js';
import Group from './models/Group.js';
import jwt from 'jsonwebtoken';

dotenv.config({ path: '../.env' });

const app = express();
const httpServer = createServer(app);
export const io = new Server(httpServer, {
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
app.use('/api/qr', qrRoutes);


// Basic Route
app.get('/', (req: express.Request, res: express.Response) => {
  res.send('ClgCrush API is running...');
});

// Socket.io Middleware for Authentication
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token || socket.handshake.headers.token;
  if (!token) return next(new Error('Authentication error'));

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
    (socket as any).userId = decoded.id;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Socket.io Connection
io.on('connection', async (socket) => {
  const userId = (socket as any).userId;
  console.log('User connected:', userId);

  // Update status to Online
  if (userId) {
    await User.findByIdAndUpdate(userId, { onlineStatus: 'Online' });
    socket.join(`user_${userId}`);
  }

  socket.on('join_room', async (roomId) => {
    try {
      console.log(`[SOCKET] User ${userId} attempting to join: ${roomId}`);
      // If roomId is a MongoDB ID (24 hex chars), it's likely a group or match
      if (roomId && roomId.toString().match(/^[0-9a-fA-F]{24}$/)) {
        const group = await Group.findById(roomId);
        if (group && group.type === 'private') {
          if (!group.members.some(m => m.toString() === userId)) {
            console.log(`[SOCKET] Unauthorized join attempt to private room ${roomId} by ${userId}`);
            return;
          }
        }
        console.log(`[SOCKET] Group check passed for ${roomId}`);
      }
      
      socket.join(roomId);
      console.log(`[SOCKET] User ${userId} successfully joined room: ${roomId}`);
    } catch (error) {
      console.error('[SOCKET] Join room failed', error);
    }
  });

  socket.on('send_message', async (data) => {
    const { room, senderId, content, isGroup } = data;
    const userId = (socket as any).userId;

    console.log(`[SOCKET] Message received from ${userId} for room ${room}`);

    if (!userId || userId.toString() !== senderId.toString()) {
      console.log(`[SOCKET] Auth mismatch: session_userId=${userId}, data_senderId=${senderId}`);
      return;
    }
    
    try {
      // Authorization for private groups
      if (isGroup && room && room.toString().match(/^[0-9a-fA-F]{24}$/)) {
        const group = await Group.findById(room);
        if (group && group.type === 'private') {
          if (!group.members.some(m => m.toString() === userId)) {
            console.log(`[SOCKET] Unauthorized message attempt to private room ${room} by ${userId}`);
            return;
          }
        }
      }

      // Save to database & populate
      const newMessage = await Message.create({
        sender: userId,
        content,
        room: room,
        isGroup: isGroup || false
      });

      const populatedMessage = await Message.findById(newMessage._id).populate('sender', 'name profilePhoto');

      console.log(`[SOCKET] Message SAVED to DB: Room=${room}, MsgID=${newMessage._id}`);

      // Broadcast to room
      const emitData = {
        ...data,
        room: room.toString(),
        _id: newMessage._id,
        createdAt: newMessage.createdAt,
        senderId: userId.toString(),
        sender: populatedMessage?.sender
      };

      io.to(room.toString()).emit('receive_message', emitData);
      
      console.log(`[SOCKET] Message EMITTED to room ${room}`);
    } catch (error) {
      console.error('[SOCKET] Message handler failed', error);
    }
  });

  socket.on('disconnect', async () => {
    console.log('User disconnected:', userId);
    if (userId) {
      await User.findByIdAndUpdate(userId, { onlineStatus: 'Offline' });
    }
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
