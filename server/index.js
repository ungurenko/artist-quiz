import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const PORT = process.env.PORT || 3001;

const httpServer = createServer();
const wss = new WebSocketServer({ server: httpServer });

const rooms = new Map();

function generateCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function createRoom() {
  const code = generateCode();
  const room = {
    code,
    players: [],
    questions: [],
    currentQuestion: 0,
    answers: {},
    scores: {},
    status: 'waiting', // waiting, playing, finished
  };
  rooms.set(code, room);
  return room;
}

function generateQuestions() {
  // Simple question pool for duels
  const questions = [
    {
      type: 'guessArtistByPainting',
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/Ilja_Jefimowitsch_Repin_013.jpg/800px-Ilja_Jefimowitsch_Repin_013.jpg',
      options: ['Илья Репин', 'Василий Суриков', 'Виктор Васнецов', 'Валентин Серов'],
      correct: 0,
    },
    {
      type: 'guessArtistByPainting',
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Aivazovsky_-_The_Ninth_Wave_-_Google_Art_Project.jpg/800px-Aivazovsky_-_The_Ninth_Wave_-_Google_Art_Project.jpg',
      options: ['Иван Шишкин', 'Илья Репин', 'Иван Айвазовский', 'Исаак Левитан'],
      correct: 2,
    },
    {
      type: 'trueFalse',
      question: 'Леонардо да Винчи изобрёл технику «сфумато».',
      correct: 1,
    },
    {
      type: 'guessArtistByPainting',
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/600px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg',
      options: ['Рафаэль', 'Леонардо да Винчи', 'Микеланджело', 'Боттичелли'],
      correct: 1,
    },
    {
      type: 'guessArtistByStyle',
      question: 'Какой художник создал «Афинскую школу»?',
      options: ['Леонардо да Винчи', 'Рафаэль', 'Микеланджело', 'Тициан'],
      correct: 1,
    },
    {
      type: 'trueFalse',
      question: 'Михаил Врубель сначала окончил юридический факультет.',
      correct: 1,
    },
    {
      type: 'guessArtistByPainting',
      image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Mikhail_Vrubel_-_The_Demon_Seated_-_Google_Art_Project.jpg/600px-Mikhail_Vrubel_-_The_Demon_Seated_-_Google_Art_Project.jpg',
      options: ['Михаил Врубель', 'Виктор Васнецов', 'Илья Репин', 'Николай Рерих'],
      correct: 0,
    },
    {
      type: 'guessArtistByStyle',
      question: 'Какой художник написал «Девочку с персиками»?',
      options: ['Илья Репин', 'Валентин Серов', 'Иван Айвазовский', 'Константин Коровин'],
      correct: 1,
    },
  ];

  // Shuffle and pick 5
  return questions.sort(() => Math.random() - 0.5).slice(0, 5);
}

function broadcast(room, message, excludeWs = null) {
  room.players.forEach((p) => {
    if (p.ws !== excludeWs && p.ws.readyState === 1) {
      p.ws.send(JSON.stringify(message));
    }
  });
}

wss.on('connection', (ws) => {
  let playerRoom = null;
  let playerId = null;

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.type === 'create') {
        const room = createRoom();
        playerId = msg.playerId;
        playerRoom = room.code;
        room.players.push({ ws, id: playerId, name: msg.playerName });
        ws.send(JSON.stringify({ type: 'created', code: room.code }));
      }

      if (msg.type === 'join') {
        const room = rooms.get(msg.code);
        if (!room) {
          ws.send(JSON.stringify({ type: 'error', message: 'Комната не найдена' }));
          return;
        }
        if (room.players.length >= 2) {
          ws.send(JSON.stringify({ type: 'error', message: 'Комната заполнена' }));
          return;
        }
        playerId = msg.playerId;
        playerRoom = room.code;
        room.players.push({ ws, id: playerId, name: msg.playerName });
        ws.send(JSON.stringify({ type: 'joined', code: room.code }));
        broadcast(room, {
          type: 'playerJoined',
          players: room.players.map((p) => ({ id: p.id, name: p.name })),
        });
      }

      if (msg.type === 'start') {
        const room = rooms.get(playerRoom);
        if (!room) return;
        room.status = 'playing';
        room.questions = generateQuestions();
        room.currentQuestion = 0;
        room.scores = {};
        room.players.forEach((p) => {
          room.scores[p.id] = 0;
        });
        broadcast(room, {
          type: 'gameStart',
          questions: room.questions,
          totalQuestions: room.questions.length,
        });
      }

      if (msg.type === 'answer') {
        const room = rooms.get(playerRoom);
        if (!room) return;
        const q = room.questions[room.currentQuestion];
        const correct = msg.answer === q.correct;
        if (correct) {
          room.scores[playerId] = (room.scores[playerId] || 0) + 10;
        }

        if (!room.answers[room.currentQuestion]) {
          room.answers[room.currentQuestion] = {};
        }
        room.answers[room.currentQuestion][playerId] = {
          answer: msg.answer,
          correct,
          time: msg.time || 0,
        };

        // Check if all players answered
        const allAnswered = room.players.every(
          (p) => room.answers[room.currentQuestion][p.id] !== undefined
        );

        if (allAnswered) {
          broadcast(room, {
            type: 'questionResult',
            questionIndex: room.currentQuestion,
            answers: room.answers[room.currentQuestion],
            correctAnswer: q.correct,
            scores: room.scores,
          });
        }
      }

      if (msg.type === 'nextQuestion') {
        const room = rooms.get(playerRoom);
        if (!room) return;
        room.currentQuestion += 1;
        if (room.currentQuestion >= room.questions.length) {
          room.status = 'finished';
          const winner = Object.entries(room.scores).sort((a, b) => b[1] - a[1])[0];
          broadcast(room, {
            type: 'gameOver',
            scores: room.scores,
            winner: winner?.[0] || null,
            players: room.players.map((p) => ({ id: p.id, name: p.name })),
          });
        } else {
          broadcast(room, {
            type: 'nextQuestion',
            questionIndex: room.currentQuestion,
          });
        }
      }
    } catch (err) {
      console.error('Message error:', err);
    }
  });

  ws.on('close', () => {
    if (playerRoom) {
      const room = rooms.get(playerRoom);
      if (room) {
        room.players = room.players.filter((p) => p.ws !== ws);
        if (room.players.length === 0) {
          rooms.delete(playerRoom);
        } else {
          broadcast(room, {
            type: 'playerLeft',
            players: room.players.map((p) => ({ id: p.id, name: p.name })),
          });
        }
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Duel server running on port ${PORT}`);
});
