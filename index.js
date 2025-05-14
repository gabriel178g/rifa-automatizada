const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mercadopago = require('mercadopago');
const qrcode = require('qrcode');

require('dotenv').config();

mercadopago.configure({
  access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN
});

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/reservar', async (req, res) => {
  const { nome, whatsapp, numeros } = req.body;
  const valor = numeros.length * 1; // valor por número (R$1,00)

  const body = {
    transaction_amount: valor,
    description: `Rifa de ${nome} - Números: ${numeros.join(', ')}`,
    payment_method_id: 'pix',
    payer: {
      email: `${whatsapp.replace(/\D/g, '')}@rifa.com`,
      first_name: nome
    }
  };

  try {
    const payment = await mercadopago.payment.create(body);
    const pixInfo = payment.body.point_of_interaction.transaction_data;
    const qr = await qrcode.toDataURL(pixInfo.qr_code);

    res.json({
      nome,
      numeros,
      valor,
      pix_qr_code: pixInfo.qr_code,
      pix_qr_code_base64: qr.replace(/^data:image\/png;base64,/, '')
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ erro: 'Erro ao gerar cobrança' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
