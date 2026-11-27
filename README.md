# Skeptimail prototype

Skeptimail adalah prototype vanilla HTML/CSS/JavaScript untuk simulasi dan edukasi phishing yang aman.

## Menjalankan

Di folder ini jalankan:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Kemudian buka `http://localhost:4173`.

## Akun lokal

Daftarkan akun individu atau perusahaan melalui form, lalu masuk menggunakan ID pengguna atau email dan kata sandi yang dibuat saat registrasi. Akun dan progres disimpan di `localStorage` browser/perangkat ini saja; tidak tersinkronisasi ke perangkat lain. Karena prototype tidak memiliki backend, jangan gunakan kata sandi yang dipakai untuk layanan penting.

## Demo singkat

1. Daftarkan akun individu lalu masuk dan buka **Simulasi**.
2. Tandai contoh fiktif sebagai phishing/legitimate dan baca red flags serta tindakan aman.
3. Periksa perubahan XP, streak, badge, leaderboard, dashboard, serta laporan profil.
4. Daftarkan akun perusahaan untuk melihat dashboard organisasi dalam kondisi kosong sampai ada sumber data karyawan.

Logout tidak menghapus akun atau progres. Jangan hapus seluruh local storage bila ingin mempertahankan akun dan progres lokal.
