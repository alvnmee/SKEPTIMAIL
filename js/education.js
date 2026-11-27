const educationTopics = [
  {
    id: 'impersonation', title: 'Impersonation', visual: 'identity',
    image: 'assets/education/impersonation.png',
    summary: 'Penipu membangun kesan sebagai rekan, vendor, HR, atau layanan yang Anda kenal.',
    example: 'Pesan dari “staf vendor Sagara” meminta perubahan rekening tagihan melalui alamat balasan baru.',
    mechanism: 'Pelaku meniru nama, gaya bahasa, foto profil, atau konteks percakapan agar permintaan terasa rutin. Identitas yang tampak akrab belum tentu berasal dari pemiliknya.',
    signals: [
      'Alamat pengirim atau nomor berbeda dari catatan sebelumnya.',
      'Permintaan baru mengubah alur kerja, rekening, atau kontak.',
      'Ada dorongan untuk merahasiakan permintaan dari rekan lain.'
    ],
    mistake: 'Menganggap nama dan foto profil cukup untuk membuktikan identitas.',
    prevention: 'Hubungi orang atau vendor melalui nomor dan alamat yang sudah tersimpan, bukan detail kontak di pesan baru.',
    response: 'Jangan teruskan pembayaran atau dokumen. Konfirmasikan perubahan lewat kanal kedua yang telah dikenal dan laporkan akun tiruan.'
  },
  {
    id: 'fake-links', title: 'Fake links', visual: 'link',
    image: 'assets/education/fake-links.png',
    summary: 'Alamat yang ditampilkan dapat berbeda dari tujuan sebenarnya atau memakai domain tiruan.',
    example: 'Pesan menyebut “Portal Mitra Sagara”, tetapi alamat yang tercetak adalah `https://mitra-sagara-update.example`.',
    mechanism: 'Tautan tiruan meniru kata atau susunan domain yang familier. Nama merek di jalur URL tidak membuktikan bahwa domain induknya resmi.',
    signals: [
      'Domain induk tidak cocok dengan alamat yang biasa Anda gunakan.',
      'Ejaan, tanda hubung, atau subdomain terasa tidak wajar.',
      'Teks tautan menjanjikan satu layanan, tetapi alamat tujuan mengarah ke konteks lain.'
    ],
    mistake: 'Menilai tautan dari teks tombol atau simbol gembok saja.',
    prevention: 'Buka layanan melalui bookmark atau aplikasi resmi. Jika ragu, ketik alamat yang sudah Anda ketahui secara manual.',
    response: 'Jangan buka tautan. Bila sudah dibuka, jangan isi data apa pun dan tutup halaman; gunakan perangkat atau kanal resmi untuk memeriksa akun.'
  },
  {
    id: 'urgency', title: 'Urgency tactics', visual: 'clock',
    image: 'assets/education/urgency-tactics.png',
    summary: 'Tekanan waktu atau ancaman kehilangan akses membuat orang melewati pemeriksaan rutin.',
    example: 'Pesan fiktif “Pusat Akun Sagara” meminta tindakan sebelum pukul 17.00, tetapi tidak menjelaskan alasan atau jalur bantuan resmi.',
    mechanism: 'Batas waktu, ancaman pemblokiran, hadiah yang akan berakhir, atau permintaan rahasia dipakai untuk mempercepat keputusan. Tenggat yang masuk akal juga bisa muncul pada pesan sah, jadi periksa konteksnya.',
    signals: [
      'Ancaman atau hadiah menggantikan penjelasan yang dapat diverifikasi.',
      'Pengirim meminta keputusan tanpa memberi waktu memeriksa.',
      'Pesan menyuruh mengabaikan prosedur atau merahasiakan tindakan.'
    ],
    mistake: 'Menganggap semua pesan mendesak pasti phishing, atau sebaliknya mengikuti tenggat tanpa verifikasi.',
    prevention: 'Pisahkan urgensi dari bukti. Periksa pengirim, tujuan, dan prosedur lewat layanan yang biasa digunakan.',
    response: 'Berhenti sejenak. Hubungi bagian terkait melalui direktori resmi dan simpan pesan sebagai bukti bila perlu dilaporkan.'
  },
  {
    id: 'credentials', title: 'Credential requests', visual: 'key',
    image: 'assets/education/credential-requests.png',
    summary: 'Permintaan kata sandi, PIN, OTP, atau persetujuan MFA berisiko mengambil alih akun.',
    example: 'Akun bantuan fiktif di WhatsApp meminta kode verifikasi enam angka agar “tiket dapat ditutup”.',
    mechanism: 'Pelaku meminta rahasia secara langsung atau mengarahkan korban ke formulir tiruan. Kode sekali pakai dapat memberi akses walau kata sandi tidak diketahui.',
    signals: [
      'Ada permintaan OTP, PIN, kata sandi, atau kode pemulihan.',
      'Notifikasi MFA muncul tanpa Anda memulai proses masuk.',
      'Formulir dibuka dari pesan yang tidak diminta.'
    ],
    mistake: 'Membagikan kode karena penelepon sudah mengetahui nama atau nomor tiket.',
    prevention: 'Jangan pernah membagikan kode keamanan. Mulai proses masuk hanya dari aplikasi atau halaman yang dibuka sendiri.',
    response: 'Tolak permintaan, batalkan notifikasi masuk yang tidak Anda mulai, ganti kata sandi dari situs resmi, lalu beri tahu dukungan tepercaya.'
  },
  {
    id: 'qr-phishing', title: 'QR phishing', visual: 'qr',
    image: 'assets/education/qr-phishing.png',
    summary: 'Kode QR dapat menyamarkan alamat tujuan, terutama pada poster atau lampiran yang tidak diminta.',
    example: 'Stiker fiktif “pembaruan parkir” menutupi QR resmi dan mengarah ke `parkir-akses.example`.',
    mechanism: 'QR hanya cara lain untuk membuka URL. Setelah dipindai, halaman tetap perlu diperiksa sebelum informasi dimasukkan.',
    signals: [
      'Stiker terlihat menimpa kode asli atau tidak sesuai tempatnya.',
      'Alamat hasil pindai tidak cocok dengan layanan yang dimaksud.',
      'Halaman meminta login atau pembayaran yang tidak relevan.'
    ],
    mistake: 'Menganggap kode QR aman karena tercetak di tempat umum.',
    prevention: 'Pratinjau alamat sebelum membuka. Untuk pembayaran atau akun, gunakan aplikasi yang sudah terpasang.',
    response: 'Tutup halaman dan jangan lanjutkan. Laporkan kode yang mencurigakan kepada pengelola lokasi melalui kontak resmi.'
  },
  {
    id: 'attachments', title: 'Malicious attachments', visual: 'file',
    image: 'assets/education/malicious-attachments.png',
    summary: 'Lampiran yang tidak diharapkan dapat menyamarkan file berbahaya sebagai dokumen biasa.',
    example: 'Email tagihan fiktif melampirkan `Rincian_Biaya.html` padahal percakapan sebelumnya tidak menyebut dokumen.',
    mechanism: 'Nama file dan ikon dokumen tidak menunjukkan isi sebenarnya. Pelaku sering memakai arsip, formulir, atau dokumen yang meminta tindakan tambahan.',
    signals: [
      'Lampiran tidak sesuai konteks atau tidak pernah diminta.',
      'Nama file menggandakan ekstensi atau memakai tipe yang tidak biasa.',
      'Pengirim mendorong Anda mengaktifkan fitur atau mengunduh aplikasi.'
    ],
    mistake: 'Membuka lampiran hanya karena nama pengirim tampak dikenal.',
    prevention: 'Konfirmasikan dokumen lewat percakapan sebelumnya. Perbarui perangkat lunak keamanan dan jangan aktifkan konten yang tidak diperlukan.',
    response: 'Jangan buka atau teruskan file. Laporkan email. Jika telanjur dibuka, putuskan koneksi bila ada perilaku aneh dan minta bantuan tim IT.'
  },
  {
    id: 'account-takeover', title: 'Account takeover', visual: 'account',
    image: 'assets/education/account-takeover.png',
    summary: 'Akun dapat diambil alih setelah kata sandi atau faktor pemulihan berhasil dicuri.',
    example: 'Pemberitahuan fiktif dari aplikasi “RuangSaku” menyebut ada perangkat baru dan menyarankan pengguna membuka aplikasi sendiri.',
    mechanism: 'Kredensial yang bocor dipakai untuk masuk, mengganti detail pemulihan, atau menyamar sebagai pemilik akun. Peringatan login bisa sah, tetapi tautan dalam pesan tetap perlu diperiksa.',
    signals: [
      'Ada sesi, perangkat, atau perubahan pemulihan yang tidak dikenal.',
      'Anda menerima permintaan MFA yang tidak dimulai sendiri.',
      'Email pemulihan atau notifikasi keamanan tiba-tiba berhenti.'
    ],
    mistake: 'Membalas pesan peringatan atau menekan tautan di dalamnya tanpa memeriksa aplikasi.',
    prevention: 'Aktifkan MFA, gunakan kata sandi unik, dan tinjau sesi aktif dari pengaturan aplikasi yang dibuka langsung.',
    response: 'Gunakan perangkat tepercaya untuk mengamankan akun, akhiri sesi asing, perbarui faktor pemulihan, dan hubungi dukungan resmi.'
  },
  {
    id: 'social-engineering', title: 'Social engineering', visual: 'people',
    image: 'assets/education/social-engineering.png',
    summary: 'Manipulasi percakapan memancing informasi sedikit demi sedikit tanpa terlihat seperti serangan teknis.',
    example: 'Penelepon fiktif mengaku mengatur jadwal wawancara dan meminta foto kartu identitas untuk “mencocokkan data”.',
    mechanism: 'Pelaku memanfaatkan rasa sungkan, kepercayaan, atau keinginan membantu. Informasi kecil dapat digabungkan untuk menebak jawaban pemulihan atau menyusun penipuan berikutnya.',
    signals: [
      'Permintaan data pribadi tidak sebanding dengan tujuan.',
      'Penanya menghindari identifikasi atau jalur resmi.',
      'Informasi diminta lewat percakapan pribadi yang tidak diharapkan.'
    ],
    mistake: 'Memberi informasi karena pertanyaannya terasa ringan atau pewawancara terdengar meyakinkan.',
    prevention: 'Tanyakan alasan dan dasar permintaan. Bagikan data minimum melalui kanal organisasi yang terverifikasi.',
    response: 'Hentikan percakapan, jangan kirim dokumen, dan verifikasi undangan melalui kontak resmi organisasi.'
  }
];

