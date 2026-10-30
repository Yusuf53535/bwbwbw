# bwbwbw

Pembe pixel arka planda, kurdeleli ve yavaş başlayan kalp yiyen yılan. Kalp yedikçe küçük pixel kalpler dağılır, yılan kısa süre parlar. Ekranda başlık ve açıklama bulunmaz. 10 normal kalp yiyince Z ♥ Y özel kalbi çıkar. Özel kalbi yiyince yukarıdan kapalı pixel zarf düşer. Zarfa dokununca mektup açılır, mesaj harf harf yazılır. Mesaja dokunarak yazının tamamını hemen gösterebilirsin. Çarpışınca baştan denenir, mektup açılmaz. Hareket azaltma tercihi açıkken mesaj doğrudan gösterilir.

Telefonda yön düğmeleriyle veya oyun alanında kaydırarak, bilgisayarda ok tuşlarıyla oynanır. Ortadaki üçgen başlatır, oyun köşesindeki simge duraklatır. Müzik notası sesi açar/kapatır; sağdaki simge iki şarkı arasında geçer. Mektuptaki simge yeniden oynatır.

İlk oyuna başlama dokunuşunda **I Will Always Think of You** yüklenen tam kayıt olan `bwbwbw-muzik.mp3` dosyasından çalar; bitince tekrar başlar. İkinci parça **Chirp**, şimdilik Spotify'ın kısa önizlemesidir. Chirp'in tam ses dosyasını eklersen `bwbwbw-config.js` içindeki ilgili `src` alanını dosyanın yoluyla değiştir. Tarayıcı sesi engellerse oyun sessiz devam eder; nota simgesiyle tekrar deneyebilirsin.

Mektup metni de `bwbwbw-config.js` dosyasından değiştirilir.

Mektup kalpli başlık, zıplayan iki tavşan ve uzun metin için kaydırma içerir. Pembe seçenek ekranın her yanından kalpler çıkarır. Kırmızı seçenek tavşanları ağlatır; gözyaşları ekranın altında su biriktirir. Seçenek değiştirilebilir, yeniden oynayınca efektler temizlenir. Seçimler kaydedilmez veya gönderilmez.

Pembe seçenekte iki tavşan birbirine yaklaşır, gözlerini kapatıp sarılır. Aralarında ve üstlerinde pixel kalpler belirir.

Su pixel dalgalar, köpük, katmanlar ve parıltılar içerir. Su yükseldikten sonra mektubun iki tavşanı çizgi film animasyonuyla içine düşüp kaybolur; suyun içinde baloncuklar yükselir. Pembe seçeneğe dönünce tavşanlar geri gelir ve su temizlenir.

Su telefonun eğimine göre sağa/sola yatar. iPhone'da kırmızı seçeneğe dokununca hareket izni istenebilir. Sensör verisi yalnızca bu sayfada kullanılır. İzin verilmezse veya sensör yoksa su düz kalır. Telefonda GitHub Pages'in HTTPS bağlantısıyla açılır; masaüstü önizleme fiziksel hareketi göstermez.

Mektup yazılırken harflere hafif pixel bip sesleri eşlik eder. Boşluklar ve noktalama sessizdir. Ses tarayıcıda üretilir; ek dosya gerektirmez. Nota simgesi bu efekti de susturur.

## GitHub Pages

1. `bwbwbw` adında bir GitHub deposu oluştur.
2. Bu klasörün içindeki dosyaların tamamını deponun ana dizinine yükle. `index.html` ve `pixel-font.ttf` dahil olmalı.
3. **Settings → Pages → Deploy from a branch → main → /(root) → Save** seç.
4. GitHub'ın verdiği bağlantıyı paylaş. İşin bitince **Unpublish site** ile kapat.

Kurulum, paket yükleme veya derleme gerekmez. Site kişisel veri toplamaz.
