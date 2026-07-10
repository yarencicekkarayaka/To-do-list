const gorevGirisi = document.getElementById("gorev-girisi");
const eklemeButonu = document.getElementById("ekleme-butonu");
const tumunuSilButonu = document.getElementById("tumunu-sil-butonu");
const kutuyuBosaltButonu = document.getElementById("kutuyu-bosalt-butonu");
const gorevListesi = document.getElementById("gorev-listesi");
const hafizaListesi = document.getElementById("hafiza-listesi");
const onerilenlerKutusu = document.getElementById("onerilenler-kutusu");
const oncelikSecimi = document.getElementById("oncelik-secimi");
const kategoriSecimi = document.getElementById("kategori-secimi");
const sonTarihSecimi = document.getElementById("son-tarih");
const exportBtn = document.getElementById("export-btn");
const importBtn = document.getElementById("import-btn");
const importFile = document.getElementById("import-file");

// YENİ: Filtre değişkeni durumu tracker'ı
let aktifFiltre = "hepsi";

document.addEventListener("DOMContentLoaded", () => {
  verileriYukle();
  updateTaskStats();
  surukleBirakAktivasyon();
  filtreEtkinlikleriniTanimla(); // YENİ: Filtre buton dinleyicileri
});

eklemeButonu.addEventListener("click", gorevEkle);
tumunuSilButonu.addEventListener("click", tumGorevleriCopeAt);
kutuyuBosaltButonu.addEventListener("click", copKutusunuBosalt);
exportBtn.addEventListener("click", verileriDisaAktar);
importBtn.addEventListener("click", () => importFile.click());
importFile.addEventListener("change", verileriIceAktar);

function updateTaskStats() {
  const aktifGorevler = JSON.parse(localStorage.getItem("gorevler") || "[]");
  const toplam = aktifGorevler.length;
  const tamamlanan = aktifGorevler.filter(g => g.tamamlandi).length;

  document.getElementById("total-tasks").textContent = `${toplam} Görev`;
  document.getElementById("completed-tasks").textContent = `${tamamlanan} Tamamlandı`;
}

gorevGirisi.addEventListener("keypress", function (etkinlik) {
  if (etkinlik.key === "Enter") {
    gorevEkle();
  }
});

