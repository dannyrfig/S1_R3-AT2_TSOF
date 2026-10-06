import { connection } from "../../src/configs/Database.js";

export class VeiculoFactory{
    static async create(modelo, placa, ano, cor ,valor, id_cliente, id_montadora ) {
        const [result] = await connection.execute(
            `INSERT INTO veiculos
            (modelo, placa, ano, cor, valor, id_cliente, id_montadora)
            VALUES(?,?,?,?,?,?,?)`,
            [modelo, placa, ano, cor, valor, id_Cliente, id_Montadora]
        );

        return{
            id: result.insertId,
            modelo, 
            placa,
            ano,
            cor,
            valor,
            id_cliente,
            id_montadora
        }
    }
}