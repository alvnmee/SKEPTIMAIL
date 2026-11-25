// Entirely fictional scenario data. URLs are inert text under reserved .example domains.
window.phishGuardScenarios = [
  {
    id: 'wa-hr-reset-e', channel: 'WhatsApp', category: 'Impersonation', difficulty: 'Easy', answer: 'phish',
    title: 'Pembaruan data benefit', subject: 'Chat langsung', time: '09.14',
    sender: { name: 'Rani Wibowo', initials: 'RW', role: 'HR Operations · Lazuardi Kreasi (fiktif)', address: 'Rani Wibowo · akun baru', domain: 'pesan-lazuardi.example', color: '#157d74' },
    context: 'Belum ada percakapan sebelumnya dari kontak ini. Nama perusahaan dan karyawan di simulasi seluruhnya fiktif.',
    message: 'Pagi, saya Rani dari HR. Data benefit tahunan perlu disinkronkan sebelum pukul 10 agar pilihan asuransi tidak tertunda. Buka formulir internal dan masukkan kode verifikasi yang dikirim ke ponsel: benefit-lazuardi.example/form',
    link: { label: 'benefit-lazuardi.example/form', url: 'https://benefit-lazuardi.example/form', expectedDomain: 'lazuarikreasi.example' },
    feedback: { summary: 'Pesan ini phishing yang menyamar sebagai staf HR.', clues: ['Kontak belum pernah digunakan dan tidak terverifikasi sebagai kanal HR.', 'Formulir berada di benefit-lazuardi.example, bukan domain internal Lazuardi Kreasi.', 'Batas waktu singkat dipasangkan dengan permintaan kode verifikasi.'], action: 'Jangan buka formulir atau kirim kode. Hubungi HR dari direktori perusahaan yang sudah dikenal.' }
  },
  {
    id: 'sms-parcel-fee-e', channel: 'SMS', category: 'Fake links', difficulty: 'Easy', answer: 'phish',
    title: 'Biaya penjadwalan paket', subject: 'SMS masuk', time: '11.32',
    sender: { name: 'LintasKota Paket', initials: 'LP', role: 'Notifikasi pengiriman (fiktif)', address: 'ID pengirim: LK-PKT', domain: 'lk-paket-fee.example', color: '#b06c36' },
    context: 'Tidak ada nomor resi atau nama penerima yang cocok dengan konteks kiriman simulasi.',
    message: 'Paket LK-2048 tertahan karena alamat tidak lengkap. Konfirmasi pengiriman ulang dengan biaya Rp2.000 di lk-paket-fee.example/atur sebelum kurir kembali.',
    link: { label: 'lk-paket-fee.example/atur', url: 'https://lk-paket-fee.example/atur', expectedDomain: 'lintaskota.example' },
    feedback: { summary: 'SMS ini phishing berkedok layanan pengiriman fiktif.', clues: ['Identitas pengirim tidak memakai domain layanan yang disebut.', 'Biaya kecil diminta melalui halaman pembayaran yang tidak dikenal.', 'Pesan tidak menyebut kanal aplikasi atau nomor resi yang bisa diverifikasi.'], action: 'Jangan membayar lewat tautan. Periksa resi hanya pada aplikasi atau kanal pengiriman yang Anda gunakan.' }
  },
  {
    id: 'email-shared-file-e', channel: 'Email', category: 'Suspicious sender', difficulty: 'Easy', answer: 'phish',
    title: 'Dokumen rapat dibagikan', subject: 'Akses notulen rapat Q3', time: '08.06',
    sender: { name: 'Ruang Dokumen', initials: 'RD', role: 'Layanan berbagi file (fiktif)', address: 'akses@ruangdokumen-share.example', domain: 'ruangdokumen-share.example', color: '#6655a5' },
    context: 'Anda tidak sedang menunggu dokumen Q3 dan tidak mengenali pengirim.',
    message: 'Sebuah dokumen dibagikan kepada Anda. Masuk untuk membaca notulen dan komentar tim sebelum tautan kedaluwarsa hari ini.',
    link: { label: 'Buka dokumen: notulen-q3', url: 'https://ruangdokumen-share.example/open/notulen-q3', expectedDomain: 'ruangdokumen.example' },
    feedback: { summary: 'Email ini phishing melalui undangan dokumen yang tidak diminta.', clues: ['Nama layanan tidak cocok dengan domain “share” yang dipakai pengirim.', 'Anda tidak memiliki konteks atau undangan dokumen tersebut.', 'Pesan mendorong login dari tautan yang diberikan.'], action: 'Jangan masuk melalui email. Konfirmasi kepada pemilik dokumen lewat kanal yang sudah dikenal.' }
  },
  {
    id: 'notice-account-verify-e', channel: 'Notifikasi akun', category: 'Credential requests', difficulty: 'Easy', answer: 'phish',
    title: 'Sesi akun baru terdeteksi', subject: 'Pusat Akun AwanKita', time: '07.48',
    sender: { name: 'AwanKita Security', initials: 'AK', role: 'Notifikasi keamanan (fiktif)', address: 'security@awankita-alert.example', domain: 'awankita-alert.example', color: '#2379a6' },
    context: 'Notifikasi ini tidak muncul di pusat keamanan akun simulasi yang dibuka secara mandiri.',
    message: 'Sesi baru terdeteksi dari perangkat yang belum dikenal. Tinjau aktivitas dan konfirmasi kata sandi untuk menjaga sesi tetap aktif.',
    link: { label: 'Tinjau aktivitas akun', url: 'https://awankita-alert.example/session/check', expectedDomain: 'awankita.example' },
    feedback: { summary: 'Notifikasi ini mencoba mengarahkan pengguna ke halaman kredensial tiruan.', clues: ['Alamat pengirim menggunakan domain alert terpisah dari awankita.example.', 'Pusat akun meminta kata sandi melalui tautan di pesan.', 'Notifikasi tidak cocok dengan riwayat keamanan yang terlihat di akun simulasi.'], action: 'Jangan masukkan kata sandi. Buka pusat keamanan melalui alamat yang Anda ketik sendiri.' }
  },
  {
    id: 'email-hr-survey-e', channel: 'Email', category: 'Legitimate message', difficulty: 'Easy', answer: 'legit',
    title: 'Survei pilihan benefit', subject: 'Survei benefit tahunan dibuka', time: '10.20',
    sender: { name: 'Tim People Lazuardi Kreasi', initials: 'LK', role: 'HR · Lazuardi Kreasi (fiktif)', address: 'people@lazuarikreasi.example', domain: 'lazuarikreasi.example', color: '#168d83' },
    context: 'Email ini mengikuti pengumuman benefit yang sebelumnya muncul di portal karyawan Lazuardi Kreasi fiktif.',
    message: 'Survei pilihan benefit dibuka sampai Jumat. Anda dapat membacanya sekarang atau kembali nanti melalui menu Benefit di portal karyawan. Tidak perlu mengirim kata sandi atau kode melalui email.',
    link: { label: 'Portal karyawan · menu Benefit', url: 'https://people.lazuarikreasi.example/benefit', expectedDomain: 'people.lazuarikreasi.example' },
    feedback: { summary: 'Ini pesan legitimate dalam konteks simulasi.', clues: ['Alamat pengirim dan domain portal sesuai dengan domain Lazuardi Kreasi fiktif.', 'Pesan memberi pilihan untuk membuka portal sendiri, bukan meminta kredensial lewat email.', 'Batas waktu survei sampai Jumat merupakan jadwal wajar dan tidak disertai ancaman.'], action: 'Tetap buka portal dari bookmark atau alamat yang sudah dikenal jika ingin mengisi survei. Bila ragu, konfirmasi ke HR.' }
  },
  {
    id: 'sms-delivery-status-e', channel: 'SMS', category: 'Legitimate message', difficulty: 'Easy', answer: 'legit',
    title: 'Pembaruan status kiriman', subject: 'SMS status pengiriman', time: '14.05',
    sender: { name: 'LintasKota Paket', initials: 'LP', role: 'Notifikasi pengiriman (fiktif)', address: 'ID pengirim: LK-INFO', domain: 'lintaskota.example', color: '#b06c36' },
    context: 'Di akun simulasi terdapat kiriman LK-2048 yang sudah dijadwalkan hari ini.',
    message: 'Kiriman LK-2048 sedang menuju alamat tujuan. Perkiraan tiba 15.00–17.00. Tidak diperlukan pembayaran atau konfirmasi data. Lihat status dari aplikasi LintasKota bila diperlukan.',
    link: null,
    feedback: { summary: 'Pesan ini legitimate sebagai pembaruan status kiriman dalam simulasi.', clues: ['Nomor kiriman cocok dengan konteks pengiriman yang sudah ada.', 'Tidak ada tautan pembayaran, permintaan data, atau instruksi login.', 'Rentang waktu kedatangan disampaikan sebagai informasi, bukan ancaman.'], action: 'Anda dapat mengecek status lewat aplikasi resmi yang sudah terpasang. Jika detail kiriman tidak cocok, verifikasi sebelum bertindak.' }
  },
  {
    id: 'email-benefit-m', channel: 'Email', category: 'Fake links', difficulty: 'Medium', answer: 'phish',
    title: 'Perubahan pilihan benefit', subject: 'Konfirmasi paket kesehatan 2026', time: '08.41',
    sender: { name: 'Nara · People Services', initials: 'NP', role: 'People Services · Lazuardi Kreasi (fiktif)', address: 'nara@lazuardi-kreasi.example', domain: 'lazuardi-kreasi.example', replyTo: 'benefit@lk-people.example', color: '#208778' },
    context: 'Lazuardi Kreasi fiktif memang mengumumkan periode perubahan benefit. Pengumuman itu meminta staf membuka portal secara mandiri.',
    message: 'Halo, periode perubahan paket kesehatan sudah dibuka sampai 30 November. Ringkasan pilihan tersedia untuk ditinjau; perubahan tidak langsung disimpan sebelum Anda menyetujuinya. Silakan lihat ringkasan pada portal benefit.',
    link: { label: 'Lihat ringkasan benefit', url: 'https://lk-people.example/review/benefit-26', expectedDomain: 'lazuarikreasi.example' },
    feedback: { summary: 'Email terlihat profesional, tetapi tautan mengarah ke domain lain.', clues: ['Alamat pengirim memakai lazuardi-kreasi.example, sedangkan tautan berada di lk-people.example.', 'Lazuardi Kreasi fiktif meminta staf mengetik alamat portal sendiri untuk perubahan benefit.', 'Bahasa dan jadwalnya masuk akal, sehingga pemeriksaan domain menjadi indikator utama.'], action: 'Jangan ikuti tautan. Buka portal dari bookmark atau tanyakan pada HR melalui kontak internal.' }
  },
  {
    id: 'wa-colleague-doc-m', channel: 'WhatsApp', category: 'Legitimate message', difficulty: 'Medium', answer: 'legit',
    title: 'Dokumen brief kampanye', subject: 'Percakapan tim desain', time: '13.18',
    sender: { name: 'Dimas Ardi', initials: 'DA', role: 'Rekan tim desain · Lazuardi Kreasi (fiktif)', address: 'Kontak tersimpan · Dimas Ardi', domain: 'ruangkerja.lazuarikreasi.example', color: '#477a9b' },
    context: 'Percakapan sebelumnya membahas brief kampanye; kontak Dimas sudah tersimpan di grup proyek.',
    message: 'Aku sudah unggah versi final brief yang kita bahas. Kalau sempat, cek bagian jadwal sebelum rapat pukul 14.00. Dokumen juga tetap bisa dibuka lewat folder Proyek di RuangKerja.',
    link: { label: 'brief-kampanye-v4.pdf', url: 'https://ruangkerja.lazuarikreasi.example/proyek/brief-kampanye-v4', expectedDomain: 'ruangkerja.lazuarikreasi.example' },
    feedback: { summary: 'Pesan ini legitimate berdasarkan konteks percakapan dan tujuan tautan.', clues: ['Kontak tersimpan dan isi percakapan nyambung dengan pembahasan sebelumnya.', 'Domain dokumen merupakan subdomain ruang kerja Lazuardi Kreasi fiktif.', 'Ada jalur alternatif yang konsisten: folder Proyek di RuangKerja.'], action: 'Buka dokumen dari aplikasi kerja atau folder yang sudah dikenal. Jika nama atau versi file berbeda, konfirmasi kepada rekan.' }
  },
  {
    id: 'sms-bank-review-m', channel: 'SMS', category: 'Impersonation', difficulty: 'Medium', answer: 'phish',
    title: 'Tinjau aktivitas transaksi', subject: 'Peringatan transaksi Bank Sagara (fiktif)', time: '16.22',
    sender: { name: 'Bank Sagara', initials: 'BS', role: 'Pemberitahuan transaksi (fiktif)', address: 'ID pengirim: SGARA-ALERT', domain: 'sagara-aktivitas.example', color: '#356f99' },
    context: 'Tidak ada transaksi bernilai tersebut dalam daftar aktivitas akun simulasi.',
    message: 'Transaksi Rp1.480.000 di Toko Sembada sedang ditinjau. Jika Anda tidak mengenalnya, buka aktivitas pada aplikasi Bank Sagara untuk memeriksa. Jangan membalas SMS ini.',
    link: { label: 'Aktivitas transaksi', url: 'https://sagara-aktivitas.example/activity/review', expectedDomain: 'banksagara.example' },
    feedback: { summary: 'Notifikasi meniru bank fiktif dan mengarahkan ke domain yang berbeda.', clues: ['Domain sagara-aktivitas.example bukan domain bank yang tercantum di konteks akun simulasi.', 'Nama transaksi spesifik dipakai untuk membuat pesan terasa personal, tetapi tidak cocok dengan riwayat.', 'Permintaan untuk tidak membalas tidak membuktikan pesan berasal dari bank.'], action: 'Jangan buka tautan. Periksa transaksi dari aplikasi fiktif Bank Sagara yang sudah Anda buka sendiri.' }
  },
  {
    id: 'web-sso-m', channel: 'Website', category: 'Credential requests', difficulty: 'Medium', answer: 'phish',
    title: 'Portal sinkronisasi kerja', subject: 'Pratinjau halaman login fiktif', time: 'Sesi latihan',
    sender: { name: 'RuangKerja SSO', initials: 'RK', role: 'Portal login simulasi', address: 'ruangkerja-sso.example', domain: 'ruangkerja-sso.example', color: '#5e68a4' },
    context: 'Alamat portal Lazuardi Kreasi fiktif yang tersimpan di bookmark adalah sso.lazuarikreasi.example.',
    message: 'RuangKerja meminta sinkronisasi sesi sebelum Anda melihat dokumen proyek. Halaman pratinjau menampilkan kolom email dan password, tetapi tidak akan menerima input.',
    link: { label: 'ruangkerja-sso.example/login', url: 'https://ruangkerja-sso.example/login', expectedDomain: 'sso.lazuarikreasi.example' },
    feedback: { summary: 'Ini halaman login tiruan pada domain yang tidak cocok.', clues: ['Domain halaman berbeda dari bookmark SSO yang diketahui.', 'Nama “RuangKerja SSO” tidak cukup untuk membuktikan keaslian halaman.', 'Halaman meminta kredensial sebelum menampilkan dokumen yang disebut.'], action: 'Jangan memasukkan data apa pun. Tutup pratinjau dan buka portal dari bookmark tepercaya yang Anda simpan sendiri.' }
  },
  {
    id: 'email-vendor-invoice-m', channel: 'Email', category: 'Legitimate message', difficulty: 'Medium', answer: 'legit',
    title: 'Invoice layanan bulan ini', subject: 'Invoice LK-INV-2048 tersedia', time: '09.02',
    sender: { name: 'Bima · Vendor AwanKita', initials: 'BA', role: 'Administrasi · Vendor AwanKita (fiktif)', address: 'bima@awanlayanan.example', domain: 'awanlayanan.example', color: '#277a88' },
    context: 'Invoice LK-INV-2048 tercatat di ERP perusahaan dan memakai kontak vendor yang telah disetujui.',
    message: 'Invoice bulan ini sudah tersedia di portal vendor. Mohon cocokkan nomor dokumen dengan ERP sebelum tenggat pembayaran Jumat. Perubahan rekening tidak disampaikan melalui email ini.',
    link: { label: 'Portal vendor · LK-INV-2048', url: 'https://vendor.awanlayanan.example/invoices/LK-INV-2048', expectedDomain: 'awanlayanan.example' },
    feedback: { summary: 'Pesan legitimate dengan tenggat yang masuk akal dan proses verifikasi yang jelas.', clues: ['Pengirim dan portal memakai domain vendor fiktif yang sama.', 'Nomor invoice cocok dengan catatan ERP pada konteks.', 'Pesan secara eksplisit meminta pencocokan di ERP dan tidak meminta perubahan rekening.'], action: 'Cocokkan dokumen di ERP sebelum pembayaran. Tetap konfirmasi melalui prosedur vendor untuk perubahan sensitif.' }
  },
  {
    id: 'notice-cloud-session-m', channel: 'Notifikasi akun', category: 'Suspicious sender', difficulty: 'Medium', answer: 'phish',
    title: 'Ringkasan login mingguan', subject: 'AwanKita · ringkasan keamanan', time: '06.50',
    sender: { name: 'AwanKita Account Team', initials: 'AK', role: 'Notifikasi keamanan (fiktif)', address: 'account@awankita-security.example', domain: 'awankita-security.example', color: '#2379a6' },
    context: 'Pusat keamanan akun simulasi mengirim ringkasan di dalam aplikasi; tidak ada sesi baru yang tercatat.',
    message: 'Ringkasan keamanan mingguan Anda siap. Satu sesi browser masih aktif dari perangkat yang pernah dipakai. Lihat informasi perangkat untuk menutup sesi yang tidak diperlukan.',
    link: { label: 'Lihat perangkat aktif', url: 'https://awankita-security.example/devices', expectedDomain: 'awankita.example' },
    feedback: { summary: 'Isi pesan cukup tenang, tetapi domain pengirim berbeda dari layanan akun.', clues: ['Pengirim menggunakan awankita-security.example alih-alih domain akun awankita.example.', 'Akun simulasi menyediakan ringkasan yang sama di dalam aplikasi, tanpa tautan email.', 'Tidak ada sesi baru yang cocok dengan notifikasi ini.'], action: 'Buka aplikasi secara mandiri untuk memeriksa perangkat aktif, lalu laporkan pesan bila domain tidak dikenal.' }
  },
  {
    id: 'email-vendor-bank-h', channel: 'Email', category: 'Payment change', difficulty: 'Hard', answer: 'phish',
    title: 'Pembaruan rekening operasional vendor', subject: 'Administrasi pembayaran · efektif periode berikutnya', time: '10.37',
    sender: { name: 'Maya S. · Awan Layanan', initials: 'MS', role: 'Finance Operations · vendor fiktif', address: 'maya@awanlayanan.example', domain: 'awanlayanan.example', replyTo: 'finance@awanlayanan-pay.example', color: '#277a88' },
    context: 'Awan Layanan adalah vendor fiktif yang benar dalam simulasi ini. Perubahan rekening harus diverifikasi melalui kontak kontrak dan dua persetujuan di ERP.',
    message: 'Selamat pagi, untuk rekonsiliasi periode berikutnya kami memperbarui instruksi pembayaran. Tidak perlu mengubah invoice yang sedang berjalan. Silakan minta lembar perubahan melalui balasan email ini agar tim kami mengirimkan dokumen pendukung.',
    link: null,
    feedback: { summary: 'Ini upaya business email compromise yang halus. Nama pengirim dan domain terlihat benar, tetapi alamat balasan mengarah ke domain berbeda.', clues: ['Reply-To finance@awanlayanan-pay.example tidak sama dengan domain vendor awanlayanan.example.', 'Permintaan menyangkut perubahan rekening dan meminta proses dilanjutkan melalui balasan email.', 'Prosedur vendor yang diketahui mensyaratkan kontak kontrak dan dua persetujuan ERP.'], action: 'Jangan membalas atau mengubah rekening. Hubungi vendor memakai nomor pada kontrak, lalu ikuti proses verifikasi ERP.' }
  },
  {
    id: 'notice-bank-activity-h', channel: 'Notifikasi akun', category: 'Legitimate message', difficulty: 'Hard', answer: 'legit',
    title: 'Transaksi tertunda untuk ditinjau', subject: 'Bank Sagara · aktivitas kartu', time: '18.46',
    sender: { name: 'Bank Sagara', initials: 'BS', role: 'Notifikasi aplikasi (fiktif)', address: 'Pusat notifikasi aplikasi', domain: 'app.banksagara.example', color: '#356f99' },
    context: 'Aplikasi fiktif Bank Sagara yang dibuka secara mandiri menunjukkan transaksi di Pasar Nusa dengan nilai yang sama.',
    message: 'Transaksi Rp286.000 di Pasar Nusa menunggu konfirmasi karena terminal sedang offline. Tinjau detail pada menu Kartu dalam aplikasi. Jika Anda tidak mengenal transaksi, bekukan kartu dari aplikasi atau hubungi nomor bantuan yang tercantum pada kartu.',
    link: null,
    feedback: { summary: 'Ini notifikasi legitimate dari pusat aplikasi simulasi. Isinya tetap perlu diperiksa karena transaksi tidak dikenal bisa berisiko.', clues: ['Notifikasi berasal dari pusat aplikasi, bukan tautan dari SMS atau email.', 'Nilai dan nama merchant cocok dengan transaksi yang terlihat pada aplikasi simulasi.', 'Tindakan diarahkan ke menu Kartu atau nomor bantuan yang tersedia secara independen.'], action: 'Periksa transaksi di aplikasi yang dibuka sendiri. Bila bukan milik Anda, gunakan kontrol kartu dalam aplikasi atau kanal bantuan yang sudah dikenal.' }
  },
  {
    id: 'wa-support-remote-h', channel: 'WhatsApp', category: 'Impersonation', difficulty: 'Hard', answer: 'phish',
    title: 'Bantuan sinkronisasi perangkat', subject: 'Chat dukungan pelanggan', time: '15.11',
    sender: { name: 'Ari · Dukungan AwanKita', initials: 'AA', role: 'Dukungan pelanggan (fiktif)', address: 'Nomor baru · belum tersimpan', domain: 'awankita-bantuan.example', color: '#2379a6' },
    context: 'Anda membuka tiket simulasi tentang sinkronisasi perangkat. Pusat bantuan menyatakan dukungan tidak meminta instalasi alat kendali jarak jauh.',
    message: 'Halo, saya Ari yang menangani tiket #AK-884. Agar kami bisa melihat masalah sinkronisasi, apakah Anda bersedia memasang alat bantu sesi sementara? Saya bisa menunggu sampai selesai rapat Anda.',
    link: { label: 'Panduan sesi bantuan', url: 'https://awankita-bantuan.example/session-helper', expectedDomain: 'awankita.example' },
    feedback: { summary: 'Pesan memakai konteks tiket yang masuk akal, tetapi meminta akses perangkat melalui domain dukungan yang tidak dikenal.', clues: ['Nomor pengirim belum tersimpan dan domainnya berbeda dari awankita.example.', 'Pusat bantuan menyatakan tidak memakai alat kendali jarak jauh.', 'Nada sopan dan kesediaan menunggu bukan bukti identitas pengirim.'], action: 'Jangan memasang alat atau memberi akses perangkat. Buka tiket melalui pusat bantuan yang Anda ketik sendiri.' }
  },
  {
    id: 'email-shared-reply-h', channel: 'Email', category: 'Suspicious sender', difficulty: 'Hard', answer: 'phish',
    title: 'Komentar baru di dokumen bersama', subject: 'Komentar pada “Rencana Peluncuran Q4”', time: '12.03',
    sender: { name: 'Dimas Ardi', initials: 'DA', role: 'Rekan tim · nama tampilan dapat dipalsukan', address: 'dimas.ardi@lazuarikreasi.example', domain: 'lazuarikreasi.example', replyTo: 'dimas@lazuarikreasi-docs.example', color: '#477a9b' },
    context: 'Anda memang bekerja dengan Dimas dan dokumen Rencana Peluncuran Q4 ada. Notifikasi komentar biasanya berasal dari RuangKerja.',
    message: 'Dimas menambahkan komentar: “Saya sudah merapikan proyeksi jadwal, mohon cek dua catatan sebelum review sore.” Tidak ada file lampiran pada pesan ini.',
    link: { label: 'Buka komentar dokumen', url: 'https://lazuarikreasi-docs.example/comments/q4-plan', expectedDomain: 'ruangkerja.lazuarikreasi.example' },
    feedback: { summary: 'Pesan ini meniru konteks rekan kerja. Detail reply-to dan domain dokumen tidak sesuai dengan platform yang digunakan tim.', clues: ['Nama tampilan dan alamat From saja tidak menjamin identitas pengirim.', 'Reply-To memakai lazuarikreasi-docs.example yang tidak tercatat sebagai domain kerja.', 'Komentar seharusnya dibuka melalui RuangKerja, bukan domain dokumen baru.'], action: 'Jangan membalas atau membuka tautan. Cari dokumen dari RuangKerja dan tanyakan kepada Dimas melalui chat tim.' }
  },
  {
    id: 'web-portal-safe-h', channel: 'Website', category: 'Legitimate message', difficulty: 'Hard', answer: 'legit',
    title: 'Portal kerja dari bookmark', subject: 'Halaman login simulasi', time: 'Sesi latihan',
    sender: { name: 'RuangKerja Lazuardi Kreasi', initials: 'RK', role: 'Portal internal Lazuardi Kreasi', address: 'sso.lazuarikreasi.example', domain: 'sso.lazuarikreasi.example', color: '#477a9b' },
    context: 'Alamat halaman sama persis dengan bookmark SSO yang dikenal dan halaman dibuka dari bookmark, bukan dari pesan.',
    message: 'Portal menampilkan nama organisasi fiktif dan status koneksi. Halaman latihan ini hanya pratinjau; kolom login nonaktif dan tidak menerima data apa pun.',
    link: { label: 'sso.lazuarikreasi.example', url: 'https://sso.lazuarikreasi.example', expectedDomain: 'sso.lazuarikreasi.example' },
    feedback: { summary: 'Halaman ini dinilai legitimate dalam simulasi karena alamat dan jalur akses cocok dengan bookmark yang dikenal.', clues: ['Domain sama persis dengan bookmark portal yang diketahui.', 'Halaman dibuka dari bookmark, bukan dari tautan pesan yang tidak diminta.', 'Kolom login hanya pratinjau dan tidak menerima input pada prototype.'], action: 'Untuk layanan nyata, tetap cocokkan domain dan gunakan bookmark tepercaya. Jika ada perbedaan kecil, hentikan proses dan verifikasi.' }
  },
  {
    id: 'sms-reroute-h', channel: 'SMS', category: 'Legitimate message', difficulty: 'Hard', answer: 'legit',
    title: 'Batas waktu ubah jadwal kiriman', subject: 'SMS pengiriman LintasKota', time: '16.54',
    sender: { name: 'LintasKota Paket', initials: 'LP', role: 'Notifikasi pengiriman simulasi', address: 'ID pengirim: LK-INFO', domain: 'lintaskota.example', color: '#b06c36' },
    context: 'Kiriman LK-2048 di akun simulasi dijadwalkan tiba hari ini. Aplikasi menunjukkan opsi ubah jadwal sebelum 17.00.',
    message: 'Kurir memperkirakan tiba 17.30–18.00. Jika Anda perlu mengubah jadwal, opsi tersedia sampai pukul 17.00 melalui menu Kiriman di aplikasi. Tidak ada biaya untuk perubahan jadwal ini.',
    link: null,
    feedback: { summary: 'Pesan legitimate dengan tenggat yang relevan terhadap jadwal kiriman.', clues: ['ID kiriman cocok dengan konteks akun simulasi.', 'Instruksi mengarahkan pengguna membuka menu Kiriman di aplikasi, bukan tautan SMS.', 'Batas waktu terkait jadwal kurir dan tidak meminta pembayaran atau data pribadi.'], action: 'Jika ingin mengubah jadwal, buka aplikasi yang sudah terpasang. Tenggat yang wajar tetap sebaiknya diverifikasi di aplikasi.' }
  },
  {
    id: 'qr-parking-fee-e', channel: 'QR Code', category: 'QR phishing', difficulty: 'Easy', answer: 'phish',
    title: 'Pembayaran parkir tertunda', subject: 'QR pada papan keluar parkir', time: '10.16',
    sender: { name: 'Parkir Puspa', initials: 'PP', role: 'Informasi area parkir fiktif', address: 'Papan QR di area keluar', domain: 'parkir-puspa.example', color: '#477a9b' },
    context: 'Papan parkir memiliki stiker QR tambahan dengan instruksi membayar denda sebelum meninggalkan lokasi. Tidak ada nomor kendaraan atau tiket yang cocok.',
    message: 'Tiket parkir Anda belum tercatat. Pindai kode pada papan ini untuk melunasi biaya Rp3.000 sebelum pukul 10.30: parkir-puspa-bayar.example/selesaikan',
    link: { label: 'parkir-puspa-bayar.example/selesaikan', url: 'https://parkir-puspa-bayar.example/selesaikan', expectedDomain: 'parkir-puspa.example' },
    feedback: { summary: 'QR mengarah ke domain pembayaran berbeda dan pesan tidak cocok dengan tiket parkir.', clues: ['Stiker QR tambahan dapat menutupi kode resmi pada papan.', 'Domain parkir-puspa-bayar.example tidak sama dengan domain layanan yang dicantumkan.', 'Pesan memakai denda kecil dan tenggat singkat tanpa nomor tiket yang bisa dicocokkan.'], action: 'Jangan membayar dari QR tersebut. Tanyakan kepada petugas atau gunakan mesin pembayaran yang sudah dikenal.' }
  },
  {
    id: 'email-apk-tax-e', channel: 'Email', category: 'Malicious attachments', difficulty: 'Easy', answer: 'phish',
    title: 'Rincian pajak karyawan', subject: 'Dokumen pajak perlu dipasang', time: '08.52',
    sender: { name: 'Pusat Pajak Lazuardi', initials: 'PL', role: 'Pengirim yang mengaku layanan pajak', address: 'dokumen@pajak-lazuardi-update.example', domain: 'pajak-lazuardi-update.example', color: '#8c5b9e' },
    context: 'Tidak ada pengumuman bahwa layanan pajak perusahaan akan mengirim aplikasi melalui email.',
    message: 'Rincian potongan pajak tahun ini tersedia pada file terlampir. Pasang aplikasi Android untuk membukanya sebelum data dikunci.',
    link: null,
    attachment: { name: 'Rincian-Pajak-2026.apk', type: 'APK', size: '2,4 MB' },
    feedback: { summary: 'Email ini meminta pemasangan file APK yang tidak wajar untuk dokumen pajak.', clues: ['Dokumen pajak tidak perlu dibuka dengan aplikasi Android dari lampiran email.', 'Alamat pengirim memakai domain pembaruan yang tidak dikenal.', 'Ancaman data dikunci mendorong tindakan cepat.'], action: 'Jangan unduh atau pasang file. Hapus pesan dan tanyakan kepada HR atau tim TI melalui kontak internal.' }
  },
  {
    id: 'wa-lunch-room-e', channel: 'WhatsApp', category: 'Legitimate message', difficulty: 'Easy', answer: 'legit',
    title: 'Perubahan ruang makan siang', subject: 'Grup Tim Produk', time: '11.05',
    sender: { name: 'Mira Putri', initials: 'MP', role: 'Rekan tim produk · kontak tersimpan', address: 'Kontak tersimpan · Mira Putri', domain: 'ruangkerja.lazuarikreasi.example', color: '#168d83' },
    context: 'Mira adalah anggota grup proyek yang sudah dikenal. Pesan sebelumnya membahas jadwal makan siang tim.',
    message: 'Meja kita pindah ke sisi taman karena ruang utama dipakai rapat. Aku sudah kabari yang lain di grup. Sampai pukul 12 ya; tidak ada yang perlu dibuka atau dibayar.',
    link: null,
    feedback: { summary: 'Pesan sesuai dengan percakapan grup yang sudah ada dan tidak meminta tindakan sensitif.', clues: ['Pengirim adalah kontak tersimpan dalam grup yang relevan.', 'Perubahan tempat makan konsisten dengan percakapan sebelumnya.', 'Tidak ada tautan, permintaan kode, atau tekanan untuk membagikan data.'], action: 'Jika detail tempat masih kurang jelas, tanyakan di grup yang sama sebelum berangkat.' }
  },
  {
    id: 'email-training-reminder-e', channel: 'Email', category: 'Legitimate message', difficulty: 'Easy', answer: 'legit',
    title: 'Pengingat kelas keamanan', subject: 'Kelas pengenalan keamanan besok', time: '15.38',
    sender: { name: 'Tim Pembelajaran Lazuardi', initials: 'TP', role: 'Learning & Development · fiktif', address: 'belajar@lazuarikreasi.example', domain: 'lazuarikreasi.example', color: '#277b89' },
    context: 'Kelas keamanan tercantum pada kalender internal dan pengumuman portal karyawan sebelumnya.',
    message: 'Pengingat: kelas pengenalan keamanan dimulai besok pukul 09.00 di ruang Kenari. Materi juga tersedia melalui menu Pembelajaran pada portal karyawan. Anda tidak perlu membalas email ini.',
    link: null,
    feedback: { summary: 'Pengingat cocok dengan jadwal yang sudah tercatat dan tidak meminta kredensial atau pembayaran.', clues: ['Jadwal dan lokasi sama dengan kalender internal.', 'Pengirim menggunakan domain organisasi yang dikenal.', 'Ada jalur mandiri melalui menu Pembelajaran, tanpa tautan mendesak.'], action: 'Cocokkan kembali jadwal di kalender atau portal internal jika ada perubahan.' }
  },
  {
    id: 'wa-maintenance-code-m', channel: 'WhatsApp', category: 'Social engineering', difficulty: 'Medium', answer: 'phish',
    title: 'Kode akses untuk teknisi', subject: 'Pesan langsung dari fasilitas', time: '13.42',
    sender: { name: 'Danu · Fasilitas Gedung', initials: 'DF', role: 'Mengaku petugas fasilitas', address: 'Nomor baru · belum tersimpan', domain: 'gedung-bantuan.example', color: '#b06c36' },
    context: 'Memang ada jadwal pemeriksaan pintu sore ini, tetapi pemberitahuan fasilitas menyebut teknisi akan didampingi petugas dan tidak meminta kode akses pribadi.',
    message: 'Siang, saya sedang menuju ruang arsip untuk pengecekan. Supaya tidak menunggu, kirim kode akses pintu yang muncul di ponsel Anda. Saya dari tim gedung, nanti saya hapus setelah dipakai.',
    link: null,
    feedback: { summary: 'Pengirim memanfaatkan jadwal yang benar untuk meminta kode akses rahasia melalui kontak yang tidak terverifikasi.', clues: ['Nomor baru tidak tercatat sebagai kanal fasilitas.', 'Jadwal pemeriksaan tidak mengharuskan karyawan membagikan kode pribadi.', 'Janji menghapus kode setelah dipakai tidak mengurangi risiko akses.'], action: 'Jangan kirim kode. Hubungi fasilitas lewat direktori internal dan minta petugas menunjukkan identitas.' }
  },
  {
    id: 'email-project-pack-m', channel: 'Email', category: 'Legitimate message', difficulty: 'Medium', answer: 'legit',
    title: 'Paket materi rapat desain', subject: 'Bahan lokakarya yang kita minta', time: '09.26',
    sender: { name: 'Dimas Ardi', initials: 'DA', role: 'Rekan tim desain · Lazuardi Kreasi', address: 'dimas.ardi@lazuarikreasi.example', domain: 'lazuarikreasi.example', color: '#477a9b' },
    context: 'Tim meminta Dimas mengirim ringkasan PDF setelah lokakarya kemarin. Balasan berada pada utas undangan rapat yang sama.',
    message: 'Terlampir ringkasan lokakarya dan daftar keputusan yang kita minta. Versi yang sama juga saya taruh di folder Proyek/Desain pada RuangKerja. Silakan bandingkan dengan folder itu bila perlu.',
    link: null,
    attachment: { name: 'Ringkasan-Lokakarya-Desain.pdf', type: 'PDF', size: '684 KB' },
    feedback: { summary: 'Lampiran sesuai dengan permintaan sebelumnya, datang dari rekan yang dikenal, dan memiliki jalur verifikasi di folder tim.', clues: ['Email merupakan balasan pada utas rapat yang relevan.', 'Jenis dan nama file cocok dengan materi yang diminta.', 'Ada salinan pembanding pada folder kerja yang sudah dikenal.'], action: 'Buka file hanya jika sesuai dengan permintaan. Verifikasi lewat folder bersama bila nama atau isi lampiran berbeda.' }
  },
  {
    id: 'qr-cafe-menu-m', channel: 'QR Code', category: 'Legitimate message', difficulty: 'Medium', answer: 'legit',
    title: 'Menu digital Kafe Pendar', subject: 'QR pada meja kasir', time: '12.18',
    sender: { name: 'Kafe Pendar', initials: 'KP', role: 'Menu digital fiktif', address: 'Kode QR pada meja kasir', domain: 'menu.kafependar.example', color: '#a56c38' },
    context: 'Anda berada di Kafe Pendar. Domain pada QR sama dengan alamat menu yang tercetak pada struk dan tidak meminta login atau pembayaran.',
    message: 'Menu hari ini dapat dilihat di menu.kafependar.example. Pemesanan dan pembayaran tetap dilakukan langsung melalui kasir; halaman menu tidak meminta data akun.',
    link: { label: 'menu.kafependar.example', url: 'https://menu.kafependar.example/', expectedDomain: 'menu.kafependar.example' },
    feedback: { summary: 'QR sesuai dengan konteks tempat dan membuka halaman menu tanpa meminta data sensitif.', clues: ['QR berada di meja kasir yang sesuai dengan layanan.', 'Domain cocok dengan alamat yang juga tercetak pada struk.', 'Halaman hanya menampilkan menu dan tidak meminta login atau pembayaran.'], action: 'Periksa domain sebelum membuka QR. Jika tujuan atau permintaan halaman berubah, tutup dan tanyakan kepada staf.' }
  },
  {
    id: 'email-macro-minutes-m', channel: 'Email', category: 'Malicious attachments', difficulty: 'Medium', answer: 'phish',
    title: 'Notulen rapat perlu ditinjau', subject: 'Mohon aktifkan konten dokumen', time: '16.07',
    sender: { name: 'Sekretariat Proyek', initials: 'SP', role: 'Nama pengirim tidak terverifikasi', address: 'notulen@sekretariat-lk.example', domain: 'sekretariat-lk.example', color: '#8c5b9e' },
    context: 'Rapat proyek memang berlangsung pagi ini, tetapi notulen normalnya dibagikan sebagai PDF di folder RuangKerja.',
    message: 'Saya kirim draf notulen untuk koreksi. Dokumen mungkin tampil kosong sampai Anda mengaktifkan makro atau konten tambahan. Mohon tinjau sebelum rapat tindak lanjut.',
    link: null,
    attachment: { name: 'Notulen-Proyek.docm', type: 'DOCM', size: '312 KB' },
    feedback: { summary: 'Lampiran meminta makro diaktifkan meski konteks tim memiliki jalur dokumen yang sudah dikenal.', clues: ['File DOCM dapat memuat makro yang menjalankan tindakan aktif.', 'Instruksi mengaktifkan konten adalah alasan untuk berhenti dan memeriksa.', 'Domain pengirim berbeda dari RuangKerja yang digunakan proyek.'], action: 'Jangan aktifkan makro. Cari notulen di folder RuangKerja atau konfirmasi kepada sekretariat lewat kontak terverifikasi.' }
  },
  {
    id: 'email-ceo-audit-h', channel: 'Email', category: 'Social engineering', difficulty: 'Hard', answer: 'phish',
    title: 'Permintaan data audit mendadak', subject: 'Mohon kirim sebelum rapat dewan', time: '06.54',
    sender: { name: 'Arman Wijaya · Direktur', initials: 'AW', role: 'Nama eksekutif organisasi fiktif', address: 'arman.wijaya@lazuarikreasi.example', domain: 'lazuarikreasi.example', replyTo: 'audit-khusus@lk-advisory.example', color: '#9c5c58' },
    context: 'Direktur memang memimpin audit, tetapi kebijakan perusahaan mengharuskan data karyawan dibagikan melalui ruang audit dengan persetujuan Legal. Rapat dewan baru dijadwalkan pekan depan.',
    message: 'Saya sedang berpindah rapat dan perlu daftar rekening pemasok serta kontak penanggung jawab sebelum briefing pagi ini. Balas langsung ke alamat audit khusus ini agar berkas tidak masuk ke folder umum. Tolong jangan menyalin tim lain dahulu.',
    link: null,
    feedback: { summary: 'Pesan memakai nama eksekutif dan konteks audit yang masuk akal, tetapi menyimpang dari prosedur dan meminta kerahasiaan.', clues: ['Reply-To mengarah ke domain pihak lain yang tidak tercatat.', 'Permintaan data keuangan dan kontak sensitif tidak mengikuti ruang audit yang diwajibkan.', 'Instruksi untuk merahasiakan permintaan dan tenggat mendadak merupakan tekanan otoritas.'], action: 'Jangan membalas atau mengirim data. Verifikasi langsung lewat direktori internal dan ikuti proses persetujuan Legal.' }
  },
  {
    id: 'email-contract-appendix-h', channel: 'Email', category: 'Legitimate message', difficulty: 'Hard', answer: 'legit',
    title: 'Lampiran perubahan kontrak', subject: 'Lampiran B untuk peninjauan', time: '14.32',
    sender: { name: 'Nadia · Pengadaan', initials: 'NP', role: 'Pengadaan · Lazuardi Kreasi', address: 'nadia@lazuarikreasi.example', domain: 'lazuarikreasi.example', replyTo: 'nadia@lazuarikreasi.example', color: '#168d83' },
    context: 'Lampiran B memang diminta oleh Legal pada utas pengadaan yang sama. Versi final juga tercatat pada sistem kontrak internal dengan nomor revisi yang cocok.',
    message: 'Terlampir Lampiran B versi 3 sesuai daftar perubahan Legal. Nomor revisi dan tanggal sama dengan catatan pada sistem kontrak. Jika Anda tidak sedang meninjau kontrak ini, buka sistem kontrak dari bookmark sebelum memakai lampiran.',
    link: null,
    attachment: { name: 'Kontrak-Lampiran-B-v3.pdf', type: 'PDF', size: '1,1 MB' },
    feedback: { summary: 'Lampiran legitimate dalam konteks simulasi karena permintaan, utas, dan nomor revisinya dapat diverifikasi melalui sistem resmi.', clues: ['Lampiran diminta sebelumnya oleh Legal pada utas yang sama.', 'Nomor revisi cocok dengan catatan sistem kontrak internal.', 'Pesan menyarankan verifikasi mandiri dan tidak meminta makro atau kredensial.'], action: 'Cocokkan versi dan nomor revisi di sistem kontrak sebelum menandatangani atau meneruskan dokumen.' }
  },
  {
    id: 'qr-event-checkin-h', channel: 'QR Code', category: 'Legitimate message', difficulty: 'Hard', answer: 'legit',
    title: 'Check-in lokakarya internal', subject: 'QR di meja registrasi acara', time: '08.47',
    sender: { name: 'Tim Acara Lazuardi', initials: 'TA', role: 'Penyelenggara lokakarya fiktif', address: 'Papan registrasi ruang Kenari', domain: 'acara.lazuarikreasi.example', color: '#277b89' },
    context: 'Lokakarya tercantum di kalender perusahaan. QR berada pada meja registrasi resmi, dan domain tujuan sama dengan alamat acara pada undangan internal.',
    message: 'Gunakan QR ini untuk mencatat kehadiran lokakarya. Halaman hanya meminta kode acara yang tercetak pada undangan dan menampilkan nama sesi; jangan masukkan kata sandi atau data pribadi.',
    link: { label: 'acara.lazuarikreasi.example/check-in', url: 'https://acara.lazuarikreasi.example/check-in', expectedDomain: 'acara.lazuarikreasi.example' },
    feedback: { summary: 'QR ini legitimate berdasarkan lokasi, jadwal, domain, dan batas data yang diminta.', clues: ['Lokasi QR adalah meja registrasi resmi untuk acara yang tercantum di kalender.', 'Domain tujuan cocok dengan undangan internal.', 'Halaman hanya memakai kode acara, bukan kredensial akun.'], action: 'Tetap cocokkan domain dan jenis data yang diminta. Jika QR berpindah lokasi atau meminta kata sandi, hentikan dan tanyakan kepada penyelenggara.' }
  },
  {
    id: 'sms-vendor-bank-change-h', channel: 'SMS', category: 'Payment change', difficulty: 'Hard', answer: 'phish',
    title: 'Perubahan rekening pemasok', subject: 'Pesan dari nomor pengelola vendor', time: '17.12',
    sender: { name: 'Bagian Tagihan Sembada', initials: 'BS', role: 'Kontak pemasok yang mengaku bagian tagihan', address: 'Nomor baru · belum tersimpan', domain: 'sembada-tagihan.example', color: '#9c5c58' },
    context: 'PT Sembada adalah pemasok fiktif yang sudah dikenal. Prosedur pembayaran menyatakan perubahan rekening harus dikonfirmasi ke nomor kontak pada kontrak dan disetujui dua orang.',
    message: 'Kami mengganti rekening operasional untuk pembayaran faktur bulan ini. Mohon perbarui data sebelum penutupan hari ini agar transfer tidak tertunda. Saya kirim detailnya di chat ini setelah Anda membalas “siap”.',
    link: null,
    feedback: { summary: 'Pesan meminta perubahan instruksi pembayaran lewat nomor baru dan mencoba melewati pemeriksaan ganda.', clues: ['Perubahan rekening adalah permintaan berisiko tinggi, walau nama pemasok dikenal.', 'Nomor pengirim belum terverifikasi dan berbeda dari kontak kontrak.', 'Tenggat hari ini dan pengiriman detail setelah mendapat balasan menghindari proses resmi.'], action: 'Jangan membalas atau mengubah rekening. Hubungi nomor pada kontrak dan minta persetujuan sesuai prosedur.' }
  }
];