gorevGirisi.addEventListener("input", function() {
  const arananMetin = gorevGirisi.value.trim().toLowerCase();
  onerilenlerKutusu.innerHTML = "";
  
  if (arananMetin === "") {
    onerilenlerKutusu.style.display = "none";
    return;
  }

  const aktifGorevler = JSON.parse(localStorage.getItem("gorevler") || "[]");
  const silinenGorevler = JSON.parse(localStorage.getItem("silinenler") || "[]");
  const tumGorevler = [...new Set([...aktifGorevler.map(g => g.metin), ...silinenGorevler.map(g => g.metin)])];

  const eslesenler = tumGorevler.filter(gorev => gorev.toLowerCase().includes(arananMetin));

  if (eslesenler.length > 0) {
    onerilenlerKutusu.style.display = "block";

    eslesenler.forEach(gorev => {
      const oneriDiv = document.createElement("div");
      oneriDiv.classList.add("oneri-elemani");
      const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapeRegex(arananMetin)})`, "gi");
      const tempDiv = document.createElement("div");
      const parts = gorev.split(regex);
      parts.forEach(part => {
        if (part.toLowerCase() === arananMetin) {
          const strong = document.createElement("strong");
          strong.textContent = part;
          tempDiv.appendChild(strong);
        } else {
          tempDiv.appendChild(document.createTextNode(part));
        }
      });
      oneriDiv.appendChild(tempDiv);

      oneriDiv.addEventListener("click", function() {
        gorevGirisi.value = gorev;
        onerilenlerKutusu.style.display = "none";
        gorevGirisi.focus();
      });

      onerilenlerKutusu.appendChild(oneriDiv);
    });
  } else {
    onerilenlerKutusu.style.display = "none";
  }
});

document.addEventListener("click", function(e) {
  if (e.target !== gorevGirisi && !onerilenlerKutusu.contains(e.target)) {
    onerilenlerKutusu.style.display = "none";
  }
});

function gorevEkle() {
  const gorevMetni = gorevGirisi.value.trim();
  if (gorevMetni === "") {
    alert("Lütfen bir görev yazın!");
    return;
  }

  const simdi = new Date();
  const gun = String(simdi.getDate()).padStart(2, '0');
  const ay = String(simdi.getMonth() + 1).padStart(2, '0');
  const yil = simdi.getFullYear();
  const saat = String(simdi.getHours()).padStart(2, '0');
  const dakika = String(simdi.getMinutes()).padStart(2, '0');
  const formatliTarih = `${gun}.${ay}.${yil} ${saat}:${dakika}`;

  const yeniId = Date.now().toString();
  const oncelik = oncelikSecimi.value;
  const kategori = kategoriSecimi.value;
  const sonTarih = sonTarihSecimi.value;

  const yeniGorev = { 
    id: yeniId, 
    metin: gorevMetni, 
    tamamlandi: false, 
    tarih: formatliTarih,
    oncelik: oncelik,
    kategori: kategori,
    sonTarih: sonTarih
  };

  listeyeGorevEkleArayuz(yeniGorev);
  goreviKaydet(yeniGorev);
  gorevGirisi.value = "";
  sonTarihSecimi.value = "";
  oncelikSecimi.value = "orta";
  kategoriSecimi.value = "Genel";
  onerilenlerKutusu.style.display = "none";
  gorevGirisi.focus();
  updateTaskStats();
  filtreleGorevler(); // Yeni eklenen görevi filtre durumuna göre göster/gizle
}

function listeyeGorevEkleArayuz(gorevObj) {
  const li = document.createElement("li");
  li.dataset.id = gorevObj.id;
  li.draggable = true;
  if (gorevObj.sonTarih && !gorevObj.tamamlandi) {
      const bugun = new Date();
      bugun.setHours(0,0,0,0);
      const bitisTarihi = new Date(gorevObj.sonTarih);
      bitisTarihi.setHours(0,0,0,0);
      if (bitisTarihi < bugun) {
          li.classList.add("tarihi-gecmis");
      }
  }
  
  const metinAlani = document.createElement("span");
  metinAlani.textContent = gorevObj.metin;
  if (gorevObj.tamamlandi) {
    metinAlani.classList.add("tamamlandi");
  }
  li.appendChild(metinAlani);
  
  if(gorevObj.kategori) {
      const katBadge = document.createElement("span");
      katBadge.classList.add("badge-kategori");
      katBadge.textContent = gorevObj.kategori;
      li.appendChild(katBadge);
  }
  if(gorevObj.oncelik) {
      const prioBadge = document.createElement("span");
      prioBadge.classList.add("badge-oncelik", `prio-${gorevObj.oncelik}`);
      prioBadge.textContent = gorevObj.oncelik;
      li.appendChild(prioBadge);
  }
  if (gorevObj.sonTarih) {
      const sonTarihAlani = document.createElement("span");
      sonTarihAlani.classList.add("gorev-tarihi");
      const [y, m, d] = gorevObj.sonTarih.split("-");
      sonTarihAlani.textContent = `⏳ ${d}.${m}.${y}`;
      li.appendChild(sonTarihAlani);
  }

  // Görevi Tamamlama Click Olayı
  metinAlani.addEventListener("click", function () {
    if (li.classList.contains("editing")) return; // Düzenleme modundaysa tamamlama tetiklenmesin
    
    metinAlani.classList.toggle("tamamlandi");
    const isCompleted = metinAlani.classList.contains("tamamlandi");
    durumGuncelle(gorevObj.id, isCompleted);
    if(isCompleted) {
        li.classList.remove("tarihi-gecmis");
    } else {
        if (gorevObj.sonTarih) {
            const bugun = new Date(); bugun.setHours(0,0,0,0);
            const bitis = new Date(gorevObj.sonTarih); bitis.setHours(0,0,0,0);
            if (bitis < bugun) li.classList.add("tarihi-gecmis");
          }
      }
    updateTaskStats();
    filtreleGorevler(); // Durum değiştiği için filtreyi yenile
  });

  // GÜNCELLENDİ: Çift Tıklama ile Düzenleme Modunu Başlatma
  metinAlani.addEventListener("dblclick", function () {
    duzenlemeModunuAc(li, metinAlani, gorevObj.id);
  });

  const butonGrubu = document.createElement("div");
  butonGrubu.classList.add("buton-grubu");

  // YENİ: Düzenle (Edit) Butonu
  const duzenleButonu = document.createElement("button");
  duzenleButonu.classList.add("silme-butonu", "duzenle-btn");
  duzenleButonu.textContent = "Düzenle";
  duzenleButonu.addEventListener("click", function() {
     duzenlemeModunuAc(li, metinAlani, gorevObj.id);
  });

  const silButonu = document.createElement("button");
  silButonu.classList.add("silme-butonu");
  silButonu.textContent = "Sil";
  silButonu.addEventListener("click", function () {
    li.remove();
    gorevHafizayaTasi(gorevObj.id);
    updateTaskStats();
  });

  butonGrubu.appendChild(duzenleButonu);
  butonGrubu.appendChild(silButonu);
  li.appendChild(butonGrubu);
  
  li.addEventListener("dragstart", () => li.classList.add("dragging"));
  li.addEventListener("dragend", () => {
      li.classList.remove("dragging");
      siralamayiKaydet();
  });

  gorevListesi.appendChild(li);
}

// YENİ: Satır içi İnline Düzenleme Fonksiyonu
function duzenlemeModunuAc(liElement, metinSpan, id) {
    if (liElement.classList.contains("editing")) return;
    
    liElement.classList.add("editing");
    liElement.draggable = false; // Düzenleme yaparken sürükleme kapansın
    
    const eskiMetin = metinSpan.textContent;
    const inputDuzenle = document.createElement("input");
    inputDuzenle.type = "text";
    inputDuzenle.classList.add("duzenleme-input");
    inputDuzenle.value = eskiMetin;
    
    const badgesVeButonlar = [...liElement.children].filter(child => child !== metinSpan);
    badgesVeButonlar.forEach(el => el.style.display = "none");
    
    metinSpan.style.display = "none";
    liElement.insertBefore(inputDuzenle, metinSpan);
    inputDuzenle.focus();
    
    function kaydet() {
        const yeniMetin = inputDuzenle.value.trim();
        if (yeniMetin !== "") {
            gorevGuncelle(id, yeniMetin);
            metinSpan.textContent = yeniMetin;
        }
        inputDuzenle.remove();
        metinSpan.style.display = "";
        badgesVeButonlar.forEach(el => el.style.display = "");
        liElement.classList.remove("editing");
        liElement.draggable = true;
    }
    
    inputDuzenle.addEventListener("blur", kaydet);
    inputDuzenle.addEventListener("keypress", (e) => {
        if (e.key === "Enter") kaydet();
    });
}

// YENİ: Filtreleme Butonlarının Yapılandırılması
function filtreEtkinlikleriniTanimla() {
    const filtreButonlari = document.querySelectorAll(".filtre-btn");
    filtreButonlari.forEach(btn => {
        btn.addEventListener("click", () => {
            filtreButonlari.forEach(b => b.classList.remove("aktif"));
            btn.classList.add("aktif");
            aktifFiltre = btn.dataset.filter || btn.getAttribute("data-filtre");
            filtreleGorevler();
        });
    });
}

// YENİ: Görevleri ekrandaki filtreye göre süzme işlemi
function filtreleGorevler() {
    const listElemanlari = gorevListesi.querySelectorAll("li");
    
    listElemanlari.forEach(li => {
        const span = li.querySelector("span");
        const tamamlandiMi = span.classList.contains("tamamlandi");
        
        switch (aktifFiltre) {
            case "hepsi":
                li.style.display = "flex";
                break;
            case "yapilacaklar":
                li.style.display = !tamamlandiMi ? "flex" : "none";
                break;
            case "tamamlananlar":
                li.style.display = tamamlandiMi ? "flex" : "none";
                break;
        }
    });
}

function hafizaListesineEkleArayuz(gorevObj) {
  const li = document.createElement("li");
  li.dataset.id = gorevObj.id;
  
  const metinAlani = document.createElement("span");
  metinAlani.textContent = gorevObj.metin;
  if (gorevObj.tamamlandi) {
    metinAlani.classList.add("tamamlandi");
  }
  li.appendChild(metinAlani);

  const butonGrubu = document.createElement("div");
  butonGrubu.classList.add("buton-grubu");

  const geriAlButonu = document.createElement("button");
  geriAlButonu.classList.add("geri-al-butonu");
  geriAlButonu.textContent = "Geri Al";
  geriAlButonu.addEventListener("click", function () {
    li.remove();
    hafizadanGeriYukle(gorevObj.id);
    updateTaskStats();
  });

  const kesinSilButonu = document.createElement("button");
  kesinSilButonu.classList.add("silme-butonu");
  kesinSilButonu.textContent = "Sil";
  kesinSilButonu.addEventListener("click", function () {
    li.remove();
    hafizadanTamamenSil(gorevObj.id);
    updateTaskStats();
  });

  butonGrubu.appendChild(geriAlButonu);
  butonGrubu.appendChild(kesinSilButonu);
  li.appendChild(butonGrubu);

  if (hafizaListesi) {
    hafizaListesi.appendChild(li);
  }
}

function goreviKaydet(gorevObj) {
  let gorevler = JSON.parse(localStorage.getItem("gorevler") || "[]");
  gorevler.push(gorevObj);
  localStorage.setItem("gorevler", JSON.stringify(gorevler));
}

function verileriYukle() {
  gorevListesi.innerHTML = "";
  if (hafizaListesi) hafizaListesi.innerHTML = "";

  let gorevler = JSON.parse(localStorage.getItem("gorevler") || "[]");
  gorevler.forEach(gorev => listeyeGorevEkleArayuz(gorev));

  let silinenler = JSON.parse(localStorage.getItem("silinenler") || "[]");
  silinenler.forEach(gorev => hafizaListesineEkleArayuz(gorev));
  
  filtreleGorevler(); // Veriler yüklenince mevcut filtreyi uygula
}

function tumGorevleriCopeAt() {
  let gorevler = JSON.parse(localStorage.getItem("gorevler") || "[]");
  if (gorevler.length === 0) {
    alert("Zaten çöp kutusuna atılacak aktif bir görev yok!");
    return;
  }
  const onay = confirm("Aktif listedeki TÜM görevleri çöp kutusuna taşımak istiyor musunuz?");
  if (onay) {
    let silinenler = JSON.parse(localStorage.getItem("silinenler") || "[]");
    silinenler.push(...gorevler);
    gorevler.forEach(gorev => hafizaListesineEkleArayuz(gorev));
    localStorage.setItem("silinenler", JSON.stringify(silinenler));
    localStorage.removeItem("gorevler");
    gorevListesi.innerHTML = "";
    updateTaskStats();
  }
}

function copKutusunuBosalt() {
  let silinenler = JSON.parse(localStorage.getItem("silinenler") || "[]");
  if (silinenler.length === 0) {
    alert("Çöp kutusu zaten boş!");
    return;
  }
  const onay = confirm("Çöp kutusundaki TÜM görevleri geri alınamayacak şekilde tamamen silmek istediğinize emin misiniz?");
  if (onay) {
    hafizaListesi.innerHTML = "";
    localStorage.removeItem("silinenler");
    updateTaskStats();
  }
}

function gorevHafizayaTasi(id) {
  let gorevler = JSON.parse(localStorage.getItem("gorevler") || "[]");
  const tasinacakGorev = gorevler.find(g => g.id === id);
  if (!tasinacakGorev) return;
  
  gorevler = gorevler.filter(g => g.id !== id);
  localStorage.setItem("gorevler", JSON.stringify(gorevler));

  let silinenler = JSON.parse(localStorage.getItem("silinenler") || "[]");
  silinenler.push(tasinacakGorev);
  localStorage.setItem("silinenler", JSON.stringify(silinenler));

  hafizaListesineEkleArayuz(tasinacakGorev);
  updateTaskStats();
}

function hafizadanGeriYukle(id) {
  let silinenler = JSON.parse(localStorage.getItem("silinenler") || "[]");
  const geriYuklenecek = silinenler.find(g => g.id === id);
  if (!geriYuklenecek) return;
  
  silinenler = silinenler.filter(g => g.id !== id);
  localStorage.setItem("silinenler", JSON.stringify(silinenler));

  let gorevler = JSON.parse(localStorage.getItem("gorevler") || "[]");
  gorevler.push(geriYuklenecek);
  localStorage.setItem("gorevler", JSON.stringify(gorevler));

  listeyeGorevEkleArayuz(geriYuklenecek);
  updateTaskStats();
  filtreleGorevler(); // Geri yüklenen elemanı filtreye göre kontrol et
}

function hafizadanTamamenSil(id) {
  let silinenler = JSON.parse(localStorage.getItem("silinenler") || "[]");
  silinenler = silinenler.filter(g => g.id !== id);
  localStorage.setItem("silinenler", JSON.stringify(silinenler));
  updateTaskStats();
}

function durumGuncelle(id, yeniDurum) {
  let gorevler = JSON.parse(localStorage.getItem("gorevler") || "[]");
  gorevler = gorevler.map(gorev => {
    if (gorev.id === id) {
      gorev.tamamlandi = yeniDurum;
    }
    return gorev;
  });
  localStorage.setItem("gorevler", JSON.stringify(gorevler));
  updateTaskStats();
}

function gorevGuncelle(id, yeniMetin) {
  let gorevler = JSON.parse(localStorage.getItem("gorevler") || "[]");
  gorevler = gorevler.map(gorev => {
    if (gorev.id === id) {
      gorev.metin = yeniMetin;
    }
    return gorev;
  });
  localStorage.setItem("gorevler", JSON.stringify(gorevler));
}

function surukleBirakAktivasyon() {
    gorevListesi.addEventListener("dragover", e => {
        e.preventDefault();
        const afterElement = getDragAfterElement(gorevListesi, e.clientY);
        const dragging = document.querySelector(".dragging");
        if (afterElement == null) {
            gorevListesi.appendChild(dragging);
        } else {
            gorevListesi.insertBefore(dragging, afterElement);
        }
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll("li:not(.dragging)")];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function siralamayiKaydet() {
    const liElements = [...gorevListesi.querySelectorAll("li")];
    const mevcutGorevler = JSON.parse(localStorage.getItem("gorevler") || "[]");
    const yeniSiraliDizi = liElements.map(li => {
        const id = li.dataset.id;
        return mevcutGorevler.find(g => g.id === id);
    }).filter(Boolean);

    localStorage.setItem("gorevler", JSON.stringify(yeniSiraliDizi));
}

function verileriDisaAktar() {
    const aktifler = localStorage.getItem("gorevler") || "[]";
    const silinenler = localStorage.getItem("silinenler") || "[]";
    const tema = localStorage.getItem("theme") || "light";

    const dataShed = {
        gorevler: JSON.parse(aktifler),
        silinenler: JSON.parse(silinenler),
        theme: tema
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataShed, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "todo_premium_yedek.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function verileriIceAktar(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const yuklenenData = JSON.parse(evt.target.result);
            if (yuklenenData.gorevler || yuklenenData.silinenler) {
                localStorage.setItem("gorevler", JSON.stringify(yuklenenData.gorevler || []));
                localStorage.setItem("silinenler", JSON.stringify(yuklenenData.silinenler || []));
                if(yuklenenData.theme) localStorage.setItem("theme", yuklenenData.theme);
                
                alert("Veriler başarıyla içe aktarıldı!");
                verileriYukle();
                updateTaskStats();
            } else {
                alert("Hatalı dosya formatı!");
            }
        } catch (error) {
            alert("Dosya okunurken bir hata oluştu!");
        }
    };
    reader.readAsText(file);
}

const toggleButton = document.getElementById('theme-toggle');
const currentTheme = localStorage.getItem('theme');
if (currentTheme === 'dark') {
  document.documentElement.setAttribute('data-theme', 'dark');
  toggleButton.textContent = '☀️ Light Mode';
}
toggleButton.addEventListener('click', () => {
  let theme = document.documentElement.getAttribute('data-theme');
  
  if (theme === 'dark') {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('theme', 'light');
    toggleButton.textContent = '🌙 Dark Mode';
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
    toggleButton.textContent = '☀️ Light Mode';
  }
});