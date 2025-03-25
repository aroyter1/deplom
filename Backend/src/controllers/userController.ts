// Получение статистики пользователя
export const getUserStats = async (req: Request, res: Response) => {
  try {
    // Проверяем авторизацию
    if (!req.userId) {
      return res.status(401).json({ message: 'Не авторизован' })
    }

    // Находим все ссылки пользователя
    const links = await Link.find({ userId: req.userId })

    // Общее количество ссылок
    const totalLinks = links.length

    // Подсчитываем общее количество переходов
    let totalClicks = 0
    if (links.length > 0) {
      totalClicks = links.reduce((sum, link) => sum + link.clicks, 0)
    }

    // Возвращаем статистику
    res.status(200).json({
      totalLinks,
      totalClicks,
    })
  } catch (error) {
    console.error('Ошибка получения статистики пользователя:', error)
    res.status(500).json({ message: 'Ошибка сервера при получении статистики' })
  }
}