const educationQuizBank = [
  {
    id: 'vendor-reply', channel: 'Email', category: 'Impersonation', difficulty: 'Menengah',
    title: 'Pembaruan tagihan vendor Sagara', sender: 'Mitra Sagara',
    address: 'tagihan@mitra-sagara.example', reply: 'billing-update.example',
    time: 'Hari ini · 09.14', context: 'Percakapan sebelumnya memakai alamat balasan vendor yang berbeda.',
    body: 'Mohon periksa ringkasan tagihan periode ini. Jika ada perubahan data pembayaran, balas email ini sebelum pemrosesan berikutnya.',
    answer: 'phish',
    reason: 'Alamat balasan memakai domain lain dari pengirim dan berbeda dari percakapan sebelumnya. Permintaan perubahan pembayaran perlu verifikasi terpisah.',
    action: 'Jangan membalas atau mengubah pembayaran dari email. Hubungi vendor melalui nomor yang sudah tersimpan.'
  },
  {
    id: 'hr-benefit', channel: 'Email', category: 'Urgency tactics', difficulty: 'Menengah',
    title: 'Jadwal pemilihan benefit karyawan', sender: 'Tim People Sagara',
    address: 'people@ruang-sagara.example', reply: 'people@ruang-sagara.example',
    time: 'Senin · 10.20',
    context: 'Tim HR sebelumnya mengumumkan jadwal pembaruan benefit di portal internal.',
    body: 'Pemilihan benefit tersedia sampai Jumat. Buka portal internal melalui bookmark perusahaan untuk melihat pilihan. Pesan ini tidak meminta balasan atau kode keamanan.',
    answer: 'legit',
    reason: 'Batas waktunya sesuai konteks pengumuman sebelumnya, alamat pengirim dan balasan konsisten, serta pesan meminta pengguna membuka portal yang sudah dikenal tanpa tautan baru.',
    action: 'Tetap buka portal melalui bookmark atau intranet yang biasa digunakan. Jika ragu, konfirmasi ke HR lewat direktori perusahaan.'
  },
  {
    id: 'support-otp', channel: 'WhatsApp', category: 'Credential requests', difficulty: 'Mudah',
    title: 'Tindak lanjut tiket layanan', sender: 'Pusat Bantuan RuangSaku',
    address: '+62 811-2000-1010', reply: 'Nomor baru, belum tersimpan',
    time: 'Hari ini · 14.02', context: 'Tidak ada tiket bantuan yang sedang Anda ajukan.',
    body: 'Agar tiket bisa kami tutup, mohon kirim enam angka kode verifikasi yang baru masuk ke ponsel Anda.',
    answer: 'phish',
    reason: 'Pesan meminta kode verifikasi. Dukungan yang sah tidak memerlukan OTP untuk menutup tiket, dan konteks tiketnya tidak Anda mulai.',
    action: 'Jangan kirim kode. Blokir atau laporkan nomor, lalu hubungi bantuan melalui aplikasi resmi.'
  },
  {
    id: 'parcel-status', channel: 'SMS', category: 'Pesan legitimate', difficulty: 'Menengah',
    title: 'Pembaruan status pengiriman', sender: 'LacakAja Express',
    address: 'Info pengiriman', reply: 'Tidak ada permintaan balasan',
    time: 'Hari ini · 11.36',
    context: 'Anda memang sedang menunggu paket; nomor resi cocok dengan bukti pembelian.',
    body: 'Paket Anda tiba di hub kota tujuan. Jadwal antar berikutnya dapat dilihat dengan membuka aplikasi LacakAja yang sudah terpasang. Tidak ada biaya tambahan yang diminta.',
    answer: 'legit',
    reason: 'Informasi cocok dengan pesanan yang sedang ditunggu dan tidak meminta pembayaran atau data. Pesan mengarahkan ke aplikasi yang sudah terpasang, bukan ke tautan baru.',
    action: 'Periksa status langsung di aplikasi. Pesan aman pun tetap perlu dicocokkan dengan transaksi yang Anda kenal.'
  },
  {
    id: 'shared-doc', channel: 'Email', category: 'Fake links', difficulty: 'Sulit',
    title: 'Dokumen evaluasi bersama', sender: 'Dina dari Tim Operasi',
    address: 'dina@ruang-sagara.example', reply: 'dina@ruang-sagara.example',
    time: 'Hari ini · 08.47',
    context: 'Dina sedang menyiapkan evaluasi, tetapi biasanya dokumen dibagikan lewat drive perusahaan.',
    body: 'Saya sudah merapikan catatan evaluasi. Silakan buka pratinjau lokal ini sebelum rapat: `https://drive-ruang-sagara.example/view/brief`',
    answer: 'phish',
    reason: 'Nama pengirim terlihat cocok, tetapi domain `drive-ruang-sagara.example` bukan domain drive internal yang biasa digunakan. Konteks dokumen tidak membuktikan tujuan tautan aman.',
    action: 'Jangan buka alamat tersebut. Tanyakan kepada Dina melalui chat kerja atau buka drive perusahaan dari bookmark.'
  },
  {
    id: 'office-maintenance', channel: 'Notifikasi akun', category: 'Urgency tactics', difficulty: 'Sulit',
    title: 'Jadwal pemeliharaan ruang kerja', sender: 'Operasional Sagara',
    address: 'ops@ruang-sagara.example', reply: 'ops@ruang-sagara.example',
    time: 'Hari ini · 13.10', context: 'Perawatan jaringan telah diumumkan pada kalender kantor minggu lalu.',
    body: 'Akses jaringan lantai dua dijadwalkan terhenti pukul 18.00 selama pemeliharaan. Jadwal dan ruang terdampak tercantum di kalender kerja. Tidak ada tindakan akun yang diperlukan.',
    answer: 'legit',
    reason: 'Pesan mendesak dalam arti waktunya dekat, tetapi sesuai pengumuman kalender, pengirim konsisten, dan tidak meminta kredensial atau tindakan di luar prosedur.',
    action: 'Cocokkan dengan kalender kerja. Tenggat waktu saja tidak cukup untuk menyimpulkan pesan phishing.'
  },
  {
    id: 'fake-qr', channel: 'Website / QR', category: 'Fake links', difficulty: 'Menengah',
    title: 'QR pembaruan parkir', sender: 'Informasi Parkir Gedung',
    address: 'Poster di area parkir', reply: 'Tidak tersedia',
    time: 'Ditemukan di lobi', context: 'Stiker QR terlihat menutupi sebagian kode lama pada mesin parkir.',
    body: 'Setelah dipindai, pratinjau alamat menunjukkan `https://parkir-akses.example/renew`. Halaman meminta nomor identitas dan pembayaran untuk mempertahankan tarif.',
    answer: 'phish',
    reason: 'Stiker menutupi kode yang sudah ada, domain hasil pindai belum dikenal, dan halaman meminta data serta pembayaran yang tidak dapat diverifikasi dari mesin parkir.',
    action: 'Jangan lanjutkan. Tutup halaman dan tanyakan kepada petugas gedung melalui meja informasi yang dikenal.'
  },
  {
    id: 'account-alert', channel: 'Notifikasi akun', category: 'Account takeover', difficulty: 'Menengah',
    title: 'Peringatan perangkat baru', sender: 'Keamanan RuangSaku',
    address: 'Notifikasi dalam aplikasi', reply: 'Tidak ada balasan',
    time: 'Hari ini · 07.55',
    context: 'Notifikasi terlihat saat aplikasi RuangSaku dibuka dari ikon yang biasa Anda gunakan.',
    body: 'Perangkat baru masuk ke akun Anda. Jika bukan Anda, buka Pengaturan lalu pilih Keamanan untuk meninjau sesi aktif. Kami tidak meminta kode lewat pesan.',
    answer: 'legit',
    reason: 'Peringatan muncul di dalam aplikasi yang dibuka sendiri dan tidak meminta OTP atau membuka tautan luar. Tetap periksa sesi aktif dari pengaturan resmi.',
    action: 'Tinjau sesi aktif di aplikasi. Jika Anda tidak mengenali perangkat, akhiri sesi asing dan perbarui kata sandi.'
  }
];

