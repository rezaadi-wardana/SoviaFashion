"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  User,
  MapPin,
  Save,
  Package,
  Truck,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Edit,
  Upload,
  Loader2,
  Phone,
  Briefcase,
  Calendar,
  Mail,
  Map,
  Search,
  ArrowUpDown,
  XCircle,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { formatPrice, formatDate, toTitleCase } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrderItem {
  id: string;
  status: string;
  total: number;
  subtotal: number;
  shippingCost: number;
  shippingMethod: string;
  courierName: string | null;
  courierService: string | null;
  paymentMethod: string;
  address: string;
  trackingNumber: string | null;
  createdAt: string;
  updatedAt: string;
  paymentProofUrl: string | null;
  items: {
    id: string;
    quantity: number;
    price: number;
    size: string | null;
    color: string | null;
    product: {
      id: string;
      name: string;
      images: string | null;
    };
  }[];
}

const statusConfig: Record<
  string,
  { label: string; icon: any; color: string }
> = {
  PENDING_PAYMENT: {
    label: "Belum Bayar",
    icon: Clock,
    color: "bg-yellow-600 text-yellow-50",
  },
  WAITING_CONFIRMATION: {
    label: "Menunggu Konfirmasi",
    icon: Clock,
    color: "bg-orange-600 text-orange-50",
  },
  PACKING: {
    label: "Sedang Diproses",
    icon: Package,
    color: "bg-blue-600 text-blue-50",
  },
  SHIPPED: {
    label: "Dalam Perjalanan",
    icon: Truck,
    color: "bg-purple-600 text-purple-50",
  },
  COMPLETED: {
    label: "Pesanan Selesai",
    icon: CheckCircle,
    color: "bg-emerald-600 text-emerald-50",
  },
  CANCELLED: {
    label: "Dibatalkan",
    icon: XCircle,
    color: "bg-rose-600 text-rose-50",
  },
};

/**
 * Komponen ikon X sederhana (tanda silang).
 */
