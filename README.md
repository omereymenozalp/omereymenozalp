# Süper Bıyık

Telefonda oynanmak için yazılmış, Süper Mario tarzı bir platform oyunu. Tek bir `index.html` dosyasından oluşur; dış kaynak, resim ya da ses dosyası kullanmaz.

Bütün içerik kodla üretilir:

- **Grafikler:** kahraman, düşmanlar, boss, prenses, bloklar, borular, arka plan katmanları ve kale. Hepsi piksel piksel çiziliyor.
- **Font:** Türkçe karakterleri (Ç Ğ İ Ö Ş Ü) destekleyen özel 5×7 piksel font.
- **Müzik ve sesler:** Web Audio API ile gerçek zamanlı sentezlenen 8-bit tarzı besteler ve efektler.

## Nasıl oynanır

`index.html` dosyasını telefonun tarayıcısında aç. GitHub Pages açıksa doğrudan sayfa adresinden de oynanabilir.

| Kontrol | Dokunmatik | Klavye |
|---|---|---|
| Hareket | ◀ ▶ | ← → / A D |
| Eğil / boruya gir | ▼ | ↓ / S |
| Zıpla (basılı tutunca daha yükseğe) | A | Z / Boşluk / ↑ |
| Koş / ateş et | B | X / Shift |
| Duraklat | ❚❚ | P / Esc |
| Ses | 🔈 | M |

Telefonu yan çevirince görüş alanı genişler. Dik tutunca kontroller ekranın altına konsol gibi yerleşir.

## Bölümler

1. **1-1 Yeşil Vadi:** gizli bonus odasına inen bir boru, gizli 1UP bloğu ve bayrak direği.
2. **1-2 Kristal Mağara:** yamyam çiçekli borular, dikenli kirpiler, tuğla labirent ve hareketli platform.
3. **1-3 Bulut Tepeleri:** ağaç tepeleri, düşen platformlar, arılar ve bir yay.
4. **1-4 Ejder Kalesi:** lav, ateş çubukları, zıplayan lav topları ve köprüde Ejder Kral.

Güçlendirmeler: büyüme mantarı, ateş çiçeği, yıldız (dokunulmazlık) ve 1UP mantarı. Her bölümde bir kontrol noktası var. Açılan bölümler ve en yüksek skor tarayıcıda saklanır.