let educationState = null;


// Function: ensureEducationState
function ensureEducationState() {
  if (!educationState || educationState.accountId !== (currentAccount && currentAccount.id)) {
    educationState = {
      accountId: currentAccount && currentAccount.id,
      selectedLessonId: null,
      checklist: [false, false, false, false, false],
      quizStarted: false,
      quizItems: [],
      quizIndex: 0,
      quizScore: 0,
      quizAnswer: null,
      quizComplete: false,
      quizRunId: null
    };
  }
  return educationState;
}


// Note on the markup below: templates written as plain `...` literals keep their
// line breaks and indentation in the output (whitespace between elements), so
// their layout must not be changed. Fragments built with html`...` have every
// line break and the indentation after it removed, so they can be laid out freely.


// Function: educationLessonDetail
function educationLessonDetail(topic) {
  if (!topic) return '';
  const title = esc((EDUCATION_INDEX[topic.id] || [topic.title])[0]);
  const signalItems = topic.signals.map(signal => `<li>${esc(signal)}</li>`).join('');
  return `<section class="edu-detail" id="edu-detail" aria-labelledby="edu-detail-title">
    <div class="edu-detail-top"><div><h3 id="edu-detail-title" tabindex="-1">${title}</h3></div>
      <button type="button" class="ghost" data-edu-action="back-lessons">Tutup panduan</button></div>
    <p class="edu-detail-lead">${esc(topic.mechanism)}</p>
    <div class="edu-detail-grid">
      <article><span class="edu-detail-index">Contoh fiktif</span><p>${esc(topic.example)}</p></article>
      <article><span class="edu-detail-index">Red flags</span><ul>${signalItems}</ul></article>
      <article><span class="edu-detail-index">Kesalahan umum</span><p>${esc(topic.mistake)}</p></article>
      <article><span class="edu-detail-index">Pencegahan</span><p>${esc(topic.prevention)}</p></article>
      <article class="edu-detail-response"><span class="edu-detail-index">Jika sudah terlanjur</span><p>${esc(topic.response)}</p></article>
    </div>
  </section>`;
}


