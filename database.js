const express = require('express');
const { body, validationResult } = require('express-validator');
const app = express();
const bcrypt = require('bcrypt');
const saltRounds = 10;

const sqlite3 = require('sqlite3').verbose();
//const db = new sqlite3.Database('opz.sqlite');

const db = new sqlite3.Database('opz.sqlite', (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conexão bem-sucedida ao banco de dados SQLite');
    }
});

// const gerarHashSenha = async (senha) => {
//     try {
//         const hash = await bcrypt.hash(senha, saltRounds);
//         return hash;
//     } catch (error) {
//         console.error("Erro ao gerar hash da senha:", error);
//         throw error;
//     }
// }

// // Função para armazenar a senha no banco de dados
// const gravarSenha = async (senha) => {
//     try {
//         const hashSenha = await gerarHashSenha(senha);
//         // Aqui você faria a inserção no banco de dados SQLite
//         console.log("Senha gravada com sucesso:", hashSenha);
//     } catch (error) {
//         console.error("Erro ao gravar senha:", error);
//     }
// }

// // Chama a função para gravar a senha
// tester@usuario.com.br
// gravarSenha("betatester747");





//  db.serialize(() => {
//     db.run(`CREATE TABLE contatos (
//         id INTEGER PRIMARY KEY,
//         clientId INTEGER,
//         nome TEXT,
//         numero TEXT,
//         dataInclusao DATETIME DEFAULT (datetime('now','localtime')),
//         FOREIGN KEY (clientId) REFERENCES usuarios(clientId)
//     )`, (err) => {
//         if (err) {
//             console.error('Erro ao criar a tabela contatos:', err.message);
//         } else {
//             console.log('Tabela contatos criada com sucesso.');
//         }
//     });
//  });
// // Fecha a conexão com o banco de dados
//  db.close();


// Get ClientId User
const getClient = async (email, senha) => {
    return new Promise((resolve, reject) => {

        console.log("")
        console.log("")
        console.log("CHEGUEI AQUI !!!!!!!!!!!!!!!!!")
        console.log(email)
        console.log(senha)
        console.log("")
        console.log("")
        console.log("")

        db.get(`SELECT clientId, senha FROM usuarios WHERE email = ?`, [email], (err, row) => {
            if (err) {
                reject(err); // Rejeita a promessa em caso de erro
                return console.error(err.message);
            }

            bcrypt.compare(senha, row.senha, function (err, result) {
                if (err) {
                    reject(err); // Rejeita a promessa em caso de erro
                    return console.error(err.message);
                }

                if (result) {
                    resolve(row.clientId); // Resolve a promessa com o clientId se a senha estiver correta
                } else {
                    reject("Senha do usuário não confere!"); // Rejeita a promessa se a senha estiver incorreta
                    return console.error("Senha do usuário não confere!");
                }
            });
        });
    });
}

// Update Autentication user
const setAutentication = (status, clientId) => {
    return new Promise((resolve, reject) => {
        db.get(`UPDATE usuarios SET autenticado = ? where clientId = ?`, [status, clientId], (err, row) => {
            if (err) {
                reject(err); // Rejeita a promessa em caso de erro
                return console.error(err.message);
            }
            console.log(status == 1 ? "Usuário com QrCode autenticado" : "Usuário com QrCode Desvinculado");
            resolve(); // Resolve a promessa sem passar nenhum valor
        });
    });
}

// Adiciona contatos a listagem do cliente
const adicionarContatos = (clientId, nome, contato) => {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO contatos (clientId, nome, numero)
        SELECT ?, ?, ?
        WHERE NOT EXISTS (
            SELECT 1 FROM contatos WHERE numero = ? AND clientId = ?
        );`;
        db.run(sql, [clientId, nome, contato, contato, clientId], function(err) {
            if (err) {
                reject(err); // Rejeita a promessa em caso de erro
                return console.error(err.message);
            }
            if (this.changes === 0) {
                console.log("O contato já foi adicionado para o mesmo cliente.");
                resolve(false);
            } else {
                console.log("Contato adicionado com sucesso!");
                resolve(true); // Resolve a promessa sem passar nenhum valor
            }
        });
    });
}

const buscarContatos = async (clientId) => {
    return new Promise((resolve, reject) => {
        db.all(`SELECT numero FROM contatos WHERE clientId = ?`, [clientId], (err, row) => {
            if (err) {
                reject(err); // Rejeita a promessa em caso de erro
                return console.error(err.message);
            }
            resolve(row); 
        });
    });
}

const ExcluirContatos = (clientId) => {
    return new Promise((resolve, reject) => {
        const sql = `DELETE FROM contatos WHERE clientId = ?`;
        db.run(sql, [clientId], (err, row) => {
            if (err) {
                reject(err); // Rejeita a promessa em caso de erro
                return console.error(err.message);
            }
            console.log("Contatos Excluídos com sucesso!");
            resolve(true); // Resolve a promessa sem passar nenhum valor
        });
    });
}

const deletarContato = (clientId, contato) => {
    return new Promise((resolve, reject) => {
        const sql = `DELETE FROM contatos WHERE clientId = ? AND numero = ?`;
        db.run(sql, [clientId, contato], (err, row) => {
            if (err) {
                reject(err); // Rejeita a promessa em caso de erro
                return console.error(err.message);
            }
            console.log("Contato excluído com sucesso!");
            resolve(true); // Resolve a promessa sem passar nenhum valor
        });
    });
}

const verificarContatoExistente = (clientId, contato) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT COUNT(*) AS count FROM contatos WHERE clientId = ? AND numero = ?`;
        db.get(sql, [clientId, contato], (err, row) => {
            if (err) {
                reject(err); // Rejeita a promessa em caso de erro
                return console.error(err.message);
            }
            // resolve(row.count > 0); // Resolve a promessa com true se o contato existir, false caso contrário
            if (row.count > 0) {
                console.log("O contato já existe para o mesmo cliente.");
                resolve(true); // Contato já existe para o mesmo cliente, resolve com false
            } else {
                resolve(false); // Contato não existe para o mesmo cliente, resolve com true
            }
        });
    });
};

module.exports = { getClient, setAutentication, adicionarContatos, buscarContatos, ExcluirContatos, deletarContato, verificarContatoExistente };