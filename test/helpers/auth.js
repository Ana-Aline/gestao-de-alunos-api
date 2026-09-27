import request from 'supertest';
import 'dotenv/config';

const BASE_URL = process.env.BASE_URL;

let tokenEmCache = null;

export async function realizarLogin(email,senha) {
    const res = await request(BASE_URL)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send({ 
            email: email, 
            senha: senha
        });
    return `Bearer ${res.body.token}`;
}

//Função semântica para implementar o token em cache com segurança
export async function getTokenAdmin() {
    if(!tokenEmCache){
        tokenEmCache = await realizarLogin(process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD);
    }
    return tokenEmCache;
}
