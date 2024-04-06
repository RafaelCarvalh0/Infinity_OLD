$(document).ready(function () {

    let authorize = sessionStorage.getItem('authorize');

    let mensagem = document.querySelector("#text-msg");
    let closeButton = document.querySelector("#delmsg");

    GetContatos();
    let storedMessage = localStorage.getItem('message');

    if (storedMessage != null) {
        closeButton.style.display = 'flex'
    }

    mensagem.innerText = storedMessage;

    var socket = io();

    socket.emit('createSession', { authorize: authorize });

    socket.on('message', function (msg) {
        $('.logs').append($('<li>').text(msg));
    });

    socket.on('qr', function (src) {
        $('#qrcode').attr('src', src);
        $('#qrcode').show();
    });

    socket.on('ready', function (data) {
        console.log("READY ?")
        $('#qrcode').hide();
        UsuarioAutenticado(1);
    });

    socket.on('authenticated', function (data) {
        console.log("Authenticated ?")
        $('#qrcode').hide();
    });

    socket.on('authentication_failure', (data) => {
        console.log("Desconectado ____________ CLIENT", data); // 'Falha na autenticação'
        UsuarioAutenticado(0);
    });

    // window.addEventListener('beforeunload', () => {

    //     const qrCodeImg = document.getElementById('qrcode');
    //     const src = qrCodeImg.getAttribute('src');

    //     if (src !== "./images/back.gif")
    //         socket.emit('disconnectFromServer'); // Emitir um evento para desconectar do servidor antes de atualizar a página 
        
    // });

    // // Reconectar automaticamente em caso de desconexão
    // socket.on('disconnect', () => {
    //     console.log('Desconectado do servidor.');
    //     //setTimeout(connectToSocket, 3000); // Tentar reconectar após 3 segundos
    // });


});

Initializers();

const UsuarioAutenticado = (status) => {

    let authorize = sessionStorage.getItem('authorize');

    let request = {
        status: status,
        authorize: authorize
    };

    $.ajax({
        url: `${url.local}/api/StatusConexao`,
        type: 'post',
        data: request,
        beforeSend: function () {
            $("#resultado").html("ENVIANDO...");
        }
    }).done(function (msg) {

        // //console.log(msg)

        // if (msg !== undefined) {
        //     // sessionStorage.setItem('authorize', msg);
        //     // window.location.href = "home.html";
        // }
        // else {
        //     document.getElementById('erro-login').textContent = 'Login ou senha inválidos!';
        // }
        // //window.location.href = "home.html?data=" + msg.clientId;

    }).fail(function (jqXHR, textStatus, msg) {

        console.log(textStatus)
        console.log(msg)

    });
}

// function VisualizarImagem() {

//   let urlImagem = document.querySelector("#img-path").value
//   let imagem = document.querySelector("#img-preview")

//   if (urlImagem != "") {

//     const padrao = /(http(s?):)([/|.|\w|\s|-])*\.(?:jpg|gif|png|webp)/g;
//     let resultado = padrao.test(urlImagem);

//     console.log("É um link com uma extensão (jpg, png, gif ou webb) ? ", resultado)

//     if (!resultado) {

//       console.log("Chamou a API do Flickr")

//       let proxyUrl = 'https://api.allorigins.win/get?url=';
//       fetch(`${proxyUrl}${encodeURIComponent(urlImagem)}`)
//         .then(response => response.json())
//         .then(data => {
//           console.log(data)
//           let parser = new DOMParser();
//           let doc = parser.parseFromString(data.contents, 'text/html');
//           let img = doc.querySelector('img');
//           imagem.src = img.src;
//         })
//         .catch((error) => {
//           console.error('Erro:', error);
//         });

//     }
//     else {
//       console.log("Passou a URL Diretamente para a tag <img>")
//       imagem.src = urlImagem;

//     }

//   }


//   // PostImages
//   // fetch(`${proxyUrl}${encodeURIComponent(urlImagem)}`)
//   // .then(response => response.json())
//   // .then(data => {
//   //     console.log(data)
//   //     console.log(data.status.url)
//   //     imagem.src = data.status.url;
//   // })
//   // .catch((error) => {
//   //   console.error('Erro:', error);
//   // });

//   // Flickr


//   // Proxy Herokuapp
//   // let proxyUrl = 'https://cors-anywhere.herokuapp.com/',
//   //   targetUrl = nomeImagem
//   // fetch(proxyUrl + targetUrl)
//   //   .then(response => response.text())
//   //   .then(data => {
//   //     let parser = new DOMParser();
//   //     let doc = parser.parseFromString(data, 'text/html');
//   //     let img = doc.querySelector('img');
//   //     imagem.src = img.src;
//   //   })
//   //   .catch((error) => {
//   //     console.error('Erro:', error);
//   //   });

