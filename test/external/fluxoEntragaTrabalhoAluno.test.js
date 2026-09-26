import { expect } from 'chai';
import request from 'supertest';
import { getTokenAdmin, realizarLogin } from '../helpers/auth.js';
import { novoAluno } from '../factories/alunosFactory.js';
import { novaDisciplina } from '../factories/disciplinasFactory.js';
import mongoose from 'mongoose'

const BASE_URL = process.env.BASE_URL;

describe('Registrar Entrega de Trabalho como Aluno', () => {
    //reiniciar a conexão com o banco para limpar ele
    after(async () => {
        await mongoose.connection.close();
    });

    it.only('Validar o registro da entrega de um trabalho é realizado com sucesso por um aluno autenticado', async () => {
        //Arrange
        //cadastrar o aluno | cadastrar a disciplina | cadastrar aluno na disciplina | logar como aluno
        const aluno = novoAluno()
        const cadastrarAlunoResposta = await request(BASE_URL)
            .post('/api/admin/alunos')
            .set('Content-Type', 'application/json')
            .set('Authorization', await getTokenAdmin())
            .send(aluno);
        const alunoId = cadastrarAlunoResposta.body.id;

        console.log(cadastrarAlunoResposta.body);

        const cadastrarDisciplinaResposta = await request(BASE_URL)
            .post('/api/admin/disciplinas')
            .set('Content-Type', 'application/json')
            .set('Authorization', await getTokenAdmin())
            .send(novaDisciplina());
        const disciplinaId = cadastrarDisciplinaResposta.body.id;

        console.log(cadastrarDisciplinaResposta.body);

        const cadastroMatriculaResposta = await request(BASE_URL)
            .post(`/api/admin/disciplinas/${disciplinaId}/matriculas`)
            .set('Content-Type', 'application/json')
            .set('Authorization', await getTokenAdmin())
            .send({
                alunoId: alunoId
            });
        const matriculaId = cadastroMatriculaResposta.body.id;
        console.log(cadastroMatriculaResposta.body);

        //Act
        const cadastrarTrabalho = await request(BASE_URL)
            .post(`/api/alunos/${alunoId}/trabalhos`)
            .set('Content-Type', 'application/json')
            .set('Authorization', await realizarLogin(aluno.email, aluno.senha))
            .send({
                disciplinaId: disciplinaId,
                titulo: 'teste',
                descricao: 'teste'
            });
        const trabalhoId = cadastrarTrabalho.body.id
        console.log(cadastrarTrabalho.body);

        const consultarTrabalho = await request(BASE_URL)
            .get(`/api/admin/trabalhos/${trabalhoId}`)
            .set('Content-Type', 'application/json')
            .set('Authorization', await getTokenAdmin())

        //Assert
        expect(consultarTrabalho.status).to.equal(200);
        expect(consultarTrabalho.body.alunoId).to.equal(alunoId);
        expect(consultarTrabalho.body.disciplinaId).to.equal(disciplinaId);
        expect(consultarTrabalho.body.titulo).to.equal('teste');
        expect(consultarTrabalho.body.descricao).to.equal('teste');
        expect(consultarTrabalho.body.status).to.equal('entregue');
    })
});