export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Список предметов с шансами
  const items = [
    { name: 'Деревянный меч', rarity: 'common', chance: 60 },
    { name: 'Серебряный щит', rarity: 'rare', chance: 25 },
    { name: 'Огненный посох', rarity: 'epic', chance: 10 },
    { name: 'Драконий шлем', rarity: 'legendary', chance: 5 }
  ];

  // Расчет случайного предмета на основе шансов
  const rand = Math.random() * 100;
  let cumulativeChance = 0;
  let wonItem = items[0];

  for (const item of items) {
    cumulativeChance += item.chance;
    if (rand <= cumulativeChance) {
      wonItem = item;
      break;
    }
  }

  // Возвращаем результат
  return res.status(200).json({ item: wonItem });
}