//   // Este trecho trata pelo EMBED ou BBCode da imagem selecionada
//   // const regex = /<img.*?src="(.*?)"/;
//   // const match = nomeImagem.match(regex);
//   // let imageURL;

//   // if (match != null) {
//   //   imageURL = match[1];
//   // }
//   // else {
//   //   var startTag = "[img]";
//   //   var endTag = "[/img]";
//   //   var startIndex = nomeImagem.toUpperCase().indexOf(startTag.toUpperCase()) + startTag.length;
//   //   var endIndex = nomeImagem.toUpperCase().indexOf(endTag.toUpperCase());
//   //   imageURL = nomeImagem.substring(startIndex, endIndex);
//   //   console.log(imageURL);
//   // }

//   // console.log("IMAGEM URL")
//   // console.log(imageURL)

//   // if (imagem != "") {
//   //   imagem.src = imageURL
//   // }
// }

const VerContatos = async () => {

    let exibirContatos = document.querySelector("#saved-numbers");
    let contatos = await GetContatos();
    let campoFormatado = '';

    for (let i = 0; i < contatos.length; i++) {

        let contato = contatos[i].numero.toString().replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        //let contato = numero.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        campoFormatado += `<span class="rounded-numbers" onclick="ExcluirNumero(event)">${contato} <span class="excluir-contato" title="Excluir Número" style="color: #DC3545; font-weight: bold; cursor: pointer; padding: 0px 3px 0px 3px;">X</span></span>`;

    }

    exibirContatos.innerHTML = campoFormatado;
    let modal = document.querySelector("#modal");
    let fade = document.querySelector("#fade");
    modal.classList.toggle("hide");
    fade.classList.toggle("hide");

}

const VerGrupos = async () => {

    let contatosExtraidos = document.querySelector("#contatos-extraidos");
    contatosExtraidos.classList.remove("total-show");
    contatosExtraidos.classList.add("total-hide");

    let exibirGrupos = document.querySelector("#groups");
    let grupos = await GetGrupos();
    let grupo = '';

    for (let i = 0; i < grupos.length; i++) {
        var groupId = `'${grupos[i].id.toString()}'`;
        var groupName = `'${grupos[i].nome.toString()}'`;
        var link = `<a id="group-itens" title="Exportar Contato" style="color: #28A745; margin-left: auto; font-weight: bold; cursor: pointer; padding: 0px 3px 0px 3px;" onclick="ExtrairGrupo(${groupId}, ${groupName})"> Extrair </a>`;
        grupo += `<div class="rounded-groups">${grupos[i].nome} ${link} </div>`;
    }

    exibirGrupos.innerHTML = grupo
    let modal2 = document.querySelector("#modal2");
    let fade2 = document.querySelector("#fade2");
    modal2.classList.toggle("hide");
    fade2.classList.toggle("hide");

}

const ExtrairGrupo = async (groupId, groupName) => {

    return new Promise((resolve, reject) => {
        let contatosExtraidos = document.querySelector("#contatos-extraidos");
        let authorize = sessionStorage.getItem('authorize');

        let request = {
            authorize: authorize,
            groupId: groupId
        };

        contatosExtraidos.classList.remove("total-hide");
        contatosExtraidos.classList.add("total-show");

        $.ajax({
            url: `${url.local}/listContactsByGroupId`,
            type: 'post',
            data: request,
            beforeSend: function () {
                //contatosExtraidos.innerHTML = `Contatos Extraídos (0)`;
            }
        }).done(async function (msg) {
            if (msg.total > 0) {
                contatosExtraidos.style.color = '#17A2B8';
                contatosExtraidos.innerHTML = `${msg.total} Contatos Extraídos de ${groupName}`;
                await GetContatos();
            }
            else {
                contatosExtraidos.style.color = '#FFC107';
                contatosExtraidos.innerHTML = `Todos os Contatos de ${groupName} já foram extraídos !`;
            }
            resolve(msg.total);
        }).fail(function (jqXHR, textStatus, msg) {
            contatosExtraidos.innerHTML = `Erro ao extrair contatos!`;
            console.log(msg)
            reject(msg);
        });
    });

}