function X({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

const MapPicker = dynamic(() => import("@/components/MapPicker"), {
  ssr: false,
  loading: () => (
    <div className="h-80 bg-sovia-200 rounded-xl animate-pulse flex items-center justify-center">
      <p className="text-sovia-400 text-sm">Memuat peta...</p>
    </div>
  ),
});

import { Suspense } from "react";

const statusOrder = ["PENDING_PAYMENT", "WAITING_CONFIRMATION", "PACKING", "SHIPPED", "COMPLETED"];

const tabs = [
  { id: "ALL", label: "Semua" },
  { id: "PENDING_PAYMENT", label: "Belum Bayar" },
  { id: "WAITING_CONFIRMATION", label: "Menunggu Konfirmasi" },
  { id: "PACKING", label: "Diproses" },
  { id: "SHIPPED", label: "Dikirim" },
  { id: "COMPLETED", label: "Selesai" },
];

/**
 * Komponen Utama Konten Profil (ProfileContent) untuk mengelola data diri pengguna,
 * memperbarui detail alamat pengiriman, memetakan koordinat peta Leaflet,
 * mengubah password akun, mengunggah foto profil, serta melacak status riwayat pesanan (orders).
 */
function ProfileContent() {

  const { data: session, update } = useSession();
  const searchParams = useSearchParams();
  const defaultTab =
    searchParams.get("tab") === "orders" ? "orders" : "profile";
  const defaultExpanded = searchParams.get("order");

  const [loading, setLoading] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: session?.user?.name || "",
    phone: "",
    address: "",
    detailAddress: "",
    lat: 0,
    lng: 0,
    job: "",
    birthDate: "",
    image: session?.user?.image || "",
  });

  const [isEditingAddress, setIsEditingAddress] = useState(true);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: "", newPassword: "" });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [addressDetails, setAddressDetails] = useState({
    street: "",
    rt: "",
    rw: "",
    provinceId: "",
    provinceName: "",
    regencyId: "",
    regencyName: "",
    districtId: "",
    districtName: "",
    villageId: "",
    villageName: "",
    postalCode: "",
  });

  const [provinces, setProvinces] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [regencies, setRegencies] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [districts, setDistricts] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [villages, setVillages] = useState<{ id: string; name: string }[]>([]);

  // UseEffect untuk mengambil data provinsi
  useEffect(() => {
    fetch("https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json")
      .then((res) => res.json())
      .then((data) =>
        setProvinces(
          data.map((item: any) => ({ ...item, name: toTitleCase(item.name) })),
        ),
      )
      .catch((err) => console.error("Error fetching provinces:", err));
  }, []);

  useEffect(() => {
    if (!addressDetails.provinceId) {
      setRegencies([]);
      return;
    }
    fetch(
      `https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${addressDetails.provinceId}.json`,
    )
      .then((res) => res.json())
      .then((data) =>
        setRegencies(
          data.map((item: any) => ({ ...item, name: toTitleCase(item.name) })),
        ),
      )
      .catch((err) => console.error("Error fetching regencies:", err));
  }, [addressDetails.provinceId]);

  useEffect(() => {
    if (!addressDetails.regencyId) {
      setDistricts([]);
      return;
    }
    fetch(
      `https://www.emsifa.com/api-wilayah-indonesia/api/districts/${addressDetails.regencyId}.json`,
    )
      .then((res) => res.json())
      .then((data) =>
        setDistricts(
          data.map((item: any) => ({ ...item, name: toTitleCase(item.name) })),
        ),
      )
      .catch((err) => console.error("Error fetching districts:", err));
  }, [addressDetails.regencyId]);

  useEffect(() => {
    if (!addressDetails.districtId) {
      setVillages([]);
      return;
    }
    fetch(
      `https://www.emsifa.com/api-wilayah-indonesia/api/villages/${addressDetails.districtId}.json`,
    )
      .then((res) => res.json())
      .then((data) =>
        setVillages(
          data.map((item: any) => ({ ...item, name: toTitleCase(item.name) })),
        ),
      )
      .catch((err) => console.error("Error fetching villages:", err));
  }, [addressDetails.districtId]);

  const [activeTab, setActiveTab] = useState<"profile" | "orders">(defaultTab);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [storeProfile, setStoreProfile] = useState<{bankAccount: string | null, bankImage: string | null, eWallet: string | null, eWalletImage: string | null} | null>(null);
  const [orderFilter, setOrderFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [uploadingProofId, setUploadingProofId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    action: "UPDATE_STATUS" | "REJECT" | null;
    orderId: string | null;
    targetStatus: string | null;
    title: string;
    message: string;
  }>({
    isOpen: false,
    action: null,
    orderId: null,
    targetStatus: null,
    title: "",
    message: "",
  });

  const toggleExpand = (id: string) => {
    // Logic updated to remove expandedOrders dependency
  };

  /**
   * Mengonfirmasi bahwa barang pesanan telah diterima dengan baik oleh pengguna,
   * lalu memperbarui status pesanan menjadi 'COMPLETED' ke database via PATCH /api/orders/[id].
   */
  async function handleCompleteOrder(orderId: string) {
    if (
      !window.confirm(
        "Apakah Anda yakin telah menerima pesanan ini dengan baik?",
      )
    )
      return;
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      if (res.ok) {
        toast.success("Terima kasih telah mengonfirmasi pesanan Anda!");
        fetchOrders();
      } else {
        toast.error("Gagal memperbarui pesanan");
      }
    } catch (e) {
      toast.error("Gagal memperbarui pesanan");
    }
  }

  // Handle completion order via confirm modal
  /**
   * Callback pembantu untuk memproses penyelesaian konfirmasi pesanan.
   */
  async function confirmOrder(orderId: string, isConfirmed: boolean, isReject?: boolean) {
    handleCompleteOrder(orderId);
  }

  /**
   * Menangani pengunggahan foto bukti transfer pembayaran oleh pengguna untuk pesanan yang berstatus PENDING_PAYMENT.
   */
  async function handleUploadProof(orderId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append("file", file);

    setUploadingProofId(orderId);
    try {
      const toastId = toast.loading("Mengunggah bukti pembayaran...");
      const res = await fetch("/api/upload/payment-proof", {
        method: "POST",
        body: uploadData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();

      const updateRes = await fetch(`/api/orders/${orderId}/payment-proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentProofUrl: url }),
      });

      if (updateRes.ok) {
        toast.success("Bukti pembayaran berhasil diunggah!", { id: toastId });
        fetchOrders(); // Refresh orders
      } else {
        toast.error("Gagal menyimpan bukti pembayaran", { id: toastId });
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat mengunggah", { id: "upload-proof" });
    } finally {
      setUploadingProofId(null);
    }
  }

  // Filter and sort orders
  const filteredOrders = orders
    .filter((o) => {
      if (orderFilter !== "ALL" && o.status !== orderFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          o.id.toLowerCase().includes(q) ||
          (session?.user?.name && session.user.name.toLowerCase().includes(q))
        );
      }
      return true;
    })
    .sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
    });

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, orderFilter, sortOrder]);

  useEffect(() => {
    fetchOrders();
    fetchStoreProfile();
  }, []);

  /**
   * Mengambil informasi rekening bank dan e-wallet toko untuk pembayaran dari API /api/admin/store-profile.
   */
  async function fetchStoreProfile() {
    try {
      const res = await fetch("/api/admin/store-profile");
      if (res.ok) {
        const data = await res.json();
        setStoreProfile({
          bankAccount: data.bankAccount,
          bankImage: data.bankImage,
          eWallet: data.eWallet,
          eWalletImage: data.eWalletImage,
        });
      }
    } catch (error) {
      console.error("Error fetching store profile:", error);
    }
  }

  /**
   * Mengambil seluruh daftar pesanan milik pengguna yang sedang login dari API /api/orders.
   */
  async function fetchOrders() {
    setLoadingOrders(true);
    try {
      const res = await fetch("/api/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoadingOrders(false);
    }
  }

  useEffect(() => {
    if (orders.length > 0 && defaultExpanded && !selectedOrder) {
      const targetOrder = orders.find((o) => o.id === defaultExpanded);
      if (targetOrder) {
        setSelectedOrder(targetOrder);
        setOrderFilter(targetOrder.status);
        
        setTimeout(() => {
          document.getElementById("pesanan-saya-section")?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      }
    }
  }, [orders, defaultExpanded]);

  // Sync selectedOrder with updated orders data
  useEffect(() => {
    if (selectedOrder) {
      const updated = orders.find(o => o.id === selectedOrder.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedOrder)) {
        setSelectedOrder(updated);
      }
    }
  }, [orders, selectedOrder]);

  useEffect(() => {
    const userId = session?.user?.id;
    const userName = session?.user?.name;
    if (!userId) return;

    async function loadUserData() {
      try {
        const res = await fetch(`/api/users/${userId}`);
        if (res.ok) {
          const data = await res.json();
          setFormData({
            name: data.name || userName || "",
            phone: data.phone || "",
            address: data.address || "",
            detailAddress: data.detailAddress || "",
            lat: data.lat || 0,
            lng: data.lng || 0,
            job: data.job || "",
            birthDate: data.birthDate
              ? new Date(data.birthDate).toISOString().split("T")[0]
              : "",
            image: data.image || session?.user?.image || "",
          });
          if (data.address || data.detailAddress) {
            setIsEditingAddress(false);
          }
          if (data.detailAddress) {
            setAddressDetails((prev) => ({
              ...prev,
              street: data.detailAddress,
            }));
          } else if (data.address) {
            setAddressDetails((prev) => ({ ...prev, street: data.address }));
          }
        }
      } catch {
        console.error("Error loading user data");
      }
    }

    loadUserData();
  }, [session]);

  /**
   * Menggunakan navigator.geolocation browser untuk mendapatkan koordinat lokasi GPS user
   * dan menyimpannya ke data state koordinat form profil.
   */
  async function handleGetLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }));
          toast.success("Location detected!");
        },
        () => {
          toast.error("Could not get location. Please enable GPS.");
        },
      );
    } else {
      toast.error("Geolocation is not supported by your browser.");
    }
  }

  /**
   * Mengunggah file foto profil baru ke storage server via POST /api/upload.
   */
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });

      if (res.ok) {
        const data = await res.json();
        setFormData((prev) => ({ ...prev, image: data.url }));
        toast.success("Foto profil berhasil diunggah");
      } else {
        toast.error("Gagal mengunggah foto");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat mengunggah");
    } finally {
      setUploading(false);
    }
  }

  /**
   * Mengirimkan perubahan password baru pengguna ke API PUT /api/users/password.
   */
  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordLoading(true);
    try {
      const res = await fetch("/api/users/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordData)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Password berhasil diubah!");
        setIsEditingPassword(false);
        setPasswordData({ currentPassword: "", newPassword: "" });
      } else {
        toast.error(data.error || "Gagal mengubah password");
      }
    } catch {
      toast.error("Terjadi kesalahan jaringan");
    } finally {
      setPasswordLoading(false);
    }
  }

  // True jika user belum pernah menyimpan alamat sebelumnya
  const isFirstTimeAddress = !formData.address;

  /**
   * Menyimpan data diri lengkap pengguna beserta alamat hasil konversi dan titik koordinat peta ke database via PUT /api/users/profile.
   */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // Jika pertama kali mengisi alamat, lat & lng wajib diisi
    if (isFirstTimeAddress && (!formData.lat || !formData.lng || formData.lat === 0 || formData.lng === 0)) {
      toast.error("Titik lokasi (pin peta) wajib diatur saat pertama kali mengisi alamat. Geser pin atau gunakan tombol 'Lokasi Saya'.");
      setLoading(false);
      return;
    }

    let finalAddress = "";
    if (addressDetails.provinceName) {
      const parts = [
        addressDetails.rt || addressDetails.rw
          ? `RT ${addressDetails.rt || "-"}/RW ${addressDetails.rw || "-"}`
          : "",
        addressDetails.villageName
          ? `Desa/Kel. ${addressDetails.villageName}`
          : "",
        addressDetails.districtName
          ? `Kec. ${addressDetails.districtName}`
          : "",
        addressDetails.regencyName,
        addressDetails.provinceName
          ? `Prov. ${addressDetails.provinceName}`
          : "",
        addressDetails.postalCode,
        "Indonesia",
      ].filter(Boolean);
      finalAddress = parts.join(", ");
    } else {
      finalAddress = formData.address;
    }

    const updatedFormData = {
      ...formData,
      address: finalAddress,
      detailAddress: addressDetails.street,
    };

    try {
      const res = await fetch(`/api/users/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFormData),
      });

      if (res.ok) {
        toast.success("Profile berhasil diupdate!");
        await update({ name: formData.name, image: formData.image });
        setIsEditingProfile(false);
        setIsEditingAddress(false);
      } else {
        toast.error("Gagal mengupdate profile!");
      }
    } catch {
      toast.error("Terjadi kesalahan saat mengupdate profile!");
    } finally {
      setLoading(false);
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen pt-32 pb-16 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 mx-auto mb-4 text-sovia-400" />
          <p className="text-sovia-600 text-lg">
            Silahkan login untuk melihat profil
          </p>
        </div>
      </div>
    );
  }

  /**
   * Fungsi helper untuk merender detail informasi barang yang dipesan, total biaya, kurir, dan riwayat pelacakan pesanan.
   */
  const renderOrderDetails = (order: OrderItem, isMobile: boolean) => (
    <div className={`space-y-6 animate-in fade-in duration-500 ${isMobile ? 'pt-4 border-t border-sovia-100' : ''}`}>
      {/* Items List */}
      <div>
        <h3 className="text-sovia-900 font-semibold mb-3 flex items-center gap-2 text-sm">
          <Package className="w-4 h-4 text-sovia-500" /> Produk yang Dipesan
        </h3>
        <div className="space-y-3">
          {order.items.map((item) => {
            let imageUrl = "https://placehold.co/80x96/F3EFE6/3C3228?text=Item"
            if (item.product.images) {
              try {
                const parsed = JSON.parse(item.product.images)
                if (Array.isArray(parsed) && parsed.length > 0) {
                  imageUrl = parsed[0]
                } else if (typeof parsed === "string") {
                  imageUrl = parsed
                }
              } catch (e) {
                imageUrl = item.product.images
              }
            }
            return (
              <div key={item.id} className={`flex items-center gap-4 border border-sovia-100 p-3 rounded-xl shadow-sm ${isMobile ? 'bg-sovia-50' : 'bg-sovia-50'}`}>
                <div className={`w-14 h-16 rounded-lg overflow-hidden flex-shrink-0 ${isMobile ? 'bg-sovia-50' : 'bg-sovia-200'}`}>
                  <Image
                    src={imageUrl}
                    alt={item.product.name}
                    width={56}
                    height={64}
                    className="object-cover w-auto h-auto"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sovia-900 text-sm font-semibold truncate leading-tight">{item.product.name}</p>
                  <p className="text-sovia-600 font-medium text-xs mt-0.5">{formatPrice(item.price)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-sovia-700 text-xs px-2 py-1 rounded font-medium border border-sovia-100 ${isMobile ? 'bg-sovia-50' : 'bg-sovia-200'}`}>Qty: {item.quantity}</span>
                    {item.size && <span className={`text-sovia-700 text-xs px-2 py-1 rounded font-medium border border-sovia-100 ${isMobile ? 'bg-sovia-50' : 'bg-sovia-200'}`}>Size: {item.size}</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Payment Details Section */}
        <div className={`mt-4 border-t border-sovia-200 pt-3 space-y-1 ${isMobile ? 'px-2' : ''}`}>
          <div className="flex justify-between text-sm text-sovia-600">
            <span>Subtotal Produk</span>
            <span>{formatPrice(order.subtotal || 0)}</span>
          </div>
          <div className="flex justify-between text-sm text-sovia-600">
            <span>Ongkos Kirim</span>
            <span>{formatPrice(order.shippingCost || 0)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold text-sovia-900 mt-2 border-t border-sovia-100 pt-2">
            <span>Total Belanja</span>
            <span>{formatPrice(order.total || 0)}</span>
          </div>
        </div>
      </div>

      {/* Shipping Info */}
      <div>
        <h3 className="text-sovia-900 font-semibold mb-3 flex items-center gap-2 text-sm ">
          <Truck className="w-4 h-4 text-sovia-500" /> Detail Pengiriman
        </h3>
        <div className={`border border-sovia-100 p-4 rounded-xl text-sm space-y-2.5 shadow-sm ${isMobile ? 'bg-sovia-100' : 'bg-sovia-50'}`}>
          <div className="flex justify-between">
            <span className="text-sovia-500">Penerima</span>
            <span className="text-sovia-900 font-semibold text-right">{formData.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sovia-500">No. HP</span>
            <span className="text-sovia-900 font-medium text-right">{formData.phone}</span>
          </div>
          <div className="flex justify-between items-start gap-4">
            <span className="text-sovia-500 whitespace-nowrap">Alamat</span>
            <span className="text-sovia-900 text-right">
              {order.address}
            </span>
          </div>

          <hr className="border-sovia-200 my-3" />

          <div className="flex justify-between">
            <span className="text-sovia-500">Kurir</span>
            <span className="text-sovia-900 font-semibold text-right">
              {order.shippingMethod === "EXPEDITION" ? "Ekspedisi" : "COD"}
              {order.courierName && ` - ${order.courierName.toUpperCase()}`}
              {order.courierService && ` (${order.courierService})`}
            </span>
          </div>
          {order.trackingNumber && (
            <div className="flex justify-between items-center mt-2">
              <span className="text-sovia-500">No. Resi</span>
              <span className={`font-mono font-bold px-2 py-0.5 rounded border border-sovia-200 ${isMobile ? 'bg-sovia-50 text-sovia-900' : 'bg-sovia-200 text-sovia-900'}`}>
                {order.trackingNumber}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tracking Timeline & Status Actions */}
      <div className={`border border-sovia-200 rounded-xl p-5 shadow-sm mt-4 ${isMobile ? 'bg-sovia-100' : 'bg-sovia-50'}`}>
        <h3 className="text-sovia-900 font-semibold mb-4 text-sm flex items-center gap-2">
          <Clock className="w-4 h-4 text-sovia-500" /> Riwayat Status
        </h3>

        <div className="mb-6 flex gap-2 items-center bg-sovia-100 p-3 rounded-lg border border-sovia-100 shadow-sm">
          <p className='text-sovia-500 text-sm'>Status Saat Ini:</p>
          <span className={`px-3 py-1 rounded-sm text-[11px] font-bold tracking-wide uppercase ${statusConfig[order.status]?.color}`}>
            {statusConfig[order.status]?.label}
          </span>
        </div>

        <div className="relative border-l-2 border-sovia-200 ml-3 space-y-6 mb-8">
          {order.status === "CANCELLED" ? (
            <div className="relative pl-6">
              <div className="absolute -left-[13px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 bg-sovia-50 border-rose-500 text-rose-500 z-10">
                <XCircle className="w-3 h-3" />
              </div>
              <div>
                <p className="text-sm font-semibold text-rose-600">Dibatalkan</p>
                <p className="text-xs text-sovia-500 mt-0.5">{new Date(order.updatedAt).toLocaleString("id-ID", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          ) : (
            statusOrder.map((status, index) => {
              const currentStatusIndex = statusOrder.indexOf(order.status)
              const isCompleted = index < currentStatusIndex || order.status === "COMPLETED"
              const isCurrent = index === currentStatusIndex
              const Icon = statusConfig[status].icon

              let timeStr = ""
              if (isCurrent) timeStr = new Date(order.updatedAt).toLocaleString("id-ID", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
              else if (index === 0 && (isCompleted || isCurrent)) timeStr = new Date(order.createdAt).toLocaleString("id-ID", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

              return (
                <div key={status} className="relative pl-6">
                  <div className={`absolute -left-[13px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 bg-sovia-50 z-10 ${isCompleted ? 'border-emerald-500 text-emerald-500' : isCurrent ? 'border-sovia-800 text-sovia-800' : 'border-sovia-200 text-sovia-300'}`}>
                    {isCompleted ? <CheckCircle className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${isCurrent ? 'text-sovia-900' : isCompleted ? 'text-sovia-700' : 'text-sovia-400'}`}>{statusConfig[status].label}</p>
                    {timeStr && <p className="text-xs text-sovia-500 mt-0.5">{timeStr}</p>}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Payment Proof in Status History */}
        {order.paymentProofUrl && (
          <div className="mb-6 bg-sovia-100 p-4 rounded-xl border border-sovia-200 shadow-sm">
            <h4 className="text-sm font-semibold text-sovia-800 mb-3 flex items-center gap-2">
              Bukti Pembayaran
            </h4>
            <a href={order.paymentProofUrl} target="_blank" rel="noreferrer" className="block w-full max-w-[200px] rounded-lg overflow-hidden border border-sovia-200 hover:opacity-90 transition-opacity">
              <img src={order.paymentProofUrl} alt="Bukti Pembayaran" className="w-full h-auto object-cover" />
            </a>
            <p className="text-xs text-sovia-500 mt-2">Klik gambar untuk melihat ukuran penuh</p>
          </div>
        )}

        <hr className="border-sovia-200 my-6" />

        <h3 className="text-sovia-900 font-semibold mb-4 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-sovia-500" /> Aksi & Update Status
        </h3>

        {order.status === "SHIPPED" ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setConfirmModal({
                isOpen: true,
                action: 'UPDATE_STATUS',
                orderId: order.id,
                targetStatus: 'COMPLETED',
                title: "Pesanan Diterima",
                message: "Apakah Anda yakin barang sudah diterima dengan baik dan pesanan diselesaikan?"
              });
            }}
            className="w-full px-4 py-2.5 bg-sovia-900 text-sovia-50 rounded-lg text-sm font-semibold hover:bg-sovia-800 transition-all shadow-md flex items-center justify-center gap-2"
          >
            <span>Pesanan Diterima</span>
          </button>
        ) : order.status === "COMPLETED" ? (
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-emerald-700 font-semibold text-sm">Pesanan Selesai</p>
              <p className="text-emerald-600 text-xs mt-1">Pesanan telah diselesaikan.</p>
            </div>
          </div>
        ) : order.status === "CANCELLED" ? (
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-lg flex items-start gap-3">
            <XCircle className="w-5 h-5 text-rose-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-rose-700 font-semibold text-sm">Pesanan Dibatalkan</p>
              <p className="text-rose-600 text-xs mt-1">Pesanan ini telah dibatalkan.</p>
            </div>
          </div>
        ) : order.status === "PENDING_PAYMENT" && order.paymentMethod === "MANUAL_TRANSFER" ? (
          <div className="bg-sovia-50 border border-sovia-100 p-4 rounded-lg">
            <p className="text-sovia-900 font-medium text-sm mb-4 text-center">Silakan Lakukan Pembayaran & Unggah Bukti</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left mb-6">
              <div className="bg-sovia-100 border border-sovia-200 p-3 rounded-lg flex flex-col h-full">
                <p className="text-sovia-500 text-[10px] font-medium mb-1 uppercase tracking-wider">Rekening Bank</p>
                <p className="text-sovia-900 text-sm font-medium whitespace-pre-wrap flex-grow">{storeProfile?.bankAccount || "Belum diatur"}</p>
                {storeProfile?.bankImage && (
                  <div className="mt-3 relative w-full h-24 bg-sovia-50 rounded border border-sovia-100 overflow-hidden">
                    <img src={storeProfile.bankImage} alt="Bank QR/Logo" className="absolute inset-0 w-full h-full object-contain p-1" />
                  </div>
                )}
              </div>
              <div className="bg-sovia-100 border border-sovia-200 p-3 rounded-lg flex flex-col h-full">
                <p className="text-sovia-500 text-[10px] font-medium mb-1 uppercase tracking-wider">E-Wallet</p>
                <p className="text-sovia-900 text-sm font-medium whitespace-pre-wrap flex-grow">{storeProfile?.eWallet || "Belum diatur"}</p>
                {storeProfile?.eWalletImage && (
                  <div className="mt-3 relative w-full h-24 bg-sovia-50 rounded border border-sovia-100 overflow-hidden">
                    <img src={storeProfile.eWalletImage} alt="E-Wallet QR/Logo" className="absolute inset-0 w-full h-full object-contain p-1" />
                  </div>
                )}
              </div>
            </div>

            <p className="text-sovia-600 text-xs text-center mb-4">Anda belum mengunggah bukti transfer. Unggah sekarang agar pesanan dapat diproses.</p>
            
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-sovia-300 border-dashed rounded-lg cursor-pointer bg-sovia-50 hover:bg-sovia-50 transition-all hover:border-sovia-500 group relative overflow-hidden">
              {uploadingProofId === order.id ? (
                <div className="flex flex-col items-center justify-center pt-4 pb-4">
                  <Loader2 className="w-6 h-6 text-sovia-400 mb-2 animate-spin" />
                  <div className="text-sovia-500 text-xs font-medium">Mengunggah...</div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center pt-4 pb-4">
                  <Upload className="w-6 h-6 text-sovia-400 mb-2 group-hover:-translate-y-1 transition-transform" />
                  <div className="bg-sovia-900 text-sovia-50 px-4 py-2 rounded-lg mb-2 text-xs font-medium hover:bg-sovia-800 transition-colors shadow-sm">
                    Pilih Foto Bukti Transfer
                  </div>
                  <p className="text-[10px] text-sovia-500">Maks. 5MB (PNG/JPG)</p>
                </div>
              )}
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={(e) => handleUploadProof(order.id, e)}
                disabled={uploadingProofId === order.id}
              />
            </label>
          </div>
        ) : (
          <div className="bg-sovia-50 border border-sovia-100 p-4 rounded-lg">
            <p className="text-sovia-600 text-sm text-center">Menunggu pesanan diproses penjual...</p>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen pt-12 pb-24 bg-sovia-100/50">
      <div className="w-full mx-auto px-4 md:px-8">

        {/* Page Header */}
        <div className="mb-8 max-w-[1280px] mx-auto px-4">
          <h1 className="text-sovia-900 text-3xl font-serif mb-2">Halaman Profil</h1>
          <p className="text-sovia-700 text-sm">Kelola informasi data diri, alamat pengiriman, dan lacak pesanan Anda di sini.</p>
        </div>

        {/* Section 1: Profil Saya */}
        <div className="mb-12 max-w-[1280px] mx-auto px-4">
          <div className="mb-6">
            <h2 className="text-sovia-900 text-2xl font-serif flex items-center gap-2">
              <User className="w-6 h-6 text-sovia-500" /> Profil Saya
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* Card Data Pribadi */}
            <div className="bg-sovia-50 rounded-xl shadow-sm border border-sovia-200 overflow-hidden relative flex flex-col lg:col-span-1">
              <div className="border-b border-sovia-100 bg-sovia-200 p-4 flex justify-between items-center">
                <h3 className="text-md font-semibold text-sovia-900">Data Pribadi</h3>
                <button
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className="text-sovia-600 hover:text-sovia-900 p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
                >
                  {isEditingProfile ? "Batal" : <><Edit className="w-3.5 h-3.5" /> Edit</>}
                </button>
              </div>

              <div className="p-5 md:p-6 flex-1 flex flex-col">
                {!isEditingProfile ? (
                  <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                    <div className="w-24 h-24 rounded-full bg-sovia-200/50 border border-sovia-200 overflow-hidden flex items-center justify-center flex-shrink-0 relative">
                      {formData.image ? (
                        <Image src={formData.image} alt={formData.name || "Profile"} fill sizes="96px" className="object-cover" />
                      ) : (
                        <User className="w-10 h-10 text-sovia-300" />
                      )}
                    </div>
                    <div className="flex-1 w-full space-y-4">
                      <div>
                        <p className="text-[11px] text-sovia-500 uppercase tracking-wider font-medium mb-0.5">Nama Lengkap</p>
                        <p className="text-sovia-900 font-medium text-sm">{formData.name || "-"}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-sovia-500 uppercase tracking-wider font-medium mb-0.5">Email</p>
                        <p className="text-sovia-900 text-sm flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-sovia-400" />
                          {session.user?.email || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-sovia-500 uppercase tracking-wider font-medium mb-0.5">No. Telepon & Pekerjaan</p>
                        <p className="text-sovia-900 text-sm">
                          {formData.phone || "-"} • {formData.job || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-sovia-500 uppercase tracking-wider font-medium mb-0.5">Tanggal Lahir</p>
                        <p className="text-sovia-900 text-sm flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-sovia-400" />
                          {formData.birthDate ? formatDate(formData.birthDate) : "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-200">
                    <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start border-b border-sovia-100 pb-5">
                      <div className="relative group">
                        <div className="w-20 h-20 rounded-full bg-sovia-100 border border-sovia-200 overflow-hidden flex items-center justify-center relative">
                          {formData.image ? (
                            <Image src={formData.image} alt="Profile" fill sizes="80px" className="object-cover" />
                          ) : (
                            <User className="w-8 h-8 text-sovia-300" />
                          )}
                          {uploading && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Loader2 className="w-5 h-5 text-sovia-50 animate-spin" />
                            </div>
                          )}
                        </div>
                        <label className="absolute bottom-0 right-0 p-1.5 bg-sovia-900 text-sovia-50 rounded-full cursor-pointer hover:bg-sovia-800 shadow-sm transition-transform hover:scale-105">
                          <Edit className="w-3 h-3" />
                          <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                        </label>
                      </div>
                      <div className="text-center sm:text-left pt-1">
                        <h3 className="text-sovia-800 font-medium text-sm">Foto Profil</h3>
                        <p className="text-sovia-500 text-xs mt-1">Rasio 1:1. Maksimal 3MB.</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sovia-700 text-xs font-medium block mb-1">Nama Lengkap <span className="text-red-500">*</span></label>
                        <input type="text" required value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} className="w-full py-2 px-3 bg-sovia-50 border border-sovia-200 rounded text-sovia-900 focus:outline-none focus:ring-1 focus:ring-sovia-500 text-sm" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sovia-700 text-xs font-medium block mb-1">Nomor Telepon <span className="text-red-500">*</span></label>
                          <input type="tel" required value={formData.phone} onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))} className="w-full py-2 px-3 bg-sovia-50 border border-sovia-200 rounded text-sovia-900 focus:outline-none focus:ring-1 focus:ring-sovia-500 text-sm" />
                        </div>
                        <div>
                          <label className="text-sovia-700 text-xs font-medium block mb-1">Tanggal Lahir</label>
                          <input type="date" value={formData.birthDate} onChange={(e) => setFormData((prev) => ({ ...prev, birthDate: e.target.value }))} className="w-full py-2 px-3 bg-sovia-50 border border-sovia-200 rounded text-sovia-900 focus:outline-none focus:ring-1 focus:ring-sovia-500 text-sm" />
                        </div>
                      </div>
                      <div>
                        <label className="text-sovia-700 text-xs font-medium block mb-1">Pekerjaan</label>
                        <input type="text" value={formData.job} onChange={(e) => setFormData((prev) => ({ ...prev, job: e.target.value }))} className="w-full py-2 px-3 bg-sovia-50 border border-sovia-200 rounded text-sovia-900 focus:outline-none focus:ring-1 focus:ring-sovia-500 text-sm" />
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <button type="submit" disabled={loading} className="px-5 py-2 bg-sovia-900 text-sovia-50 text-xs font-medium rounded-lg flex items-center gap-1.5 hover:bg-sovia-800 disabled:opacity-70 transition-colors">
                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Simpan Data Diri
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Card Alamat Pengiriman */}
            <div className="bg-sovia-50 rounded-xl shadow-sm border border-sovia-200 overflow-hidden relative flex flex-col lg:col-span-2">
              <div className="bg-sovia-200 p-4 flex justify-between items-center">
                <h3 className="text-md font-semibold font-serif text-sovia-900">Alamat Pengiriman</h3>
                <button
                  onClick={() => setIsEditingAddress(!isEditingAddress)}
                  className="text-sovia-600 hover:text-sovia-900 p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
                >
                  {isEditingAddress ? "Batal" : <><Edit className="w-3.5 h-3.5" /> Edit</>}
                </button>
              </div>

              <div className="p-5 md:p-6 flex-1 flex flex-col">
                {!isEditingAddress ? (
                  <div className="space-y-4">
                    <div className="bg-sovia-50 p-4 rounded-lg border border-sovia-100 flex gap-3 items-start">
                      <MapPin className="w-5 h-5 text-sovia-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sovia-900 text-sm leading-relaxed">{formData.address || "Belum ada alamat"}</p>
                        {formData.detailAddress && formData.detailAddress !== formData.address && (
                          <p className="text-sovia-600 text-xs mt-1.5 italic bg-sovia-100 p-2 rounded border border-sovia-100">Catatan Detail: {formData.detailAddress}</p>
                        )}
                      </div>
                    </div>
                    {formData.lat && formData.lng ? (
                      <div className="rounded-xl overflow-hidden border border-sovia-200 h-[180px] relative pointer-events-none">
                        <MapPicker lat={formData.lat} lng={formData.lng} onLocationChange={() => { }} height="h-[180px]" />
                        <div className="absolute inset-0 bg-transparent z-10" />
                      </div>
                    ) : (
                      <div className="rounded-xl overflow-hidden border border-sovia-100 bg-sovia-50 h-[180px] flex items-center justify-center">
                        <p className="text-sovia-400 text-sm flex items-center gap-2"><Map className="w-4 h-4" /> Peta belum diatur</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-200">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs text-sovia-500">Pilih dari dropdown atau gunakan lokasi saya.</p>
                      <button type="button" onClick={handleGetLocation} className="text-[11px] text-sovia-600 hover:text-sovia-900 flex items-center gap-1 bg-sovia-100 px-2.5 py-1 rounded">
                        <Map className="w-3 h-3" /> Lokasi Saya
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <select required value={addressDetails.provinceId} onChange={(e) => { const selected = provinces.find(p => p.id === e.target.value); setAddressDetails(prev => ({ ...prev, provinceId: e.target.value, provinceName: selected ? selected.name : "", regencyId: "", regencyName: "", districtId: "", districtName: "", villageId: "", villageName: "" })) }} className="w-full py-2 px-2.5 bg-sovia-50 border border-sovia-200 rounded focus:outline-none focus:ring-1 focus:ring-sovia-500 text-sovia-900 text-xs">
                          <option value="">Pilih Provinsi</option>
                          {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <select required value={addressDetails.regencyId} onChange={(e) => { const selected = regencies.find(r => r.id === e.target.value); setAddressDetails(prev => ({ ...prev, regencyId: e.target.value, regencyName: selected ? selected.name : "", districtId: "", districtName: "", villageId: "", villageName: "" })) }} disabled={!addressDetails.provinceId} className="w-full py-2 px-2.5 bg-sovia-50 border border-sovia-200 rounded focus:outline-none focus:ring-1 focus:ring-sovia-500 text-sovia-900 text-xs disabled:opacity-50">
                          <option value="">Pilih Kota/Kabupaten</option>
                          {regencies.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <select required value={addressDetails.districtId} onChange={(e) => { const selected = districts.find(d => d.id === e.target.value); setAddressDetails(prev => ({ ...prev, districtId: e.target.value, districtName: selected ? selected.name : "", villageId: "", villageName: "" })) }} disabled={!addressDetails.regencyId} className="w-full py-2 px-2.5 bg-sovia-50 border border-sovia-200 rounded focus:outline-none focus:ring-1 focus:ring-sovia-500 text-sovia-900 text-xs disabled:opacity-50">
                          <option value="">Pilih Kecamatan</option>
                          {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <select required value={addressDetails.villageId} onChange={(e) => { const selected = villages.find(v => v.id === e.target.value); setAddressDetails(prev => ({ ...prev, villageId: e.target.value, villageName: selected ? selected.name : "" })) }} disabled={!addressDetails.districtId} className="w-full py-2 px-2.5 bg-sovia-50 border border-sovia-200 rounded focus:outline-none focus:ring-1 focus:ring-sovia-500 text-sovia-900 text-xs disabled:opacity-50">
                          <option value="">Pilih Kelurahan</option>
                          {villages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-3 mb-4">
                      <div className="flex-1"><input type="text" value={addressDetails.rt} onChange={(e) => setAddressDetails(prev => ({ ...prev, rt: e.target.value }))} className="w-full py-2 px-2.5 bg-sovia-50 border border-sovia-200 rounded text-xs" placeholder="RT" /></div>
                      <div className="flex-1"><input type="text" value={addressDetails.rw} onChange={(e) => setAddressDetails(prev => ({ ...prev, rw: e.target.value }))} className="w-full py-2 px-2.5 bg-sovia-50 border border-sovia-200 rounded text-xs" placeholder="RW" /></div>
                      <div className="flex-1"><input type="text" required value={addressDetails.postalCode} onChange={(e) => setAddressDetails(prev => ({ ...prev, postalCode: e.target.value }))} className="w-full py-2 px-2.5 bg-sovia-50 border border-sovia-200 rounded text-xs" placeholder="Kode Pos" /></div>
                    </div>

                    <div className="mb-4">
                      <textarea required value={addressDetails.street} onChange={(e) => setAddressDetails(prev => ({ ...prev, street: e.target.value }))} placeholder="Detail Alamat (Contoh: Jl. Sudirman Kav 21, Blok A No. 12)" rows={2} className="w-full py-2 px-3 bg-sovia-50 border border-sovia-200 rounded text-xs resize-none focus:outline-none focus:ring-1 focus:ring-sovia-500"></textarea>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sovia-700 text-xs font-medium flex items-center gap-1">
                          Titik Lokasi (Pin Peta)
                          {isFirstTimeAddress && <span className="text-red-500">*</span>}
                        </label>
                        {isFirstTimeAddress && (!formData.lat || !formData.lng || formData.lat === 0 || formData.lng === 0) && (
                          <span className="text-[10px] text-red-500 font-medium animate-pulse">Wajib ditentukan</span>
                        )}
                      </div>
                      <div className={`rounded-xl overflow-hidden h-[200px] border-2 transition-colors ${
                        isFirstTimeAddress && (!formData.lat || !formData.lng || formData.lat === 0 || formData.lng === 0)
                          ? 'border-red-400'
                          : 'border-sovia-200'
                      }`}>
                        <MapPicker lat={formData.lat} lng={formData.lng} onLocationChange={(lat, lng) => setFormData(p => ({ ...p, lat, lng }))} height="h-[200px]" />
                      </div>
                      {isFirstTimeAddress && (!formData.lat || !formData.lng || formData.lat === 0 || formData.lng === 0) ? (
                        <p className="text-[10px] text-red-500 mt-1.5 text-center font-medium">
                          ⚠ Geser pin atau klik tombol "Lokasi Saya" untuk menentukan titik pengiriman. Wajib diisi.
                        </p>
                      ) : (
                        <p className="text-[10px] text-sovia-500 mt-1.5 text-center">Geser pin untuk menentukan titik pengiriman presisi.</p>
                      )}
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={loading || (isFirstTimeAddress && (!formData.lat || !formData.lng || formData.lat === 0 || formData.lng === 0))}
                        title={isFirstTimeAddress && (!formData.lat || !formData.lng || formData.lat === 0 || formData.lng === 0) ? "Tentukan titik lokasi pada peta terlebih dahulu" : undefined}
                        className="px-5 py-2 bg-sovia-900 text-sovia-50 text-xs font-medium rounded-lg flex items-center gap-1.5 hover:bg-sovia-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Simpan Alamat
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Card Keamanan Akun */}
            <div className="bg-sovia-50 rounded-xl shadow-sm border border-sovia-200 overflow-hidden relative flex flex-col lg:col-span-3">
              <div className="border-b border-sovia-100 bg-sovia-200 p-4 flex justify-between items-center">
                <h3 className="text-md font-semibold text-sovia-900 flex items-center gap-2">
                  Keamanan Akun
                </h3>
                <button
                  onClick={() => {
                    setIsEditingPassword(!isEditingPassword);
                    setPasswordData({ currentPassword: "", newPassword: "" });
                  }}
                  className="text-sovia-600 hover:text-sovia-900 p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
                >
                  {isEditingPassword ? "Batal" : <><Edit className="w-3.5 h-3.5" /> Atur Password</>}
                </button>
              </div>

              <div className="p-5 md:p-6">
                {!isEditingPassword ? (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-sovia-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Lock className="w-5 h-5 text-sovia-400" />
                    </div>
                    <div>
                      <p className="text-sovia-900 font-medium text-sm">Password</p>
                      <p className="text-sovia-500 text-xs mt-1 leading-relaxed max-w-xl">
                        Atur password Anda untuk dapat login tanpa Google di kemudian hari. Jika Anda sudah memiliki password, Anda dapat merubahnya di sini.
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-sm animate-in fade-in duration-200">
                    <div>
                      <label className="text-sovia-700 text-xs font-medium block mb-1">Password Saat Ini (Opsional)</label>
                      <input 
                        type="password" 
                        value={passwordData.currentPassword} 
                        onChange={(e) => setPasswordData(p => ({ ...p, currentPassword: e.target.value }))}
                        className="w-full py-2 px-3 bg-sovia-50 border border-sovia-200 rounded text-sovia-900 focus:outline-none focus:ring-1 focus:ring-sovia-500 text-sm"
                        placeholder="Kosongkan jika belum pernah mengatur"
                      />
                    </div>
                    <div>
                      <label className="text-sovia-700 text-xs font-medium block mb-1">Password Baru <span className="text-red-500">*</span></label>
                      <input 
                        type="password" 
                        required 
                        minLength={6}
                        value={passwordData.newPassword} 
                        onChange={(e) => setPasswordData(p => ({ ...p, newPassword: e.target.value }))}
                        className="w-full py-2 px-3 bg-sovia-50 border border-sovia-200 rounded text-sovia-900 focus:outline-none focus:ring-1 focus:ring-sovia-500 text-sm"
                        placeholder="Minimal 6 karakter"
                      />
                    </div>
                    <div className="flex justify-end pt-2">
                      <button type="submit" disabled={passwordLoading} className="px-5 py-2 bg-sovia-900 text-sovia-50 text-xs font-medium rounded-lg flex items-center gap-1.5 hover:bg-sovia-800 disabled:opacity-70 transition-colors">
                        {passwordLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Simpan Password
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Pesanan Saya */}
        <div id="pesanan-saya-section" className="pb-5 animate-in fade-in duration-500 pt-8 border-t border-sovia-200">
          {/* Sticky Header Group: Title + Tabs */}
          <div className="sticky top-0 z-30 bg-sovia-50 backdrop-blur-md pt-4 pb-4 -mx-4 px-4 md:-mx-8 md:px-8 border-b border-sovia-200 mb-6 ">
            <div className="flex justify-between items-center mb-6 max-w-[1280px] mx-auto px-4">
              <div>
                <h2 className="text-sovia-900 text-2xl font-serif mb-1 flex items-center gap-2">
                  <Package className="w-6 h-6 text-sovia-500" /> Pesanan Saya
                </h2>
                <p className="text-sovia-700 text-sm">Riwayat dan pelacakan pesanan Anda.</p>
              </div>
            </div>

            {/* Tabs (Desktop) */}
            <div className="hidden md:flex overflow-x-auto gap-8 w-full scrollbar-hide pb-2 max-w-[1280px] mx-auto px-4">
              {tabs.map((tab) => {
                const count = tab.id === "ALL" ? orders.length : orders.filter(o => o.status === tab.id).length
                const isActive = orderFilter === tab.id

                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setOrderFilter(tab.id)
                      setSelectedOrder(null)
                      document.getElementById("pesanan-saya-section")?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }}
                    className={`pb-3 text-sm font-medium transition-all relative flex items-center gap-2 whitespace-nowrap outline-none ${isActive
                      ? "text-sovia-900 border-b-2 border-sovia-900"
                      : "text-sovia-500 hover:text-sovia-800"
                      }`}
                  >
                    {tab.label}
                    {count > 0 && (
                      <span className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] rounded-full transition-colors font-serif ${isActive ? 'bg-sovia-800 text-sovia-50' : 'bg-sovia-200 text-sovia-700'
                        }`}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Tabs (Mobile Select) */}
            <div className="md:hidden pb-2 max-w-[1280px] mx-auto px-4">
              <Select
                value={orderFilter}
                onValueChange={(val: string | null) => {
                  if (val) {
                    setOrderFilter(val)
                  }
                  setSelectedOrder(null)
                  document.getElementById("pesanan-saya-section")?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
              >
                <SelectTrigger className="w-full bg-sovia-50 border-sovia-200 py-6 px-4 rounded-xl text-sovia-900 shadow-sm focus:ring-1 focus:ring-sovia-400">
                  <span className="flex flex-1 text-left">
                    {tabs.find(t => t.id === orderFilter)?.label || "Semua Pesanan"}
                  </span>
                </SelectTrigger>
                <SelectContent className="bg-sovia-50 border-sovia-200 shadow-md rounded-xl">
                  {tabs.map((tab) => {
                    const count = tab.id === "ALL" ? orders.length : orders.filter(o => o.status === tab.id).length
                    const isActive = orderFilter === tab.id
                    return (
                      <SelectItem key={tab.id} value={tab.id} className="cursor-pointer focus:bg-sovia-100/50 py-3">
                        <div className="flex items-center justify-between w-full min-w-[200px]">
                          <span className="font-medium text-sovia-900">{tab.label}</span>
                          {count > 0 && (
                            <span className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] rounded-full transition-colors font-serif ml-3 ${isActive ? 'text-sovia-700 bg-sovia-200' : 'bg-sovia-200 text-sovia-700'}`}>
                              {count}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Orders Layout */}
          <div className="flex flex-col lg:flex-row gap-6 items-stretch max-w-[1280px] mx-auto px-4">
            {/* Orders List (Left / Main) */}
            <div className={`flex-1 w-full space-y-3 transition-all duration-500 ${selectedOrder ? "lg:max-w-[450px]" : ""}`}>
              <div className="flex flex-row items-stretch sm:items-center justify-between gap-3 mb-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-sovia-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Cari ID pesanan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-sovia-200/30 border border-sovia-200 rounded-lg text-sm text-sovia-700 focus:outline-none focus:ring-1 focus:ring-sovia-400 transition-shadow placeholder:text-sovia-400"
                  />
                </div>

                <button
                  onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-sovia-700 border border-sovia-200 rounded-lg text-sm font-medium text-sovia-50 hover:bg-sovia-900 transition-all active:transform-[scale(0.95)]"
                >
                  <ArrowUpDown className="w-4 h-4 text-sovia-50" />
                  {sortOrder === "desc" ? "Terbaru" : "Terdahulu"}
                </button>
              </div>

              {loadingOrders ? (
                <div className="text-center py-16 text-sovia-500 animate-pulse">Memuat pesanan...</div>
              ) : paginatedOrders.length === 0 ? (
                <div className="text-center py-16 h-[100%] w-full bg-sovia-100 rounded-2xl border border-sovia-200 animate-in fade-in zoom-in-95 duration-300">
                  <Package className="w-12 h-12 text-sovia-300 mx-auto mb-3" />
                  <p className="text-sovia-600 font-medium">Tidak ada pesanan</p>
                  <p className="text-sovia-400 text-sm mt-1">Belum ada riwayat pesanan dengan status ini.</p>
                </div>
              ) : (
                <>
                  {paginatedOrders.map((order, index) => {
                  const statusInfo = statusConfig[order.status] || statusConfig.PENDING_PAYMENT
                  const isSelected = selectedOrder?.id === order.id

                  return (
                    <div
                      key={order.id}
                      className={`bg-sovia-50 rounded-xl shadow-sm transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 align-items-center overflow-hidden  active:transform-[scale(0.98)]  ${isSelected ? 'align-items-center bg-sovia-200/50' : ' hover:shadow-md '
                        }`}
                      style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
                    >
                      <div
                        className={`p-4 cursor-pointer flex justify-between gap-4 flex-col md:flex-row md:items-center ${selectedOrder ? 'lg:flex-row lg:items-center' : ''}`}
                        onClick={() => setSelectedOrder(isSelected ? null : order)}
                      >
                        {/* Column 1: ID Data */}
                        <div className={`flex flex-col flex-shrink-0 w-full md:w-1/4 ${selectedOrder ? 'lg:flex-1 lg:min-w-0' : ''}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <Package className="w-4 h-4 text-sovia-400" />
                            <span className="text-sovia-800 font-mono font-medium text-sm">#{order.id.split('-')[0].toUpperCase()}</span>
                          </div>
                          <p className="text-sovia-500 text-xs">
                            {formatDate(order.createdAt)} • {new Date(order.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>

                        {/* Column 2: Mini Products */}
                        {!selectedOrder && order.items.length > 0 && (
                          <div className="hidden md:flex flex-1 items-center justify-start gap-3 overflow-x-auto scrollbar-hide py-3 md:py-0 md:border-x border-sovia-100 md:px-4 w-full border-y md:border-y-0 mt-2 md:mt-0">
                            {order.items.slice(0, 5).map((item) => {
                              let imageUrl = "https://placehold.co/80x96/F3EFE6/3C3228?text=Item";
                              if (item.product.images) {
                                try {
                                  const parsed = JSON.parse(item.product.images);
                                  if (Array.isArray(parsed) && parsed.length > 0) imageUrl = parsed[0];
                                  else if (typeof parsed === "string") imageUrl = parsed;
                                } catch (e) {
                                  imageUrl = item.product.images;
                                }
                              }
                              return (
                                <div key={item.id} className="flex flex-col items-center w-12 flex-shrink-0">
                                  <div className="w-10 h-12 bg-sovia-100 rounded overflow-hidden border border-sovia-200 mb-1 relative">
                                    <Image src={imageUrl} alt={item.product.name} fill sizes="40px" className="object-cover" />
                                  </div>
                                  <p className="text-sovia-500 text-[9px] truncate w-full text-center leading-tight font-medium" title={item.product.name}>{item.product.name}</p>
                                </div>
                              )
                            })}
                            {order.items.length > 5 && (
                              <div className="flex flex-col items-center w-10 flex-shrink-0">
                                <div className="w-10 h-12 bg-sovia-100 rounded border border-sovia-200 mb-1 flex items-center justify-center">
                                  <span className="text-sovia-600 text-[10px] font-bold">+{order.items.length - 5}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Column 3: Status & Price */}
                        <div className={`flex justify-between flex-shrink-0 flex-row md:flex-col items-center md:items-end w-full md:w-[20%] pt-1 md:pt-0 ${selectedOrder ? 'lg:flex-col lg:items-end lg:gap-1 lg:w-auto lg:pt-0' : ''}`}>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                          <div className="text-right mt-0 md:mt-2">
                            <p className="text-sovia-500 text-[10px] font-medium hidden md:block">{order.items.length} Produk</p>
                            <p className="text-sovia-900 font-serif font-semibold md:mt-0.5 text-sm md:text-base">
                              {formatPrice(order.total)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Inline Mobile Details */}
                      <div
                        className={`lg:hidden transition-all duration-300 ease-in-out bg-sovia-50/50 ${isSelected ? 'max-h-[2500px] opacity-100 p-4 border-t border-sovia-100' : 'max-h-0 opacity-0 px-4'
                          }`}
                      >
                        {isSelected && renderOrderDetails(order, true)}
                      </div>
                    </div>
                  )
                })}
                
                {/* Pagination Controls */}
                {filteredOrders.length > 0 && (
                  <div className="px-4 py-4 border-t border-sovia-200/30 flex justify-between items-center mt-4 bg-sovia-50 rounded-xl shadow-sm">
                    <p className="text-sovia-700 text-xs hidden sm:block">
                      Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredOrders.length)} dari {filteredOrders.length} pesanan
                    </p>
                    <div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-end">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => {
                            setCurrentPage(page);
                            document.getElementById("pesanan-saya-section")?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }}
                          className={`w-8 h-8 rounded-xl text-xs transition-all active:scale-95 ${page === currentPage
                            ? "bg-sovia-700 text-sovia-50 hover:bg-sovia-600"
                            : "bg-sovia-200 text-sovia-800 hover:bg-sovia-500"
                            }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                </>
              )}
            </div>

            {/* Order Details Sidebar (Right - Desktop) */}
            {selectedOrder && (
              <div className="hidden lg:block lg:flex-1 relative">
                <div className="bg-sovia-50 border border-sovia-200 rounded-2xl shadow-sm sticky top-[150px] animate-in slide-in-from-right-8 fade-in duration-500 max-h-[calc(100vh-160px)] flex flex-col overflow-hidden">
                  <div className="flex justify-between items-start border-b border-sovia-200 pt-6 px-6 pb-5 bg-sovia-200 shrink-0">
                    <div>
                      <h2 className="text-xl font-serif text-sovia-900 font-semibold mb-1">Detail Pesanan</h2>
                      <p className="text-sovia-500 text-sm font-mono">#{selectedOrder.id.split('-')[0].toUpperCase()} • {formatDate(selectedOrder.createdAt)}</p>
                    </div>
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="p-1.5 hover:bg-sovia-100/50 rounded-lg text-sovia-500 transition-colors hover:text-sovia-800 -mt-1 -mr-1"
                      title="Tutup Detail"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="px-6 pb-6 pt-5 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                    {renderOrderDetails(selectedOrder, false)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Generic Confirm Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-sovia-50 rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-sovia-100">
            <div className="p-6">
              <h2 className={`text-xl font-semibold mb-2 ${confirmModal.action === 'REJECT' ? 'text-rose-600' : 'text-sovia-900'}`}>
                {confirmModal.title}
              </h2>
              <p className="text-sm text-sovia-500 leading-relaxed">
                {confirmModal.message}
              </p>
            </div>
            <div className="px-6 py-4 bg-sovia-50/80 border-t border-sovia-100 flex justify-end gap-3">
              <button
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="px-4 py-2 text-sm font-medium text-sovia-700 hover:bg-sovia-100 rounded-lg transition-colors border border-sovia-200 bg-sovia-100 shadow-sm"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (confirmModal.action === 'UPDATE_STATUS' && confirmModal.orderId && confirmModal.targetStatus) {
                    confirmOrder(confirmModal.orderId, true);
                  }
                  setConfirmModal({ ...confirmModal, isOpen: false });
                }}
                className={`px-4 py-2 text-sm font-medium text-sovia-50 rounded-lg shadow-sm transition-colors ${confirmModal.action === 'REJECT' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-sovia-800 hover:bg-sovia-900'
                  }`}
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Komponen Halaman Profil Pengguna (ProfilePage) yang dibungkus Suspense
 * agar parameter tab/query search didukung saat render.
 */
export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen pt-32 pb-16 flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