// Function: educationLessonButton
function educationLessonButton(topic) {
  return html`
    <button type="button" class="edu-learn-link" data-edu-action="open-lesson" data-lesson="${topic.id}" aria-label="Pelajari lebih lanjut tentang ${esc(topic.title)}">
      Pelajari lebih lanjut <span aria-hidden="true">↗</span>
    </button>`;
}


// Function: educationLessonLibrary
// Per topic: [display name, the one sign to check, simulation category used to mark it solved].
const EDUCATION_INDEX = {
  'fake-links': ['Fake Link', 'Tulisan tombol berbeda dengan alamat tujuan.', 'Fake links'],
  'impersonation': ['Impersonation', 'Nama yang dikenal, tapi alamat atau nomornya baru.', 'Impersonation'],
  'credentials': ['OTP Request', 'Pihak resmi tidak pernah meminta kode rahasia.', 'Credential requests'],
  'urgency': ['Urgency', 'Tenggat sempit dan ancaman supaya kamu tidak sempat mengecek.', null],
  'attachments': ['Malicious Attachment', 'File yang tidak diminta, ekstensinya janggal.', 'Malicious attachments'],
  'qr-phishing': ['QR Phishing', 'QR di poster atau lampiran yang alamat tujuannya tersembunyi.', 'QR phishing'],
  'account-takeover': ['Account Takeover', 'Notifikasi login atau reset yang tidak kamu lakukan.', null],
  'social-engineering': ['Social Engineering', 'Pertanyaan kecil yang lama-lama mengorek data penting.', 'Social engineering']
};

