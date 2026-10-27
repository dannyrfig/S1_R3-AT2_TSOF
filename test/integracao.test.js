import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { consultarCep } from '../src/utils/consultarCep.js';

vi.mock('../src/utils/consultarCep.js', () => ({
    consultarCep: vi.fn()
}));

const clienteValido = {
    nome: 'Maria Silva',
    cpf: '52998224725',
    cep: '01001000',
    numero: '100',
    complemento: 'Apto 12'
};

const mockCep = () => {
    consultarCep.mockResolvedValue({
        cep: '01001000',
        logradouro: 'Praça da Sé',
        bairro: 'Sé',
        localidade: 'São Paulo',
        uf: 'SP',
        cidade: 'São Paulo'
    });
};

const criarMontadora = async (nome = 'Toyota') => {
    const response = await request(app)
        .post('/montadoras')
        .send({ nome, pais: 'Japão' });

    expect(response.status).toBe(201);
    return response;
};

const criarCliente = async (cpf = clienteValido.cpf) => {
    mockCep();

    const response = await request(app)
        .post('/clientes')
        .send({ ...clienteValido, cpf });

    expect(response.status).toBe(201);
    return response;
};

describe('API de montadoras', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('deve criar uma montadora com sucesso', async () => {
        const response = await request(app)
            .post('/montadoras')
            .send({ nome: 'Toyota', pais: 'Japão' });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('data');
    });

    it('deve impedir cadastro de montadora com campos obrigatórios vazios', async () => {
        const response = await request(app)
            .post('/montadoras')
            .send({ nome: '', pais: '' });

        expect(response.status).not.toBe(201);
    });

    it('deve impedir cadastro de montadora com corpo vazio', async () => {
        const response = await request(app)
            .post('/montadoras')
            .send({});

        expect(response.status).not.toBe(201);
    });

    it('deve consultar montadoras pela listagem', async () => {
        await criarMontadora('Honda');

        const response = await request(app).get('/montadoras');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
    });

    it('deve listar as montadoras cadastradas', async () => {
        const response = await request(app).get('/montadoras');

        expect(response.status).toBe(200);
    });

    it('deve impedir o cadastro de montadora com nome vazio', async () => {
        const response = await request(app)
            .post('/montadoras')
            .send({ nome: '', pais: 'Japão' });

        expect(response.status).not.toBe(201);
    });

    it('deve retornar uma resposta ao cadastrar outra montadora válida', async () => {
        const response = await request(app)
            .post('/montadoras')
            .send({ nome: 'Hyundai', pais: 'Coreia do Sul' });

        expect(response.status).toBe(201);
    });

    it('deve responder ao consultar a listagem de montadoras', async () => {
        const response = await request(app).get('/montadoras');

        expect([200, 204]).toContain(response.status);
    });
});

describe('API de clientes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockCep();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('deve criar um cliente com dados válidos', async () => {
        const response = await request(app)
            .post('/clientes')
            .send(clienteValido);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('data');
    });

    it('deve responder ao excluir um cliente inexistente', async () => {
        const response = await request(app).delete('/clientes/999999');

        expect(response.status).toBe(200);
    });

    it('deve consultar a lista de clientes cadastrados', async () => {
        const response = await request(app).get('/clientes');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
    });

    it('deve atualizar os dados de um cliente com informações válidas', async () => {
        const cadastro = await criarCliente('52998224725');
        const id = cadastro.body?.data?.insertId;

        if (id === undefined) {
            throw new Error(
                'O cadastro não retornou data.insertId; confira o formato da resposta da API.'
            );
        }

        mockCep();

        const response = await request(app)
            .put(`/clientes?id=${id}`)
            .send({
                ...clienteValido,
                nome: 'Maria Silva Atualizada'
            });

        expect(response.status).toBe(200);
    });

    it('deve excluir um cliente existente', async () => {
        const cadastro = await criarCliente('11144477735');
        const id = cadastro.body?.data?.insertId;

        if (id === undefined) {
            throw new Error(
                'O cadastro não retornou data.insertId; confira o formato da resposta da API.'
            );
        }

        const response = await request(app)
            .delete(`/clientes/${id}`);

        expect(response.status).toBe(200);
    });

    it('deve cadastrar um cliente com outro CPF válido', async () => {
        const response = await request(app)
            .post('/clientes')
            .send({
                ...clienteValido,
                cpf: '11144477735'
            });

        expect(response.status).toBe(201);
    });

    it('deve impedir o cadastro de cliente com CEP inválido', async () => {
        consultarCep.mockResolvedValue(null);

        const response = await request(app)
            .post('/clientes')
            .send({
                ...clienteValido,
                cpf: '12345678909',
                cep: '00000000'
            });

        expect(response.status).not.toBe(201);
    });

    it('deve listar os clientes cadastrados', async () => {
        const response = await request(app).get('/clientes');

        expect(response.status).toBe(200);
    });
});

describe('API de veículos', () => {
    let veiculoTeste;

    beforeEach(async () => {
        vi.clearAllMocks();
        mockCep();

        const montadora = await criarMontadora('Toyota');
        const cliente = await criarCliente('11144477735');

        const idMontadora = montadora.body?.data?.insertId;
        const idCliente = cliente.body?.data?.insertId;

        if (idMontadora === undefined || idCliente === undefined) {
            throw new Error(
                'Não foi possível obter os IDs da montadora ou do cliente para preparar os testes de veículos.'
            );
        }

        veiculoTeste = {
            idMontadora,
            idCliente,
            modelo: 'Corolla',
            placa: 'ABC1D23',
            ano: 2024,
            cor: 'Prata',
            valor: 120000
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('deve criar um veículo com dados válidos', async () => {
        const response = await request(app)
            .post('/veiculos')
            .send(veiculoTeste);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('data');
    });

    it('deve atualizar os dados de um veículo com informações válidas', async () => {
        const cadastro = await request(app)
            .post('/veiculos')
            .send(veiculoTeste);

        expect(cadastro.status).toBe(201);

        const id = cadastro.body?.data?.insertId;

        if (id === undefined) {
            throw new Error(
                'O cadastro do veículo não retornou data.insertId.'
            );
        }

        const response = await request(app)
            .put(`/veiculos?id=${id}`)
            .send({
                ...veiculoTeste,
                cor: 'Preto'
            });

        expect(response.status).toBe(200);
    });

    it('deve consultar a lista de veículos cadastrados', async () => {
        const response = await request(app).get('/veiculos');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
    });

    it('deve impedir o cadastro de veículo sem cliente válido', async () => {
        const response = await request(app)
            .post('/veiculos')
            .send({
                ...veiculoTeste,
                idCliente: 999999
            });

        expect(response.status).not.toBe(201);
    });

    it('deve impedir o cadastro de veículo com valor negativo', async () => {
        const response = await request(app)
            .post('/veiculos')
            .send({
                ...veiculoTeste,
                placa: 'XYZ9A87',
                valor: -100
            });

        expect(response.status).not.toBe(201);
    });
});
