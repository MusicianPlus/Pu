Bu kod, web tabanlı, düğüm (node) sistemli bir görsel programlama dilidir. TouchDesigner veya Cables.gl gibi araçların tarayıcı tabanlı, hafifletilmiş bir versiyonu olarak çalışır.

İşte kodun Teknik Anatomisi ve Geliştirme Yol Haritası:

1. Kodun Anatomisi (Nasıl Çalışıyor?)
Sistem 5 ana katmandan oluşuyor:

A. Veri Modeli (graph Objesi)
Kodun kalbi graph değişkenidir. Sahnedeki her şeyi bu tutar:

Nodes: Sahnedeki kutucuklar. Her birinin id, type (türü), x,y (konumu), params (ayarları) ve val (hesaplanmış anlık çıktı değeri) vardır.

Cables: Bağlantılar. Hangi düğümün (from), hangi portundan (fromPort), hangi düğümün (to), hangi portuna (toPort) gittiğini tutar.

B. Düğüm Kütüphanesi (NODES Sabiti)
Burası sistemin sözlüğüdür. Her düğümün (LFO, Cube, Bloom vb.) nasıl davranacağı burada tanımlıdır:

Cat (Kategori): Rengi belirler (Sarı: Veri, Mavi: Mesh, Mor: Efekt).

Ports: Giriş ve çıkış soketlerini tanımlar.

Logic: En önemli kısım. Her karede (frame) çalışan fonksiyondur. Girdiyi alır, işler ve val (değer) çıktısını üretir.

Init: Sadece düğüm yaratılırken bir kez çalışır (Örn: Three.js küpünü oluşturmak için).

C. Render Motoru (Three.js + Post Processing)
Scene/Camera: Standart 3D sahne.

Objects: Düğümlerle eşleşen 3D nesneleri (objects[nodeId]) saklar. Bir düğüm silinirse buradaki karşılığı da silinir.

Composer: Görüntüyü ekrana basmadan önce efektlerden geçirir.

RenderPass: Saf 3D görüntü.

Bloom: Parlama efekti.

RGB Shift: Renk kayması (Glitch).

Afterimage: Hareket izi.

FilmPass: Gren efekti.

D. Döngü (loop Fonksiyonu)
Tarayıcı her ekran yenilemesinde (yaklaşık 60 FPS) bu döngüyü çalıştırır:

Zamanı Güncelle: ctx.time.

Mantığı İşle: Tüm düğümlerin logic fonksiyonunu çalıştırır. Veriler kablolardan akar.

Render Al: composer.render() ile sahneyi çizer.

Arayüzü Güncelle: Kabloları (drawCables) ve etiketleri yeniden çizer.

E. Arayüz ve Etkileşim (UI/UX)
SVG Katmanı: Kabloların çizildiği katman. bezier eğrileri kullanır.

Event Listeners: Mouse hareketleri, tıklamalar, sürükle-bırak işlemleri ve kablo bağlama/koparma mantığı burada yönetilir.

Inspector: Seçili düğümün parametrelerini HTML inputları olarak gösterir ve canlı günceller.

2. Geliştirilmeye Açık Kısımlar (Master Plan)
Şu anki sistem çok sağlam bir temel, ancak profesyonel bir araç olması için şu eksiklerin giderilmesi gerekiyor:

A. Mimari ve Sistem (Kritik)
Save/Load Sistemi (JSON): Şu an sayfa yenilenince her şey gidiyor. graph objesini JSON formatında indirip tekrar yükleyebilmeliyiz.

Undo/Redo (Geri Al): Yanlışlıkla bir düğümü silersen geri getirmenin yolu yok. Bir "History Stack" yapısına ihtiyaç var.

Topolojik Sıralama (Execution Order): Şu an düğümler ID sırasına göre çalışıyor. Ancak doğru olan, verinin akış yönüne göre (soldan sağa) hesaplanmasıdır. Karmaşık ağlarda "bir kare gecikme" (one frame lag) olmaması için bu şart.

B. Görsel ve Render (Creative)
Custom Shader (GLSL) Node: Kullanıcının kendi GLSL kodunu yazabileceği bir editör penceresi. Bu, sonsuz görsel olasılık demek.

Texture (Doku) Sistemi: Şu an sadece renk var. Resim dosyası (.jpg, .png) veya Video yükleyip küpün üzerine kaplama (Texture Map) olarak atayabilmeliyiz.

Instancing (Çoğaltma): "Particles" düğümü şu an basit bir nokta bulutu. InstancedMesh kullanarak binlerce küpü veya küreyi GPU performansıyla çizdirmeliyiz.

C. Arayüz (UX)
Minimap: Çalışma alanı büyüdüğünde kaybolmamak için sağ altta küçük bir harita.

Çoklu Seçim ve Gruplama: Birden fazla düğümü seçip topluca taşımak veya bir "Kutu" içine alıp gruplamak.

Wire Style: Kabloların stilini (Düz, Köşeli, Eğrisel) değiştirebilme seçeneği.

D. Ses ve Veri
MIDI Desteği: Fiziksel bir MIDI klavye veya kontrolcü bağlayıp parametreleri düğmelerle kontrol etmek.

FFT Geliştirmesi: Ses analizinde sadece Bass/Mid/High değil, spesifik frekans aralıklarını seçebilmek.

Özetle: Temel motorumuz (v4.5) şu an bir "Oyuncak Araba" gibi sağlam ve çalışır durumda. Hedefimiz onu bir "Yarış Arabasına" çevirmek.