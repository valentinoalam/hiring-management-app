import * as z from "zod";

export const personalInfoSchema = z.object({
  nama: z.string()
    .min(1, "Nama diperlukan")
    .min(3, "Nama harus minimal 3 karakter")
    .max(255, "Nama tidak boleh melebihi 255 karakter"),
  noWA: z.string()
    .min(10, "Nomor telepon harus minimal 10 digit")
    .max(12, "Nomor telepon tidak boleh lebih dari 12 digit")
    .regex(/^\d+$/, "Nomor telepon hanya boleh berisi angka"),
  email: z.string()
    .email("Format email tidak valid")
    .optional()
    .nullable(),
  tanggalLahir: z.string().nonempty("Harus diisi")
    .refine(date => {
      const birthDate = new Date(date);
      const minDate = new Date();
      minDate.setFullYear(minDate.getFullYear() - 12);
      return birthDate <= minDate;
    }, "Anda harus berusia minimal 12 tahun")
    .refine(date => {
      const birthDate = new Date(date);
      const maxDate = new Date('1900-01-01');
      return birthDate >= maxDate;
    }, "Tanggal lahir tidak valid"),
  // kelompokUmur: z.enum(["11-20", "20-40", "40-60", "60 lebih"], {
  //   required_error: "Please select your age group",
  // }),
  jenisKelamin: z.enum(["Pria", "Wanita"], {
    required_error: "Pilih yang merepresentasikan jenis kelamin Anda",
  }),
  idCardPhoto: z.string()
    .min(1, "File ID is required")
    .regex(/^[a-zA-Z0-9-_]{25,}$/, "Invalid Google Drive file ID format"),
  
  idCardPhotoUrl: z.string()
    .url("Invalid Google Drive URL format")
    .refine(url => url.startsWith("https://drive.google.com/"), {
      message: "Must be a Google Drive URL"
    })
});

const baseAddressSchema = z.object({
  komplek: z.enum(["Persada-Kemala", "Pengairan", "Lainnya"], {
    required_error: "Komplek harus dipilih",
  }),
  jalan: z.string()
  .min(3, "Alamat jalan harus minimal 3 karakter")
  .max(255, "Alamat jalan tidak boleh lebih dari 255 karakter"),
});

const persadaKemalaSchema = baseAddressSchema.extend({
  komplek: z.literal("Persada-Kemala"),
});

const pengairanSchema = baseAddressSchema.extend({
  komplek: z.literal("Pengairan"),
});

const lainnyaSchema = baseAddressSchema.extend({
  komplek: z.literal("Lainnya"),
  komplek_lainnya: z.string()
    .min(3, "Nama komplek harus minimal 3 karakter")
    .max(255, "Nama komplek tidak boleh lebih dari 255 karakter")
    .optional(),
  kodepos: z.string()
    .length(5, "Kode pos harus 5 digit")
    .regex(/^\d+$/, "Kode pos harus berupa angka")
    .optional(),
  regional: z.object({
    propinsi: z.string().min(1, "Propinsi harus dipilih"),
    kabupaten: z.string().min(1, "Kabupaten harus dipilih"),
    kecamatan: z.string().min(1, "Kecamatan harus dipilih"),
    kelurahan: z.string().min(1, "Kelurahan harus dipilih"),
  }).optional(),
});

// Step 2: Address Information
export const addressSchema = z.object({
  alamatKTP: z.discriminatedUnion("komplek", [
    persadaKemalaSchema,
    pengairanSchema,
    lainnyaSchema,
  ]),
});

// Step 3: Contact Information
export const contactSchema = z.object({
  kontakDarurat: z.object({
    nama: z.string()
      .min(3, "Nama kontak darurat harus minimal 3 karakter")
      .max(255, "Nama kontak darurat tidak boleh lebih dari 255 karakter"),
    phone1: z.string()
      .min(10, "Nomor telepon minimal 10 digit")
      .max(12, "Nomor telepon maksimal 12 digit")
      .regex(/^\d+$/, "Nomor telepon harus berupa angka"),
  }),
});

// Step 4: Family Information
export const familySchema = z.object({
  data_anggota: z.object({
    anggota: z.array(z.object({
      nama: z.string()
        .min(3, "Nama harus minimal 3 karakter")
        .max(255, "Nama tidak boleh lebih dari 255 karakter"),
      keterangan: z.string()
        .min(1, "Keterangan harus diisi")
        .max(100, "Keterangan tidak boleh lebih dari 100 karakter"),
      kelompokUsia: z.enum(['0-12', '13-17', '18-25', '26-35', '36-50', '50+'], {
        required_error: "Kelompok usia harus dipilih"
      })
    }))
  }).optional()
});

// Step 5: Plan Information
export const planSchema = z.object({
  term1: z.boolean()
    .refine((val) => val === true, "Anda harus menyetujui pernyataan ini"),
  rencana_itikaf:  z.array(z.string()).refine(
    (value) => 
      value.length >= 6 && // Minimal 6 hari
      value.every(day => {
        const dayNum = parseInt(day);
        return dayNum >= 21 && dayNum <= 30;
      }),
    { 
      message: "Pilih minimal 6 hari anda yang tersedia untuk beritikaf" 
    }
  )
});

// Step 6: Terms and Conditions
export const termsSchema = z.object({
  terms: z.object({
    term2: z.boolean()
      .refine(val => val === true, {
        message: "Anda harus setuju untuk tidak membawa anak di bawah usia 12 tahun"
      }),
    term3: z.boolean()
      .refine(val => val === true, {
        message: "Anda harus setuju untuk bertanggung jawab atas barang-barang pribadi"
      }),
    term4: z.boolean()
      .refine(val => val === true, {
        message: "Anda harus setuju untuk menjaga lingkungan masjid"
      }),
    term5: z.boolean()
      .refine(val => val === true, {
        message: "Anda harus setuju untuk mengikuti peraturan komite masjid"
      })
  })
});


// Combined schema for the entire form
export const registrationSchema = z.object({
  ...personalInfoSchema.shape,
  ...addressSchema.shape,
  ...contactSchema.shape,
  ...planSchema.shape,
  ...termsSchema.shape,
  // Tambahkan field denganKeluarga di root schema
  denganKeluarga: z.boolean(),
  
  // Family schema dengan validasi kondisional
  ...familySchema.shape,
}).refine((data) => {
  if (data.denganKeluarga) {
    // Validasi ketat jika dengan keluarga
    return familySchema.shape.data_anggota.safeParse(data.data_anggota).success && 
    data.data_anggota?.anggota && 
      data.data_anggota.anggota.length > 0 &&
      data.data_anggota.anggota.every(member => 
        member.nama.length >= 3 &&
        member.keterangan.length >= 1
      );
  }
  return true;
}, {
  message: "Data anggota keluarga wajib diisi jika mendaftar dengan keluarga",
  path: ["data_anggota"]
});

// Type for the form data
export type RegistrationFormData = z.infer<typeof registrationSchema>;