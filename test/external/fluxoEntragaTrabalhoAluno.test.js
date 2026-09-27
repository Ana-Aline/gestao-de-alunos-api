import { expect } from 'chai';
import request from 'supertest';
import { getTokenAdmin, realizarLogin } from '../helpers/auth.js';
import { novoAluno } from '../factories/alunosFactory.js';
import { novaDisciplina } from '../factories/disciplinasFactory.js';
import mongoose from 'mongoose';
import dadosTrabalho from '../fixtures/trabalhos.json' with { type: 'json' };

const BASE_URL = process.env.BASE_URL;

describe('Registrar Entrega de Trabalho como Aluno', () => {
    after(async () => {
        await mongoose.connection.close();
    });
    
    dadosTrabalho.forEach((cenario) => {

    
        it.only(cenario.testeTitulo, async () => {
            //Arrange
            //cadastrar o aluno | cadastrar a disciplina | cadastrar aluno na disciplina | logar como aluno
            const aluno = novoAluno()
            const cadastrarAlunoResposta = await request(BASE_URL)
                .post('/api/admin/alunos')
                .set('Content-Type', 'application/json')
                .set('Authorization', await getTokenAdmin())
                .send(aluno);
            const alunoId = cadastrarAlunoResposta.body.id;

            const cadastrarDisciplinaResposta = await request(BASE_URL)
                .post('/api/admin/disciplinas')
                .set('Content-Type', 'application/json')
                .set('Authorization', await getTokenAdmin())
                .send(novaDisciplina());
            const disciplinaId = cadastrarDisciplinaResposta.body.id;

            const cadastroMatriculaResposta = await request(BASE_URL)
                .post(`/api/admin/disciplinas/${disciplinaId}/matriculas`)
                .set('Content-Type', 'application/json')
                .set('Authorization', await getTokenAdmin())
                .send({
                    alunoId: alunoId
                });
            const matriculaId = cadastroMatriculaResposta.body.id;

            //Act
            const cadastrarTrabalho = await request(BASE_URL)
                .post(`/api/alunos/${alunoId}/trabalhos`)
                .set('Content-Type', 'application/json')
                .set('Authorization', await realizarLogin(aluno.email, aluno.senha))
                .send({
                    disciplinaId: disciplinaId,
                    titulo: cenario.trabalho.titulo,
                    descricao: cenario.trabalho.descricao
                });
            const trabalhoId = cadastrarTrabalho.body.id
            
            //Assert
            expect(cadastrarTrabalho.status).to.equal(cenario.statusCodeEsperado);

            if(cenario.statusCodeEsperado === 201) {
            const consultarTrabalho = await request(BASE_URL)
                .get(`/api/admin/trabalhos/${trabalhoId}`)
                .set('Content-Type', 'application/json')
                .set('Authorization', await getTokenAdmin())

                
                expect(consultarTrabalho.status).to.equal(200);
                expect(consultarTrabalho.body.alunoId).to.equal(alunoId);
                expect(consultarTrabalho.body.disciplinaId).to.equal(disciplinaId);
                expect(consultarTrabalho.body.titulo).to.equal(cenario.trabalho.titulo);
                expect(consultarTrabalho.body.descricao).to.equal(cenario.trabalho.descricao);
                expect(consultarTrabalho.body.status).to.equal('entregue');
            }
        })
    })
});