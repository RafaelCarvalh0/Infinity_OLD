const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const { body, validationResult } = require('express-validator');
const socketIO = require('socket.io');
const qrcode = require('qrcode');
const http = require('http');
const fileUpload = require('express-fileupload');
const axios = require('axios');
//const mime = require('mime-types');
const multer = require('multer');
const FormData = require('form-data');
const port = process.env.PORT || 8000;
const app = express();
const server = http.createServer(app);
//const nodemon = require('nodemon');
const io = socketIO(server);
const path = require('path');
//const fs = require('fs');

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 } // Limite de 50MB
});
const bodyParser = require('body-parser');
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

const {
  getClient,
  setAutentication,
  adicionarContatos,
  buscarContatos,
  ExcluirContatos,
  deletarContato,
  verificarContatoExistente
} = require('./database');

function delay(t, v) {
  return new Promise(function (resolve) {
    setTimeout(resolve.bind(null, v), t)
  });
}

// Middleware para verificar a autenticação
let usuarioAutenticado = false;
function verificarAutenticacao(req, res, next) {

  // console.log("")
  // console.log("USUARIO AUTENTICADO ? !!!!!!!!!!!!!!!!!!!")
  // console.log(usuarioAutenticado)
  // console.log("")

  if (usuarioAutenticado) {
    usuarioAutenticado = false;
    next();
  }
  else {
    res.redirect('/'); // Redireciona o usuário para a página de login
  }

}

// Rota para servir a página home.html
app.get('/home.html', verificarAutenticacao, (req, res) => {
  res.sendFile(path.join(__dirname, './pages/home.html')); // Use path.join para construir o caminho correto
});


app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
app.use(fileUpload({
  debug: true
}));

// Aqui eu digo que eu quero que o diretório usado seja o atual (server/api.js) menos 1 nivel.
// e depois inicie dentro da pasta client
app.use("/", express.static(path.join(__dirname, "/")))

app.use(express.static('public'));
// Diretório que a API (node) esta '/'
// o res.sendFile é pra qual diretório queremos ir, partindo do raiz que a API (node) está.
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, './pages/index.html'));
});


app.post('/api/getClient', [
  body('email').notEmpty(),
  body('senha').notEmpty()
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }
  const { email, senha } = req.body; // Obtendo o ID do corpo da requisição
  try {

    console.log("EMAIL")
    console.log(email)
    console.log("SENHA")
    console.log(senha)

    const authorize = await getClient(email, senha); // Função em database.js para obter o cliente
    // console.log("CLIENT !!!!!")
    // console.log(authorize)
    usuarioAutenticado = true;

    res.status(200).json({ redirect: '/home.html', authorization: authorize });

    //return res.redirect('/home.html'); // Redirecionando para a rota desejada
    //return res.redirect('/home.html');
  } catch (error) {
    console.error('Erro ao obter cliente:', error);
    res.status(500).json({ error: 'Erro ao obter cliente' });
  }
});

app.post('/api/StatusConexao', [
  body('status').notEmpty(),
  body('authorize').notEmpty()
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }

  const { status, authorize } = req.body; // Obtendo o ID do corpo da requisição

  // console.log("status")
  // console.log(status)
  // console.log("")

  // console.log("clientId")
  // console.log(authorize)
  // console.log("")

  try {
    setAutentication(status, authorize); // Função em database.js para obter o cliente
  } catch (error) {
    console.error('Erro ao obter cliente:', error);
    res.status(500).json({ error: 'Erro ao obter cliente' });
  }

});

app.post('/api/PostContatos', [
  body('authorize').notEmpty(),
  body('contato').notEmpty()
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }

  const { authorize, contato } = req.body; // Obtendo o ID do corpo da requisição

  try {
    let retorno = await adicionarContatos(authorize, 'Nome Contato', contato); // Função em database.js para obter o cliente
    res.send(retorno);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao adicionar contato' });
  }

});

app.post('/api/BuscarContatos', [
  body('authorize').notEmpty()
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }

  const { authorize } = req.body; // Obtendo o ID do corpo da requisição

  console.log("CLIENT -----")
  console.log(authorize)

  try {
    let retorno = await buscarContatos(authorize);
    res.json(retorno);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao adicionar contato' });
  }

});

