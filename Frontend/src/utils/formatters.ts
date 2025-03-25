// Функция для форматирования типа устройства
export const formatDeviceType = (type: string): string => {
  const deviceTypes: Record<string, string> = {
    desktop: 'Компьютер',
    mobile: 'Мобильный телефон',
    tablet: 'Планшет',
    smarttv: 'Смарт ТВ',
    wearable: 'Носимое устройство',
    console: 'Игровая консоль',
    embedded: 'Встроенное устройство',
  }

  return deviceTypes[type.toLowerCase()] || type
}

// Функция для форматирования названия браузера
export const formatBrowserName = (name: string): string => {
  const browsers: Record<string, string> = {
    chrome: 'Chrome',
    firefox: 'Firefox',
    safari: 'Safari',
    edge: 'Microsoft Edge',
    ie: 'Internet Explorer',
    opera: 'Opera',
    yandex: 'Яндекс Браузер',
    samsung: 'Samsung Browser',
    ucbrowser: 'UC Browser',
  }

  return browsers[name.toLowerCase()] || name
}

// Функция для форматирования названия ОС
export const formatOSName = (name: string): string => {
  const osNames: Record<string, string> = {
    windows: 'Windows',
    macos: 'macOS',
    ios: 'iOS',
    android: 'Android',
    linux: 'Linux',
    ubuntu: 'Ubuntu',
    chromeos: 'Chrome OS',
  }

  return osNames[name.toLowerCase()] || name
}