const SalvarContato = async (numeroXlsx) => {

    let authorize = sessionStorage.getItem('authorize');
    let numero;

    if (numeroXlsx === undefined) {
        numero = document.querySelector("#numeros").value.replace(/\(|\)|\s|-/g, "");
    }
    else {
        numero = numeroXlsx;
    }

    if (numero.length == 0) {
        alert("Digite o número do celular que deseja salvar!")
        document.querySelector("#numeros").focus();
        return;
    }

    else if (numero.length != 11) {
        alert("Número inválido, por favor confira!")
        return;
    }

    console.log("Numero !!!!")
    console.log(numero)

    let numeroExiste = await VerificarContato(numero);

    console.log("")
    console.log("Numero existe ???????????????")
    console.log(numeroXlsx)
    console.log("")

    if (numeroExiste && numeroXlsx === undefined) {
        alert(`${numero} já está na sua lista!`);
        return;
    }

    let request = {
        authorize: authorize,
        contato: numero
    };

    $.ajax({
        url: `${url.local}/api/PostContatos`,
        type: 'post',
        data: request,
        beforeSend: function () {
            $("#resultado").html("ENVIANDO...");
        }
    }).done(function (msg) {
        if (msg) {
            console.log("Contato Adicionado com sucesso!")
            document.querySelector("#numeros").value = '';
        }
    }).fail(function (jqXHR, textStatus, msg) {
        console.log("Erro ao adicionar contato!")
        console.log(msg)
    });

    GetContatos();
}

const VerificarContato = async (numero) => {
    return new Promise((resolve, reject) => {
        let authorize = sessionStorage.getItem('authorize');
        let request = {
            authorize: authorize,
            contato: numero
        };
        $.ajax({
            url: `${url.local}/api/VerificarContato`,
            type: 'post',
            data: request,
            beforeSend: function () {
                $("#resultado").html("ENVIANDO...");
            }
        }).done(function (msg) {
            //console.log("MSG !!!!!!!!!!!!!!!!!! ", msg)
            resolve(msg);
        }).fail(function (jqXHR, textStatus, msg) {

            console.log("Erro ao adicionar contato!")
            console.log(msg)
            reject(msg);
        });
    });
}

const ExcluirContatos = async () => {

    if (document.querySelector("#saved-numbers").innerHTML.length <= 0) {
        return;
    }

    var confirmacao = confirm("Tem certeza que deseja excluir todos os contatos?");

    if (confirmacao) {

        return new Promise((resolve, reject) => {
            let authorize = sessionStorage.getItem('authorize');

            let request = {
                authorize: authorize
            };

            $.ajax({
                url: `${url.local}/api/ExcluirContatos`,
                type: 'post',
                data: request,
                beforeSend: function () {
                    $("#resultado").html("ENVIANDO...");
                }
            }).done(async function (msg) {
                if (msg) {
                    document.querySelector("#saved-numbers").innerHTML = '';
                    await GetContatos();
                    resolve(msg);
                }
            }).fail(function (jqXHR, textStatus, msg) {
                console.log("Erro ao Excluir contatos!")
                console.log(msg)
                reject(msg);
            });
        });
    }

}

const ExcluirNumero = async (e) => {

    if (e.target.classList.contains('excluir-contato')) {
        let numero = e.target.parentNode.textContent.trim().replace("X", "").replace(/\s+/g, "").replace(/\(|\)|\s|-/g, "");

        let contatoExcluido = await DeleteContato(numero);

        if (contatoExcluido) {
            e.target.closest('.rounded-numbers').remove();
            await GetContatos();
        }

    } else {

    }
}

const GetContatos = async () => {
    return new Promise((resolve, reject) => {
        let authorize = sessionStorage.getItem('authorize');

        let request = {
            authorize: authorize
        };

        $.ajax({
            url: `${url.local}/api/BuscarContatos`,
            type: 'post',
            data: request,
            beforeSend: function () {
                $("#resultado").html("ENVIANDO...");
            }
        }).done(function (msg) {

            console.log("")
            console.log("MSG !!!!!!!!!!!!!!!!!!!!!!!!!")
            console.log(msg)
            console.log("")
            console.log("")

            if (msg) {
                document.querySelector("#contatos").innerText = `Contatos salvos (${msg.length})`;
                resolve(msg);
            }
        }).fail(function (jqXHR, textStatus, msg) {
            console.log("Erro ao adicionar contato!")
            console.log(msg)
            reject(msg);
        });
    });
}

