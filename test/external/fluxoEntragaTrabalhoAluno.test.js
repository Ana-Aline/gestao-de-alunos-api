import { expect } from 'chai';
import request from 'supertest';
import { getTokenAdmin, realizarLogin } from '../helpers/auth.js';
import { novoAluno } from '../factories/alunosFactory.js';
import { novaDisciplina } from '../factories/disciplinasFactory.js';
import dadosTrabalho from '../fixtures/trabalhos.json' with { type: 'json' };

const BASE_URL = process.env.BASE_URL;

describe('Registrar Entrega de Trabalho como Aluno', () => {

    dadosTrabalho.forEach((cenario) => {
    
        it(cenario.testeTitulo, async () => {
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
            
            //Assert
            expect(cadastrarTrabalho.status).to.equal(cenario.statusCodeEsperado);

            if(cenario.statusCodeEsperado === 201) { 
                expect(cadastrarTrabalho.body.alunoId).to.equal(alunoId);
                expect(cadastrarTrabalho.body.disciplinaId).to.equal(disciplinaId);
                expect(cadastrarTrabalho.body.titulo).to.equal(cenario.trabalho.titulo);
                expect(cadastrarTrabalho.body.descricao).to.equal(cenario.trabalho.descricao);
                expect(cadastrarTrabalho.body.status).to.equal('entregue');
                expect(cadastrarTrabalho.body).to.have.property('id').that.is.not.null;
            }
        })
    })
});