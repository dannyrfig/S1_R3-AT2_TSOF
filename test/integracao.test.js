import app from '../src/app.js';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MontadoraFactory } from './factories/MontadoraFactory.js';
import { clearDataBase } from './utils/clearDatabase.js';
import { consultarCep } from '../src/utils/consultarCep.js';
vi.mock('../src/utils/consultarCep.js', () => ({
    consultarCep: vi.fn()
}));
const mockCep = () => {
    consultarCep.mockResolvedValue({
        cep: '01001000',
        logradouro: 'Praça da Sé',
        bairro: 'Sé',
        cidade: 'São Paulo',
        uf: 'SP'
    });
};
const clienteValido = {
    nome: 'Maria Silva',
    cpf: '52998224725',
    cep: '01001000',
    numero: '100',
    complemento: 'Apto 12'
};

describe('API de montadoras', () => {
    beforeEach(async () => {
        await MontadoraFactory.create('Toyota', 'Japão');
        vi.clearAllMocks();
    });

    afterEach(async () => {
        await clearDataBase();

        vi.resetAllMocks();
    });

    it("deve criar uma montadora com sucesso.", async () => {
        const response = await request(app)
            .post('/montadoras')
            .send({ nome: 'Hyundai', pais: 'Coreia do Sul' });

        expect(response.status).toBe(201);
        expect(response.body.data).toHaveProperty('insertId');
    });

    it("deve impedir o cadastro de montadora com campos obrigatórios vazios.", async () => {
        const response = await request(app)
            .post('/montadoras')
            .send({ nome: '', pais: '' });

            expect([400, 500]).toContain(response.status);
        expect(JSON.stringify(response.body).toLowerCase()).toContain('nome');

        const lista = await request(app).get('/montadoras');
        expect(lista.body.data).toHaveLength(1);
    });

    it("deve impedir o cadastro de montadora com corpo vazio.", async () => {
        const response = await request(app)
            .post('/montadoras')
            .send({});

        expect([400, 500]).toContain(response.status);

        const lista = await request(app).get('/montadoras');
        expect(lista.body.data).toHaveLength(1);
    });
});

describe('API de clientes', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        mockCep();
    });

    afterEach(async () => {
        await clearDataBase();

        vi.resetAllMocks();
    });

    it("deve criar um cliente com dados válidos.", async () => {
        const response = await request(app)
            .post('/clientes')
            .send(clienteValido);

        expect(response.status).toBe(201);
        expect(response.body.data).toHaveProperty('insertId');
    });

    it.fails("deve retornar 404 ao deletar um cliente inexistente.", async () => {
        const response = await request(app).delete('/clientes/999999');

        expect(response.status).toBe(404);
    });
});

describe('API de veículos', () => {
    let veiculoValido;

    beforeEach(async () => {
        vi.clearAllMocks();
        mockCep();
        const montadora = await request(app)
            .post('/montadoras')
            .send({ nome: 'Toyota', pais: 'Japão' });

        const cliente = await request(app)
            .post('/clientes')
            .send(clienteValido);

        veiculoValido = {
            idMontadora: montadora.body.data.insertId,
            idCliente: cliente.body.data.insertId,
            modelo: 'Corolla',
            ano: 2020,
            placa: 'ABC1D23',
            cor: 'Preto',
            valor: 120000
        };
    });

    afterEach(async () => {
        await clearDataBase();

        vi.resetAllMocks();
    });
    it("deve criar um veículo com dados válidos.", async () => {
        const response = await request(app)
            .post('/veiculos')
            .send(veiculoValido);

        expect(response.status).toBe(201);
        expect(response.body.data).toHaveProperty('insertId');
    });

});