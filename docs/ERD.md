# GeoLab UPI — Entity Relationship Diagram

Source of truth is [`prisma/schema.prisma`](../prisma/schema.prisma). Keep this diagram in sync whenever the schema changes.

```mermaid
erDiagram
    PROFILE ||--o{ SCHEDULE : "mengajar (dosen)"
    PROFILE ||--o{ LOAN : "mengajukan (mahasiswa)"
    PROFILE ||--o{ APPROVAL : "memutuskan"
    PROFILE ||--o{ MAINTENANCE_LOG : "mencatat"
    PROFILE ||--o{ LOCATION_HISTORY : "memindahkan"
    PROFILE ||--o{ TRANSACTION : "mengoperasikan"
    PROFILE ||--o{ NOTIFICATION : "menerima"
    PROFILE ||--o{ ACTIVITY_LOG : "memicu"

    CATEGORY ||--o{ INVENTORY_ITEM : "mengelompokkan"
    LOCATION ||--o{ INVENTORY_ITEM : "menyimpan"
    LOCATION ||--o{ SCHEDULE : "menjadi ruangan"
    LOCATION ||--o{ LOCATION_HISTORY : "tujuan pindah"

    INVENTORY_ITEM ||--o{ INVENTORY_PHOTO : "punya galeri"
    INVENTORY_ITEM ||--o{ MAINTENANCE_LOG : "riwayat perawatan"
    INVENTORY_ITEM ||--o{ LOCATION_HISTORY : "riwayat lokasi"
    INVENTORY_ITEM ||--o{ TRANSACTION : "masuk/keluar"
    INVENTORY_ITEM ||--o{ LOAN_ITEM : "dipinjam via"

    COURSE ||--o{ SCHEDULE : "dijadwalkan"
    COURSE ||--o{ LOAN : "terkait praktikum"

    LOAN ||--o{ LOAN_ITEM : "berisi barang"
    LOAN ||--o{ APPROVAL : "melalui tahap"
    LOAN ||--o{ RETURN_RECORD : "diakhiri dengan"

    PROFILE {
        uuid id PK
        string email UK
        string name
        Role role
        string nim
        string nip
        string prodi
    }

    CATEGORY {
        string id PK
        string nama UK
        string icon
    }

    LOCATION {
        string id PK
        string gedung
        string ruangan
        string lemari
        string rak
        string posisi
    }

    INVENTORY_ITEM {
        string id PK
        string nama
        string kodeInventaris UK
        string kodeQr UK
        string categoryId FK
        string locationId FK
        int jumlahTotal
        int jumlahTersedia
        int jumlahDipinjam
        int jumlahMaintenance
        int jumlahRusak
        int jumlahHilang
        Kondisi kondisi
        ItemStatus status
        decimal harga
        datetime tanggalPembelian
        string sumberDana
    }

    INVENTORY_PHOTO {
        string id PK
        string itemId FK
        string url
        int order
    }

    MAINTENANCE_LOG {
        string id PK
        string itemId FK
        uuid byId FK
        datetime tanggal
        Kondisi kondisiBaru
        string catatan
    }

    LOCATION_HISTORY {
        string id PK
        string itemId FK
        string toLocationId FK
        uuid byId FK
        datetime tanggal
    }

    TRANSACTION {
        string id PK
        TransactionType type
        string itemId FK
        uuid operatorId FK
        uuid mahasiswaId
        int jumlah
        datetime tanggal
    }

    COURSE {
        string id PK
        string kode UK
        string nama
        int sks
        string prodi
    }

    SCHEDULE {
        string id PK
        string courseId FK
        uuid dosenId FK
        string locationId FK
        string hari
        string jamMulai
        string jamSelesai
        string kelas
        int angkatan
        ScheduleStatus status
    }

    LOAN {
        string id PK
        string nomorPeminjaman UK
        uuid mahasiswaId FK
        string courseId FK
        datetime tanggalPinjam
        datetime tanggalKembali
        LoanStatus status
        string kuponUrl
    }

    LOAN_ITEM {
        string id PK
        string loanId FK
        string itemId FK
        int jumlah
    }

    APPROVAL {
        string id PK
        string loanId FK
        ApprovalLevel level
        ApprovalStatus status
        uuid byId FK
        datetime decidedAt
    }

    RETURN_RECORD {
        string id PK
        string loanId FK
        datetime tanggal
        string kondisiCheck
        string fotoUrl
    }

    NOTIFICATION {
        string id PK
        uuid profileId FK
        NotificationType type
        boolean read
    }

    ACTIVITY_LOG {
        string id PK
        ActivityType type
        uuid actorId FK
        string message
        datetime createdAt
    }
```

## Catatan desain

- **Profile** memakai `id` yang sama dengan `auth.users.id` Supabase (bukan tabel auth terpisah) — dibuat otomatis lewat trigger Postgres `handle_new_user` saat ada signup baru.
- **Location** sengaja flat (gedung/ruangan/lemari/rak/posisi), bukan tree self-relation — datanya di PDF inventaris memang berbentuk field datar, dan query lebih sederhana untuk kebutuhan tampilan "Gedung → Ruangan → Lemari → Rak → Posisi" di halaman Lokasi Penyimpanan.
- **Loan / Approval / ReturnRecord / Transaction / Notification** sudah dimodelkan penuh di Fase 1 supaya schema tidak perlu migrasi besar lagi, tapi UI dan logic-nya baru dibangun di fase berikutnya (Peminjaman, Approval, Barang Masuk/Keluar, Notifikasi).
- Semua kuantitas (`jumlahTersedia`, `jumlahDipinjam`, dst.) disimpan sebagai kolom teragregasi di `InventoryItem` untuk kecepatan baca dashboard/list; akan di-update lewat transaksi (Loan/Transaction) di fase berikutnya, bukan dihitung ulang tiap request.