app.post('/api/ExcluirContatos', [
  body('authorize').notEmpty()
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }

  const { authorize } = req.body; // Obtendo o ID do corpo da requisição

  try {
    let retorno = await ExcluirContatos(authorize);
    res.send(retorno);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao adicionar contato' });
  }

});

app.post('/api/DeletarContato', [
  body('authorize').notEmpty(),
  body('contato').notEmpty()
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }

  const { authorize, contato } = req.body; // Obtendo o ID do corpo da requisição

  try {
    let retorno = await deletarContato(authorize, contato);
    res.send(retorno);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao adicionar contato' });
  }

});

app.post('/api/VerificarContato', [
  body('authorize').notEmpty(),
  body('contato').notEmpty()
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }

  const { authorize, contato } = req.body; // Obtendo o ID do corpo da requisição

  try {
    let retorno = await verificarContatoExistente(authorize, contato); // Função em database.js para obter o cliente
    res.send(retorno);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao tentar obter informações de contatos' });
  }

});


app.post('/api/GetImage', upload.any('file'), async (req, res) => {
  const errors = validationResult(req).formatWith(({ msg }) => msg);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }

  const { authorize, file } = req.body;
  try {

    const form = new FormData();
    form.append('image', file);
    const apiKey = 'd59f919486dae71c914c72721579be2c';

    const retorno = await axios.post(`https://api.imgbb.com/1/upload?key=${apiKey}`, form, {
      headers: form.getHeaders()
    });

    const url = retorno.data.data.url; // Aqui acessamos o URL na resposta do Axios
    res.json({ url });

  } catch (error) {
    console.error('Erro ao tentar fazer o upload da imagem:', error);
    res.status(500).json({ error: 'Erro ao tentar fazer o upload da imagem' });
  }



  //CÓDIGO QUE ESTAVA NO CLIENT

  // Substitua isso pela sua chave de API do ImgBB
  // const apiKey = 'd59f919486dae71c914c72721579be2c';

  // // Faça a solicitação para a API do ImgBB
  // const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
  //     method: 'POST',
  //     body: new URLSearchParams({
  //         image: base64
  //     })
  // });

  // // Obtenha a resposta em JSON
  // const data = await response.json();

  // // Imprima a URL da imagem
  // //console.log(data.data.url);
  // imagem.src = data.data.url;


});


// Excluir .wwebjs_auth
// if (fs.existsSync(authPath)) {
//   fs.unlinkSync(authPath);
// }

