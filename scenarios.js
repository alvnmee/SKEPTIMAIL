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
  }
];
