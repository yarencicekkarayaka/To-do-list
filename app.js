const gorevInput = document.getElementById('gorevInput');
const ekleButonu = document.getElementById('ekleButonu');
const gorevListesi = document.getElementById('gorevListesi');

ekleButonu.addEventListener('click', goreviEkle);

gorevInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        goreviEkle();
    }
});

function goreviEkle() {
    const gorevMetni = gorevInput.value.trim();

    if (gorevMetni !== "") {
        const yeniGorev = document.createElement('li');
        yeniGorev.textContent = gorevMetni;

        yeniGorev.addEventListener('click', function() {
            yeniGorev.classList.toggle('tamamlandi');
        });

        gorevListesi.appendChild(yeniGorev);

        gorevInput.value = "";
        gorevInput.focus();
    } else {
        alert("Lütfen boş bırakmayın, bir görev yazın!");
    }
}