function educationLessonLibrary() {
  const recognized = state.recognized || {};
  const order = [
    'fake-links', 'impersonation', 'credentials', 'urgency',
    'attachments', 'qr-phishing', 'account-takeover', 'social-engineering'
  ];
  const items = order.map((id, index) => {
    const topic = educationTopics.find(item => item.id === id);
    const meta = EDUCATION_INDEX[id];
    if (!topic || !meta) return '';
    const solved = meta[2] && recognized[meta[2]] > 0;
    const selected = ensureEducationState().selectedLessonId === id;
    return html`
      <li class="edu-index-item${solved ? ' is-solved' : ''}${selected ? ' is-open' : ''}">
        <button type="button" data-edu-action="open-lesson" data-lesson="${id}" aria-label="${esc(meta[0] + ': ' + meta[1] + ' Buka panduan')}">
          <span class="edu-index-num" aria-hidden="true">${index + 1}</span>
          <span class="edu-index-copy">
            <b>${esc(meta[0])}</b>
            <small>Red flag: ${esc(meta[1])}</small>
          </span>
          ${solved ? '<span class="edu-index-state">Sudah terdeteksi</span>' : ''}
        </button>
      </li>`;
  }).join('');
  return html`<ol class="edu-index">${items}</ol>`;
}


// Function: educationQuizMarkup
function educationQuizMarkup() {
  const state = ensureEducationState();
  if (state.quizComplete) {
    const passed = state.quizScore >= 4;
    const resultMark = passed ? '✓' : '↻';
    const resultAdvice = passed
      ? 'Bagus. Tetap verifikasi konteks sebelum bertindak.'
      : 'Tinjau kembali materi yang relevan, lalu coba putaran baru dengan contoh yang berbeda.';
    return `<div class="edu-quiz-result" aria-live="polite"><div class="edu-result-mark" aria-hidden="true">${resultMark}</div>
      <p class="edu-topic-kicker">Kuis selesai</p><h3>${state.quizScore} dari 5 jawaban tepat</h3>
      <p>${resultAdvice}</p>
      <button type="button" class="primary" data-edu-action="quiz-retry">Ulangi dengan contoh lain</button>
      <p class="edu-quiz-note">Skor ini hanya untuk sesi kuis edukasi dan tidak mengubah XP simulasi.</p></div>`;
  }
  if (!state.quizStarted) {
    return `<div class="edu-quiz-start">
      <div><h3>Siap mencoba lima contoh?</h3>
        <p>Periksa pengirim, alamat, dan alasan permintaan. Ada pesan aman dengan tenggat wajar, jadi jangan menilai dari satu petunjuk saja.</p>
        <button type="button" class="primary" data-edu-action="quiz-start">Mulai kuis</button>
        <p class="edu-quiz-note">Semua skenario fiktif. Jawaban kuis tidak mengubah XP atau riwayat simulasi.</p></div></div>`;
  }
  const question = state.quizItems[state.quizIndex];
  const number = state.quizIndex + 1;
  const answered = state.quizAnswer !== null;
  const correct = answered && state.quizAnswer === question.answer;

  // After answering, the right option is marked correct and a wrong pick is marked wrong.
  const answerButton = (answer, icon, label, hint) => {
    const correctClass = answered && question.answer === answer ? 'is-correct' : '';
    const wrongClass = answered && state.quizAnswer === answer && !correct ? 'is-wrong' : '';
    return html`
      <button type="button" class="edu-answer ${correctClass} ${wrongClass}" data-edu-action="quiz-answer" data-answer="${answer}" ${answered ? 'disabled' : ''}>
        <span class="edu-answer-icon" aria-hidden="true">${icon}</span>
        <span><b>${label}</b><small>${hint}</small></span>
      </button>`;
  };
  const options = `<div class="edu-quiz-options" role="group" aria-label="Pilih klasifikasi pesan">
    ${answerButton('phish', '!', 'Phishing', 'Ada indikasi pesan berisiko')}
    ${answerButton('legit', '✓', 'Legitimate', 'Pesan sesuai konteks dan prosedur')}
  </div>`;

  let feedback = '';
  if (answered) {
    const verdict = correct ? 'Jawaban tepat' : 'Perlu ditinjau kembali';
    const answerLabel = question.answer === 'phish' ? 'Phishing' : 'Legitimate';
    const nextButton = html`
      <button type="button" class="primary" data-edu-action="quiz-next">
        ${number === 5 ? 'Lihat hasil' : 'Pertanyaan berikutnya'} <span aria-hidden="true">→</span>
      </button>`;
    feedback = `<div class="edu-quiz-feedback ${correct ? 'is-good' : 'is-bad'}" aria-live="polite">
    <div class="edu-feedback-title"><b>${verdict}</b><span>Jawaban: ${answerLabel}</span></div>
    <p>${esc(question.reason)}</p><p><b>Langkah aman:</b> ${esc(question.action)}</p>
    ${nextButton}</div>`;
  }

  const senderInitials = esc(question.sender.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase());
  // Inline `code` spans in the fictional message body become <code> elements.
  const messageBody = esc(question.body).replace(/`([^`]+)`/g, '<code>$1</code>');
  const heading = html`
    <div>
      <p class="edu-topic-kicker">Pertanyaan ${number} dari 5</p>
      <h3>Apakah pesan ini phishing atau legitimate?</h3>
    </div>`;
  const progressBar = html`
    <div class="edu-quiz-progress" role="progressbar" aria-label="Progres kuis" aria-valuemin="1" aria-valuemax="5" aria-valuenow="${number}">
      <span style="width:${number * 20}%"></span>
    </div>`;
  const senderLine = html`
    <div>
      <b>${esc(question.sender)}</b>
      <small>${esc(question.channel)} · ${esc(question.time)}</small>
    </div>
    <span class="edu-channel-label">${esc(question.channel)}</span>`;
  const messageMeta = html`
    <div class="edu-message-meta">
      <span>Dari: <b>${esc(question.address)}</b></span>
      <span>Balas ke: <b>${esc(question.reply)}</b></span>
    </div>`;
  const decision = html`
    <aside class="edu-quiz-decision">
      <p class="edu-topic-kicker">Analisis Anda</p>
      <p class="muted">Jangan terburu-buru. Cocokkan identitas, tujuan, dan konteks pesan.</p>
      ${options}
      ${feedback}
    </aside>`;
  return `<div class="edu-quiz-header">${heading}
    ${progressBar}</div>
    <div class="edu-quiz-layout"><article class="edu-message" aria-label="Contoh pesan simulasi">
      <div class="edu-message-head"><div class="edu-message-avatar" aria-hidden="true">${senderInitials}</div>
        ${senderLine}</div>
      <h4>${esc(question.title)}</h4>${messageMeta}
      <p class="edu-message-context"><b>Konteks</b> ${esc(question.context)}</p><p class="edu-message-body">${messageBody}</p>
      <p class="edu-sim-notice">Contoh fiktif untuk pembelajaran. Alamat tidak membuka situs.</p></article>
      ${decision}</div>`;
}


// Function: renderEducationQuiz
function renderEducationQuiz() {
  const target = document.querySelector('#edu-quiz-content');
  if (target) target.innerHTML = educationQuizMarkup();
}


// Function: education
function education(page) {
  const state = ensureEducationState();
  const checklist = [
    ['Periksa identitas pengirim', 'Cocokkan alamat, nomor, dan hubungan dengan konteks pesan.'],
    ['Periksa domain dan tujuan tautan', 'Nama tombol tidak selalu sama dengan alamat tujuan.'],
    ['Nilai alasan dan konteks permintaan', 'Apakah tindakan tersebut wajar dan memang Anda mulai?'],
    ['Verifikasi lewat kanal yang dikenal', 'Gunakan aplikasi, nomor, atau direktori yang sudah tersimpan.'],
    ['Jangan bagikan password atau OTP', 'Pihak tepercaya tidak membutuhkan kode keamanan rahasia Anda.']
  ];
  const detail = educationTopics.find(topic => topic.id === state.selectedLessonId);
  const checkedCount = state.checklist.filter(Boolean).length;
  const checkCounter = html`
    <span class="edu-check-count" id="edu-check-count" aria-live="polite">${checkedCount} dari 5 diperiksa</span>`;
  const checkProgress = html`
    <div class="edu-check-progress" role="progressbar" aria-label="Checklist keamanan" aria-valuemin="0" aria-valuemax="5" aria-valuenow="${checkedCount}">
      <span id="edu-check-progress-fill" style="width:${checkedCount * 20}%"></span>
    </div>`;
  // Plain template: the line breaks inside each row are part of the output.
  const checklistRows = checklist.map(([title, description], index) => {
    const checked = state.checklist[index] ? 'checked' : '';
    return `<label class="edu-check-row ${checked}">
          <input type="checkbox" data-edu-check="${index}" ${checked}><span class="edu-check-box" aria-hidden="true"></span>
          <span class="edu-check-copy"><b>${title}</b><small>${description}</small></span></label>`;
  }).join('');
  page.innerHTML = `<div class="edu-page">
    <section class="edu-lessons" id="edu-lessons" aria-labelledby="edu-lessons-title">
      <div class="edu-intro"><h2 id="edu-lessons-title" tabindex="-1">8 jenis phishing yang paling sering dipakai, masing-masing dengan satu red flag yang bisa dicek dalam 10 detik.</h2>
        <p>Pilih salah satu untuk membaca contoh, kesalahan umum, dan apa yang harus dilakukan kalau sudah terlanjur.</p></div>
      ${detail ? educationLessonDetail(detail) : ''}${educationLessonLibrary()}
    </section>

    <section class="edu-quiz" id="edu-quiz" aria-labelledby="edu-quiz-title">
      <div class="edu-section-head"><div><h2 id="edu-quiz-title" tabindex="-1">Uji cara membaca konteks</h2>
        <p>Lima contoh fiktif, campuran pesan asli dan phishing. Tidak mengubah XP.</p></div></div>
      <div id="edu-quiz-content">${educationQuizMarkup()}</div>
    </section>

    <section class="edu-checklist" aria-labelledby="edu-checklist-title">
      <div class="edu-check-main"><div class="edu-section-head"><div><h2 id="edu-checklist-title">Jeda sebelum merespons</h2>
        <p>Lima pertanyaan sebelum membalas, mengklik, atau membagikan informasi.</p></div>${checkCounter}</div>
        ${checkProgress}
        <div class="edu-check-list">${checklistRows}</div>
      </div>
    </section>
  </div>`;
}


// Function: beginEducationQuiz
// Builds a round of five: two phishing, two legitimate and one more from the rest.
function beginEducationQuiz() {
  const state = ensureEducationState();
  const phishing = shuffled(educationQuizBank.filter(question => question.answer === 'phish')).slice(0, 2);
  const legitimate = shuffled(educationQuizBank.filter(question => question.answer === 'legit')).slice(0, 2);
  const remaining = shuffled(educationQuizBank.filter(question =>
    ![...phishing, ...legitimate].some(chosen => chosen.id === question.id))).slice(0, 1);
  state.quizItems = shuffled([...phishing, ...legitimate, ...remaining]);
  state.quizIndex = 0;
  state.quizScore = 0;
  state.quizAnswer = null;
  state.quizComplete = false;
  state.quizStarted = true;
  state.quizRunId = currentAccount.id + '-quiz-' + Date.now().toString(36) + '-' +
    Math.random().toString(36).slice(2, 7);
  renderEducationQuiz();
}


// Function: syncEducationChecklist
function syncEducationChecklist() {
  const state = ensureEducationState();
  const inputs = [...document.querySelectorAll('[data-edu-check]')];
  if (!inputs.length) return;
  state.checklist = inputs.map(input => input.checked);
  inputs.forEach(input => input.closest('.edu-check-row').classList.toggle('checked', input.checked));
  const checked = state.checklist.filter(Boolean).length;
  const counter = document.querySelector('#edu-check-count');
  const progress = document.querySelector('.edu-check-progress');
  const fill = document.querySelector('#edu-check-progress-fill');
  if (counter) counter.textContent = `${checked} dari 5 diperiksa`;
  if (progress) progress.setAttribute('aria-valuenow', String(checked));
  if (fill) fill.style.width = `${checked * 20}%`;
}
document.querySelector('#app').addEventListener('click', event => {
  const control = event.target.closest('[data-edu-action]');
  if (!control) return;
  const action = control.dataset.eduAction;
  const state = ensureEducationState();


  // Function: scrollTo
  const scrollTo = (selector, focusSelector) => {
    const target = document.querySelector(selector);
    if (!target) return;
    const reducedMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    const focusTarget = focusSelector ? document.querySelector(focusSelector) : target;
    if (focusTarget) {
      window.setTimeout(() => focusTarget.focus({ preventScroll: true }), reducedMotion ? 0 : 280);
    }
  };
  if (action === 'scroll-lessons') {
    scrollTo('#edu-lessons', '#edu-lessons-title');
    return;
  }
  if (action === 'scroll-quiz') {
    scrollTo('#edu-quiz', '#edu-quiz-title');
    return;
  }
  if (action === 'open-lesson') {
    if (!educationTopics.some(topic => topic.id === control.dataset.lesson)) return;
    state.selectedLessonId = control.dataset.lesson;
    education(document.querySelector('#page'));
    scrollTo('#edu-detail', '#edu-detail-title');
    return;
  }
  if (action === 'back-lessons') {
    state.selectedLessonId = null;
    education(document.querySelector('#page'));
    scrollTo('#edu-lessons', '#edu-lessons-title');
    return;
  }
  if (action === 'quiz-start' || action === 'quiz-retry') {
    if (control.disabled) return;
    control.disabled = true;
    beginEducationQuiz();
    return;
  }
  if (action === 'quiz-answer') {
    if (!state.quizStarted || state.quizComplete || state.quizAnswer !== null) return;
    const question = state.quizItems[state.quizIndex];
    if (!question || !['phish', 'legit'].includes(control.dataset.answer)) return;
    control.disabled = true;
    state.quizAnswer = control.dataset.answer;
    if (state.quizAnswer === question.answer) state.quizScore++;
    renderEducationQuiz();
    return;
  }
  if (action === 'quiz-next') {
    if (!state.quizStarted || state.quizComplete || state.quizAnswer === null) return;
    control.disabled = true;
    if (state.quizIndex >= state.quizItems.length - 1) {
      state.quizComplete = true;
      // Record the finished quiz once per run so it counts toward the activity calendar.
      const progress = currentAccount && currentAccount.progress;
      if (progress && !Array.isArray(progress.learningEvents)) progress.learningEvents = [];
      if (progress && state.quizRunId &&
        !progress.learningEvents.some(item => item.id === state.quizRunId)) {
        progress.learningEvents.push({ id: state.quizRunId, type: 'quiz', at: new Date().toISOString() });
        updateBadges();
        save();
      }
    }
    else {
      state.quizIndex++;
      state.quizAnswer = null;
    }
    renderEducationQuiz();
  }
});
document.querySelector('#app').addEventListener('change', event => {
  if (event.target.matches('[data-edu-check]')) syncEducationChecklist();
});
