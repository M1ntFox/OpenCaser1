const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jbywybwncekaoawzqury.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_WAL11ngzElD9llZZKnpJ9g_cWMgT1kz';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

module.exports = async function handler(req, res) {
  if (!BOT_TOKEN) {
    return res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN не настроен в Vercel Environment Variables' });
  }

  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: users, error } = await supabase
      .from('users')
      .select('user_id, username, last_daily_claim, last_notified_daily')
      .not('last_daily_claim', 'is', null)
      .lte('last_daily_claim', twentyFourHoursAgo);

    if (error) {
      console.error('Ошибка Supabase:', error);
      return res.status(500).json({ error: error.message });
    }

    let notifiedCount = 0;

    for (const user of users || []) {
      const lastClaim = new Date(user.last_daily_claim).getTime();
      const lastNotified = user.last_notified_daily ? new Date(user.last_notified_daily).getTime() : 0;

      if (lastNotified < lastClaim) {
        const text = `🎁 *Ежедневная награда готова!*\n\nПривет, ${user.username || 'Игрок'}! Прошло 24 часа с вашего последнего бонуса. Заходите скорее, чтобы забрать свои ⭐ звёзды и не сбросить стрик!`;

        const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: user.user_id,
            text: text,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🚀 Забрать бонус', web_app: { url: 'https://open-caser1.vercel.app' } }]
              ]
            }
          })
        });

        if (tgRes.ok) {
          notifiedCount++;
          await supabase
            .from('users')
            .update({ last_notified_daily: new Date().toISOString() })
            .eq('user_id', user.user_id);
        }
      }
    }

    return res.status(200).json({ success: true, notifiedUsers: notifiedCount });
  } catch (err) {
    console.error('Ошибка выполнения крона:', err);
    return res.status(500).json({ error: err.message });
  }
};