// // Excluir .wwebjs_cache
// if (fs.existsSync(cachePath)) {
//   fs.unlinkSync(cachePath);
// }
io.on('connection', function (socket) {
  //socket.emit('qr', './images/back3.gif');

  socket.on('createSession', async (data) => {
    socket.emit('message', '© Infinity - Iniciado');
    socket.emit('qr', './images/back.gif');
    const { authorize } = data;

    // console.log("")
    // console.log("CLIENT ID")
    // console.log(authorize)
    // console.log("")

    const wwebVersion = '2.2407.3';

    const client = new Client({
      authStrategy: new LocalAuth({ clientId: authorize }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process', // <- this one doesn't works in Windows
          '--disable-gpu'
        ]
      },
      webVersionCache: {
        type: 'remote',
        remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/${wwebVersion}.html`,
    }
    });

    client.initialize();

    client.on('qr', (qr) => {
      console.log('QR RECEIVED', qr);
      qrcode.toDataURL(qr, (err, url) => {
        socket.emit('qr', url);
        socket.emit('message', '© Infinity QRCode recebido, aponte a câmera do seu celular!');
      });
    });

    client.on('ready', () => {
      socket.emit('ready', '© Infinity Dispositivo pronto!');
      socket.emit('message', '© Infinity Dispositivo pronto!');
      socket.emit('qr', './images/check.svg')
      console.log('© Infinity Dispositivo pronto');
    });

    client.on('authenticated', () => {
      socket.emit('authenticated', '© Infinity Autenticado!');
      socket.emit('message', '© Infinity Autenticado!');
      console.log('© Infinity Autenticado');
    });

    // Evento de desconexão durante a autenticação
    client.on('disconnected', (reason) => {
      setTimeout(() => {
        console.log('Desconectado:', reason);
        socket.emit('authentication_failure', { message: 'Falha na autenticação' });
        client.initialize();
      }, 10000); // Ajuste o tempo de atraso conforme necessário
    });

    //const clientId = client.options.authStrategy.clientId;
    Functions(client, authorize)

  });
});

const Functions = (client, authorize) => {

  // Send message
  app.post('/sendMessage', [
    body('number').notEmpty(),
    body('message').notEmpty()
  ], async (req, res) => {
    const errors = validationResult(req).formatWith(({
      msg
    }) => {
      return msg;
    });

    if (!errors.isEmpty()) {
      return res.status(422).json({
        status: false,
        message: errors.mapped()
      });
    }

    const number = req.body.number;
    const numberDDI = number.substr(0, 2);
    const numberDDD = number.substr(2, 2);
    const numberUser = number.substr(-8, 8);
    const message = req.body.message;

    if (numberDDI !== "55") {
      const numberZDG = number + "@c.us";
      client.sendMessage(numberZDG, message).then(response => {
        res.status(200).json({
          status: true,
          message: 'Mensagem enviada com sucesso',
          response: response
        });
      }).catch(err => {
        res.status(500).json({
          status: false,
          message: 'Erro ao enviar mensagem',
          response: err.text
        });
      });
    }
    else if (numberDDI === "55" && parseInt(numberDDD) <= 30) {
      const numberZDG = "55" + numberDDD + "9" + numberUser + "@c.us";
      client.sendMessage(numberZDG, message).then(response => {
        res.status(200).json({
          status: true,
          message: 'Mensagem enviada com sucesso',
          response: response
        });
      }).catch(err => {
        res.status(500).json({
          status: false,
          message: 'Erro ao enviar mensagem',
          response: err.text
        });
      });
    }
    else if (numberDDI === "55" && parseInt(numberDDD) > 30) {
      const numberZDG = "55" + numberDDD + numberUser + "@c.us";
      client.sendMessage(numberZDG, message).then(response => {
        res.status(200).json({
          status: true,
          message: 'Mensagem enviada com sucesso',
          response: response
        });
      }).catch(err => {
        res.status(500).json({
          status: false,
          message: 'Erro ao enviar mensagem',
          response: err.text
        });
      });
    }
  });

  // Send media
  app.post('/sendMedia', [
    body('number').notEmpty(),
    body('caption').notEmpty(),
    body('file').notEmpty(),
  ], async (req, res) => {
    const errors = validationResult(req).formatWith(({
      msg
    }) => {
      return msg;
    });

    if (!errors.isEmpty()) {
      return res.status(422).json({
        status: false,
        message: errors.mapped()
      });
    }

    const number = req.body.number;
    const numberDDI = number.substr(0, 2);
    const numberDDD = number.substr(2, 2);
    const numberUser = number.substr(-8, 8);
    const caption = req.body.caption;
    const fileUrl = req.body.file;

    let mimetype;
    const attachment = await axios.get(fileUrl, {
      responseType: 'arraybuffer'
    }).then(response => {
      mimetype = response.headers['content-type'];
      return response.data.toString('base64');
    });

    const media = new MessageMedia(mimetype, attachment, 'Media');

    if (numberDDI !== "55") {
      const numberZDG = number + "@c.us";
      client.sendMessage(numberZDG, media, { caption: caption }).then(response => {
        res.status(200).json({
          status: true,
          message: 'Mensagem enviada com sucesso',
          response: response
        });
      }).catch(err => {
        res.status(500).json({
          status: false,
          message: 'Erro ao enviar mensagem',
          response: err.text
        });
      });
    }
    else if (numberDDI === "55" && parseInt(numberDDD) <= 30) {
      const numberZDG = "55" + numberDDD + "9" + numberUser + "@c.us";
      client.sendMessage(numberZDG, media, { caption: caption }).then(response => {
        res.status(200).json({
          status: true,
          message: 'Mensagem enviada com sucesso',
          response: response
        });
      }).catch(err => {
        res.status(500).json({
          status: false,
          message: 'Erro ao enviar mensagem',
          response: err.text
        });
      });
    }
    else if (numberDDI === "55" && parseInt(numberDDD) > 30) {
      const numberZDG = "55" + numberDDD + numberUser + "@c.us";
      client.sendMessage(numberZDG, media, { caption: caption }).then(response => {
        res.status(200).json({
          status: true,
          message: 'Mensagem enviada com sucesso',
          response: response
        });
      }).catch(err => {
        res.status(500).json({
          status: false,
          message: 'Erro ao enviar mensagem',
          response: err.text
        });
      });
    }
  });


  app.post('/listGroups', [
    body('authorize').notEmpty()
  ], async (req, res) => {
    const errors = validationResult(req).formatWith(({
      msg
    }) => {
      return msg;
    });

    if (!errors.isEmpty()) {
      return res.status(422).json({
        status: false,
        message: errors.mapped()
      });
    }

    try {

      // console.log("")
      // console.log("")
      // console.log("")
      // console.log("ESTRAINDO GRUPOS !!!!!")
      // console.log("")
      // console.log("")
      

      const { authorize } = req.body

      let groups = await client.getChats()

      let grupos = []

      groups.forEach(group => {
        if (group.isGroup) {
          //console.log(`Nome: ${group.name}, ID: ${group.id._serialized}`);
          grupos.push({
            nome: group.name,
            id: group.id._serialized
          });
        }
      });

      // console.log("")
      // console.log("")
      // console.log("")
      // console.log(grupos)
      // console.log("")
      // console.log("")

      //console.log('Lista de grupos:', grupos);
      res.json({ grupos });
    }
    catch (err) {
      res.status(500).json({
        status: false,
        message: 'Erro ao extrair lista de grupos',
        response: err.text
      });
    }
  });


  app.post('/listContactsByGroupId', [
    body('authorize').notEmpty(),
    body('groupId').notEmpty()
  ], async (req, res) => {
    const errors = validationResult(req).formatWith(({
      msg
    }) => {
      return msg;
    });

    if (!errors.isEmpty()) {
      return res.status(422).json({
        status: false,
        message: errors.mapped()
      });
    }

    try {

      const { authorize, groupId } = req.body

      let contacts = await client.getChatById(groupId)

      let total = 0;

      //aguarda cada chamada assíncrona dentro do loop antes de prosseguir
      for (const participant of contacts.participants) {
        let numero = participant.id.user.slice(2);

        if (numero.length == 10)
          numero = numero.slice(0, 2) + "9" + numero.slice(2);

        let contatoExiste = await verificarContatoExistente(authorize, numero);

        if (!contatoExiste) {
          let retornoAdicionar = await adicionarContatos(authorize, "", numero);

          if (typeof retornoAdicionar === 'boolean' && retornoAdicionar === true) {
            total++;
            //console.log("ENTROU !!!!!!!!!!!!");
          }
        }
      }

      console.log('Total:', total);
      res.json({ total });
    }
    catch (err) {
      res.status(500).json({
        status: false,
        message: 'Erro ao extrair lista de contatos de grupos',
        response: err.text
      });
    }
  });


  let botActivated = false;
  client.on('message', async msg => {

    let contato = await msg.getContact();
    let numero = contato.number.slice(2);
    let nome = contato.pushname;

    const nomeContato = msg._data.notifyName;
    let chat = await msg.getChat();

    if (chat.isGroup) return null;

    if (msg.type.toLowerCase() == "e2e_notification") return null;

    if (msg.body == "") return null;

    if (msg.from.includes("@g.us")) return null;

    //Se o contato enviou uma mensagem, e ele não existe no banco de dados, eu adiciono ele.
    let contatoExiste = await verificarContatoExistente(authorize, numero);
    if (!contatoExiste) {
      let retornoAdicionar = await adicionarContatos(authorize, nome, numero);
    }


    if (msg.body !== null && !botActivated) {

      msg.reply(`Olá ${nomeContato}, bem vindo(a) ao Pontes marmitaria, aproveite nosso delicioso cardápio.`);

      const foto = MessageMedia.fromFilePath('../client/images/marmitas.jpg');
      client.sendMessage(msg.from, foto);
      delay(3000).then(async function () {
        try {
          msg.reply(`Oque gostaria de pedir hoje 😋 ?`);
          botActivated = true;
        } catch (e) {
          console.log(e)
        }
      });
    }




    // if (msg.body !== null && msg.body === "1") {
    //   //msg.reply("*COMUNIDADE ZDG*\n\n🤪 _Usar o WPP de maneira manual é prejudicial a saúde_\r\n\r\nhttps://comunidadezdg.com.br/ \r\n\r\n⏱️ As inscrições estão *ABERTAS*\n\nAssista o vídeo abaixo e entenda porque tanta gente comum está economizando tempo e ganhando dinheiro explorando a API do WPP, mesmo sem saber nada de programação.\n\n📺 https://youtu.be/mr0BvO9quhw");
    //   msg.reply("Olá, Você apertou 1")
    // }

    // else if (msg.body !== null && msg.body === "2") {
    //   msg.reply("*" + nomeContato + "*, Olá Você apertou 2");
    // }

    // else if (msg.body !== null && msg.body === "3") {
    //   msg.reply("*" + nomeContato + "*, " + "Você apertou 3");
    // }

    // else if (msg.body !== null && msg.body === "4") {

    //  const contact = await msg.getContact();
    //   setTimeout(function () {
    //     msg.reply(`${nomeContato}` + ' Seu contato já foi encaminhado para um atendente, aguarde que em breve você será atendido(a).');
    //     client.sendMessage('5516993792295@c.us', 'Cliente: https://wa.me/' + `${contact.number}`);
    //     //client.sendMessage('5515998566622@c.us',`${contact.number}`);
    //   }, 1000 + Math.floor(Math.random() * 1000));

    // }

    // else if (msg.body !== null && msg.body === "4") {
    //   msg.reply("Você apertou 4");
    // }

    // else if (msg.body !== null && msg.body === "5") {
    //   msg.reply("*" + nomeContato + "*, " + "Você apertou 5");
    // }

    // else if (msg.body !== null && msg.body === "7") {
    //   msg.reply("*" + nomeContato + "*, " + ", Apertou 7");
    // }

    // else if (msg.body !== null && msg.body === "8") {
    //   msg.reply("😁 Hello, how are you doing?");
    // }

    // else if (msg.body !== null && msg.body === "9") {
    //   msg.reply("😁 Como exterminar las plagas ?");
    // }

    // else if (msg.body !== null || msg.body === "0" || msg.type === 'ptt' || msg.hasMedia) {
    //   msg.reply("*OPZ*\n\n🤪 Bem vindo ao Infinity.");
    //   const foto = MessageMedia.fromFilePath('../client/images/black_hat.png');
    //   client.sendMessage(msg.from, foto)
    //   delay(3000).then(async function () {
    //     try {
    //       const media = MessageMedia.fromFilePath('./comunidade.ogg');
    //       client.sendMessage(msg.from, media, { sendAudioAsVoice: true })
    //       //msg.reply(media, {sendAudioAsVoice: true});
    //     } catch (e) {
    //       console.log('audio off')
    //     }
    //   });
    //   delay(8000).then(async function () {
    //     const saudacaoes = ['Olá ' + nomeContato + ', tudo bem?', 'Oi ' + nomeContato + ', como vai você?', 'Opa ' + nomeContato + ', tudo certo?'];
    //     const saudacao = saudacaoes[Math.floor(Math.random() * saudacaoes.length)];
    //     msg.reply(saudacao + " Esse é um atendimento automático, e não é monitorado por um humano. Caso queira falar com um atendente, escolha a opção 4. \r\n\r\nEscolha uma das opções abaixo para iniciarmos a nossa conversa: \r\n\r\n*[ 1 ]* - Quero ver a resposta ao apertar 1. \r\n*[ 2 ]* - Gostaria de apertar o número 2 ? \r\n*[ 3 ]*- Agora teste apertar o número 3. \r\n*[ 4 ]- Gostaria de falar com um atendente ?* \r\n*[ 5 ]*- Quero apertar o número 5.\r\n*[ 6 ]*- Quero apertar 6.\r\n*[ 7 ]*- Gostaria de mais informações ? \r\n*[ 8 ]*- In *ENGLISH* please! \r\n*[ 9 ]*- En *ESPAÑOL* por favor.");
    //   });

    // }
  });

}


server.listen(port, function () {
  console.log('Aplicação rodando na porta *: ' + port + ' . Acesse no link: http://localhost:' + port);
});
