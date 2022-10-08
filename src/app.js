const express = require('express');
const app = express()
const cors = require("cors");
const admin = require("firebase-admin");
require('dotenv').config()
// const serviceAccount = require("./credentials.json");

serviceAccount = {
    "type": "service_account",
    "project_id": process.env.PROJECT_ID,
    "private_key_id": process.env.PRIVATE_KEY_ID,
    "private_key": process.env.PRIVATE_KEY,
    "client_email": process.env.CLIENT_EMAIL,
    "client_id": process.env.CLIENT_ID,
    "auth_uri": process.env.AUTH_URI,
    "token_uri": process.env.TOKEN_URI,
    "auth_provider_x509_cert_url": process.env.AUTH_PROVIDER,
    "client_x509_cert_url": process.env.CLIENT_URL
  }
  

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

app.use(express.json());
app.use(cors());

const db = admin.firestore();

//Cria um novo usuário guardando suas informações no firebase
app.post('/create_user', async (req, res) => {
    const id = new Date();
    const userCode = String(id.getTime())
    const require = db.collection('users').doc(String(id.getTime()));
    try {
        await require.set({
            //PEGA OS VALORES VINDOS DA REQUISIÇÃO
            userCode: userCode,
            name: req.body.name,
            email: req.body.email,
            password: req.body.password
        });
        res.send(userCode)
    } catch {
        res.send(false)
    }
})

//Valida a existência do usuário antes de tentar criá-lo
app.post('/verify_user', async (req, res) => {
    const require = await db.collection('users').get();
    const email = req.body.email
    try {
        require.forEach((user) => {
            if (email == user.data().email) {
                res.send("exist")
            }
        })
        res.send("not_exist")
    } catch (err) {
        console.log(err)
    }
})

//Valida o e-mail e senha do usuário para login
app.post('/get_user_login', async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const require = await db.collection('users').get();

    let response = [];
    try {
        require.forEach((user) => {
            if (email == user.data().email && password == user.data().password) {
                response = [user.data().userCode, user.data().name]
            }
        })
    } catch (err) {
        res.send(err)
    } 
    if (response.length > 0)
        res.send(response)
    else
        res.send('not_exist')
})

//Cria um novo comentário guardando suas informações no firebase
app.post('/create_comment', async (req, res) => {
    const id = new Date();
    const commentCode = String(id.getTime())
    const require = db.collection('comments').doc(String(id.getTime()));
    try {
        await require.set({
            //PEGA OS VALORES VINDOS DA REQUISIÇÃO
            commentCode: commentCode,
            name: req.body.name,
            content: req.body.content,
            userCode: req.body.userCode
        });
        res.send(true)
    } catch {
        res.send(false)
    }
})

app.get('/comments_list', async (req, res) => {
    let comments = []
    const result = await db.collection('comments').get();

    try {
        result.forEach((comment) => {
            comments.push(comment.data())
        })
        res.send(comments)
    } catch (err) {
        res.send(err)
    }
})

app.delete('/delete_comment/:commentCode/:userCode', async (req, res) => {
    const commentCode = req.params.commentCode;
    const userCode = req.params.userCode;
    try {
        const comment = await db.collection('comments').doc(commentCode).get()
        if(comment.data().userCode == userCode){
            await db.collection('comments').doc(commentCode).delete()
            res.send('deleted')
        }else {
            res.send('Este comentário pertence a outro usuário')
        }
    } catch (err) {
        console.log(err)
    }
})

// //Para alterar informações do usuário do firebase
// app.put('/update_user', async (req, res) => {
//     const codUser = req.body.codUser;
//     try {
//         await db.collection('user').doc(codUser).update({
//             name: req.body.name,
//             email: req.body.email
//         });
//         res.send('updated')
//     } catch (err) {
//         console.log(err)
//     }
// })

// //Para deletar um usuário do firebase
// app.delete('/delete_user/:codUser', async (req, res) => {
//     const codUser = req.params.codUser;
//     try {
//         await db.collection('user').doc(codUser).delete()
//         res.send('deleted')
//     } catch (err) {
//         console.log(err)
//     }
// })

app.listen(process.env.PORT || 8000, console.log("running"));