const GetGrupos = async () => {
    return new Promise((resolve, reject) => {
        let btnGrupos = document.querySelector("#link-grupos");
        let spinner = document.querySelector(".spinner");
        let authorize = sessionStorage.getItem('authorize');

        let request = {
            authorize: authorize
        };

        $.ajax({
            url: `${url.local}/listGroups`,
            type: 'post',
            data: request,
            beforeSend: function () {
                spinner.classList.remove("total-hide");
                spinner.classList.add("total-show");
                btnGrupos.style.cursor = 'auto'
                btnGrupos.disabled = true;
                btnGrupos.append(spinner)
            }
        }).done(function (msg) {
            if (msg) {
                spinner.classList.remove("total-show");
                spinner.classList.add("total-hide");
                btnGrupos.style.cursor = 'pointer'
                btnGrupos.disabled = false;
                resolve(msg.grupos);
            }
        }).fail(function (jqXHR, textStatus, msg) {
            console.log("Erro ao listar grupos!")
            console.log(msg)
            spinner.classList.remove("total-show");
            spinner.classList.add("total-hide");
            btnGrupos.style.cursor = 'pointer'
            btnGrupos.disabled = false;
            reject(msg);
        });
    });
}

const DeleteContato = async (numero) => {
    return new Promise((resolve, reject) => {
        let authorize = sessionStorage.getItem('authorize');

        let request = {
            authorize: authorize,
            contato: numero
        };

        $.ajax({
            url: `${url.local}/api/DeletarContato`,
            type: 'post',
            data: request,
            beforeSend: function () {
                $("#resultado").html("ENVIANDO...");
            }
        }).done(function (msg) {
            if (msg) {
                console.log("Retorno de Deletar um contato")
                console.log(msg)
                resolve(msg);
            }
        }).fail(function (jqXHR, textStatus, msg) {
            console.log("Erro ao exluir contato!")
            console.log(msg)
            reject(msg);
        });
    });
}

function SalvarMensagem(mensagem) {
    // console.log("Tamanho")
    // console.log(mensagem.length)
    localStorage.setItem('message', mensagem);
    document.querySelector("#delmsg").style.display = 'flex';
}

function ExcluirMensagem() {
    localStorage.removeItem("message");
    document.querySelector("#delmsg").style.display = 'none';
    document.querySelector("#text-msg").value = '';
}

const EnviarMensagem = async () => {
    let mensagem = document.querySelector("#text-msg").value

    if (mensagem === "") {
        alert("Você deve inserir uma mensagem!");
        return;
    }

    const contatos = await GetContatos();

    var confirmacao = confirm(`Confirmar disparo de mensagem para ${contatos.length} pessoas?`);

    if (confirmacao) {

        let mensagensEnviadas = 1;
        let mensagensRejeitadas = 1;


        let campoStatusEnviado = document.querySelector("#status-envio-aceito")
        let campoStatusRejeitado = document.querySelector("#status-envio-rejeitado")
        campoStatusRejeitado.innerText = '';
        campoStatusEnviado.innerText = '';

        //console.log(numbers);
        SalvarMensagem(mensagem);

        console.log("")
        console.log("CONTATOS")
        console.log(contatos)
        console.log("")

        for (let x = 0; x < contatos.length; x++) {

            let numero = contatos[x].numero.toString().replace(/[\(\)\s\-]/g, '');
            let request = {
                number: `55${numero}`,
                message: mensagem
            };

            console.log("Request" + x)
            // console.log(request)

            $.ajax({
                url: `${url.local}/sendMessage`,
                type: 'post',
                data: request,
                beforeSend: function () {
                    $("#resultado").html("ENVIANDO...");
                }
            }).done(function (msg) {

                campoStatusEnviado.innerText = `✅ ${msg.message} (${mensagensEnviadas++})`;

            }).fail(function (jqXHR, textStatus, msg) {

                campoStatusRejeitado.innerText = `❌ Erro no envio da mensagem (${mensagensRejeitadas++})`;

            });

        }
    }
}

const EnviarMensagemMedia = async () => {

    let imagem = document.querySelector("#img-preview").src;
    let mensagem = document.querySelector("#text-msg").value;

    console.log("Imagem")
    console.log(imagem)

    if (imagem == 'http://localhost:8000/home.html') {
        alert("Você deve selecionar uma imagem!");
        return;
    }
    else if (mensagem === "") {
        alert("Você deve inserir uma mensagem!");
        return;
    }

    const contatos = await GetContatos();

    var confirmacao = confirm(`Confirmar disparo de mensagem para ${contatos.length} pessoas?`);

    if (confirmacao) {

        let mensagensEnviadas = 1;
        let mensagensRejeitadas = 1;

        let campoStatusEnviado = document.querySelector("#status-envio-aceito")
        let campoStatusRejeitado = document.querySelector("#status-envio-rejeitado")
        campoStatusRejeitado.innerText = '';
        campoStatusEnviado.innerText = '';

        SalvarMensagem(mensagem);

        for (let x = 0; x < contatos.length; x++) {

            let numero = contatos[x].numero.toString().replace(/[\(\)\s\-]/g, '');
            let request = {
                number: `55${numero}`,
                file: imagem,
                caption: mensagem
            };

            console.log("Request" + x)

            //await delay(500); // Atrasa a chamada

            console.log("Disparo" + x)

            $.ajax({
                url: `${url.local}/sendMedia`,
                type: 'post',
                data: request,
                beforeSend: function () {
                    $("#status-envio").html("ENVIANDO...");
                }
            }).done(function (msg) {

                campoStatusEnviado.innerText = `✅ ${msg.message} (${mensagensEnviadas++})`;

            }).fail(function (jqXHR, textStatus, msg) {

                campoStatusRejeitado.innerText = `❌ Erro no envio da mensagem (${mensagensRejeitadas++})`;

            });
        }

    }

}

