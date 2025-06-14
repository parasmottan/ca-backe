import express from 'express';
import http from 'http';
import cors from 'cors';
import mongoose from 'mongoose';
import { Server } from 'socket.io';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// ✅ MongoDB Connect
mongoose.connect('mongodb+srv://parassmottan:mottan9316@cluster0.2vvt9wa.mongodb.net/chat-app?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.log('❌ MongoDB Error:', err));

// ✅ Message Schema
const MessageSchema = new mongoose.Schema({
  username: String,
  message: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Message = mongoose.model('Message', MessageSchema);

// ✅ API route: get all old messages
app.get('/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// ✅ Socket.io setup
const io = new Server(server, {
  cors: {
   origin: [
      'https://ca-front-paras-projects-3b2b1deb.vercel.app',
      'https://ca-front-ten.vercel.app'
    ],
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('🔗 User connected:', socket.id);

  // ✅ Message receive and DB save
  socket.on('send_message', async (data) => {
    console.log('📩 Message Received:', data);

    // Save to MongoDB
    const newMsg = new Message(data);
    await newMsg.save();

    // Send to all clients
    io.emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

// ✅ Server listen
server.listen(5000, () => {
  console.log('🚀 Server running on port 5000');
});
