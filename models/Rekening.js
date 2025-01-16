class Rekening {
    #saldo;

    constructor(saldo) {
        this.#saldo = saldo;
    }

    getSaldo() {
        return this.#saldo;
    }

    withdraw(amount) {
        if (amount > this.#saldo) throw new Error();
        this.#saldo -= amount;
        return this.#saldo;
    }
}

const Ovo = new Rekening(200000);
const Mastercard = new Rekening(200000);
const Visa = new Rekening(200000);

module.exports = {Ovo, Mastercard, Visa};