// Await Task.Delay();
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function Initializers() {

    document.getElementById("numeros").addEventListener("keyup", function (event) {

        if (event.key === "Enter") {
            SalvarContato();
        }
    });

    $("#numeros").mask("(00) 00000-0000");

    // Melhorar essa captura, pois esta genérica e pode causar bug
    $(".emojis").click(function () {
        var emoji = $(this).text();
        $('#text-msg').val($('#text-msg').val() + emoji);
    });


    document.querySelector("#custom-button-xlsx").addEventListener("click", function () {
        document.querySelector("#fileXlsx").click();
    });

    document.querySelector("#fileXlsx").addEventListener("change", function () {
        if (document.querySelector("#fileXlsx").value) {
            document.querySelector("#custom-text-xlsx").innerHTML = document.querySelector("#fileXlsx").value.split('\\').pop();;
        } else {
            //document.querySelector("#custom-text").innerHTML = "Nenhum arquivo escolhido, ainda.";
        }
    });

    document.querySelector("#custom-button").addEventListener("click", function () {
        document.querySelector("#file").click();
    });

    document.querySelector("#file").addEventListener("change", function () {
        if (document.querySelector("#file").value) {
            document.querySelector("#custom-text").innerHTML = document.querySelector("#file").value.split('\\').pop();;
        } else {
            //document.querySelector("#custom-text").innerHTML = "Nenhum arquivo escolhido, ainda.";
        }
    });

    // Chame a função para fazer upload da imagem
    //uploadImage();

    //////////////////////////////////// MODAL DE CONTATOS
    let closeModalButton = document.querySelector("#close-modal");
    let modal = document.querySelector("#modal");
    const fade = document.querySelector("#fade");


    [closeModalButton, fade].forEach((el) => {
        el.addEventListener("click", () => {
            modal.classList.toggle("hide");
            fade.classList.toggle("hide");
        })
    })

    /////////////////////////////////////// MODAL DE GRUPOS
    let closeModalButton2 = document.querySelector("#close-modal2");
    let modal2 = document.querySelector("#modal2");
    const fade2 = document.querySelector("#fade2");

    [closeModalButton2, fade2].forEach((el) => {
        el.addEventListener("click", () => {
            modal2.classList.toggle("hide");
            fade2.classList.toggle("hide");
        })
    })
}

const uploadXlsx = async () => {

    const fileInput = document.querySelector('#fileXlsx');
    const file = document.querySelector('#fileXlsx').files[0];

    // Verificar a extensão do arquivo
    if (!file.name.endsWith('.xlsx')) {
        alert('Erro: O arquivo selecionado não é um arquivo Excel (.xlsx)');
        return;
    }

    const reader = new FileReader();

    reader.onload = function (event) {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const lista = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            lista.forEach(async row => {
                const numero = row[0]; // Supondo que o número de celular esteja na primeira coluna
                console.log(typeof (numero));

                if (numero.toString().length == 11)
                    await SalvarContato(numero.toString());
            });

        });

        // Limpar o valor do input file
        fileInput.value = '';
    };

    reader.readAsArrayBuffer(file);
};

// Função para fazer upload da imagem

const uploadImage = async () => {
    let authorize = sessionStorage.getItem('authorize');
    let imagem = document.querySelector("#img-preview")
    // Substitua isso pelo caminho do arquivo de imagem
    const file = document.querySelector('#file').files[0];

    // Converta a imagem em base64
    const base64 = await new Promise((resolve, reject) => {

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);

    });

    let request = {
        authorize: authorize,
        file: base64
    };

    $.ajax({
        url: `${url.local}/api/getImage`,
        type: 'POST',
        data: request,
        success: function (data) {

            imagem.src = data.url;

        },
        error: function (error) {
            console.log("Erro imagem")
            console.log(error)
        }
    });
}
