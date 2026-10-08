import { initBotId } from 'botid/client/core';

// Vercel BotID (Basic): invisible check on the "Lưu voucher" request only.
initBotId({
  protect: [{ path: '/api/promotions/web-claim/*/reserve', method: 'POST' }],
});
