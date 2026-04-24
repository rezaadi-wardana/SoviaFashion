import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const BITESHIP_API_URL = 'https://api.biteship.com/v1/rates/couriers';

// Daftar kurir yang didukung
const SUPPORTED_COURIERS = 'jne,jnt,sicepat,anteraja,ninja,lion,pos';

export async function POST(req: NextRequest) {
  try {
    const { destinationLat, destinationLng, items, isCod } = await req.json();

    if (!destinationLat || !destinationLng) {
      return NextResponse.json(
        { error: "Koordinat tujuan diperlukan. Silakan atur lokasi pengiriman di profil Anda." },
        { status: 400 }
      );
    }

    // Ambil koordinat toko dari StoreProfile
    const storeProfile = await prisma.storeProfile.findUnique({
      where: { id: 'store-profile' },
    });

    if (!storeProfile?.lat || !storeProfile?.lng) {
      return NextResponse.json(
        { error: "Lokasi toko belum dikonfigurasi. Hubungi admin." },
        { status: 500 }
      );
    }

    // Hitung total berat (default 300g per item jika tidak ada field weight)
    const totalWeight = items?.reduce(
      (sum: number, item: { weight?: number; quantity: number }) =>
        sum + (item.weight || 300) * item.quantity,
      0
    ) || 300;

    // Hitung total nilai barang
    const totalValue = items?.reduce(
      (sum: number, item: { price: number; quantity: number }) =>
        sum + item.price * item.quantity,
      0
    ) || 0;

    // Parameter untuk request ke Biteship
    const requestBody: Record<string, unknown> = {
      origin_latitude: storeProfile.lat,
      origin_longitude: storeProfile.lng,
      destination_latitude: destinationLat,
      destination_longitude: destinationLng,
      couriers: SUPPORTED_COURIERS,
      items: [
        {
          name: "Fashion Package",
          value: totalValue,
          weight: totalWeight,
          quantity: 1,
        },
      ],
    };

    // Aktifkan COD jika metode yang dipilih
    if (isCod) {
      requestBody.couriers = 'jne,jnt,sicepat'; // Hanya kurir yang mendukung COD
    }

    const response = await fetch(BITESHIP_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': process.env.BITESHIP_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Biteship API error:", data);
      return NextResponse.json(
        { error: data.error || "Gagal mengambil tarif pengiriman" },
        { status: response.status }
      );
    }

    // Format response agar lebih mudah digunakan di frontend
    interface BiteshipCourier {
      available_for_cash_on_delivery: boolean;
      courier_name: string;
      courier_code: string;
      courier_service_name: string;
      courier_service_code: string;
      description: string;
      duration: string;
      price: number;
      shipment_duration_range?: string;
      shipment_duration_unit?: string;
      type?: string;
    }

    const formattedRates = (data.pricing || [])
      .filter((courier: BiteshipCourier) => {
        // Jika request COD, hanya ambil kurir yang mendukung COD
        if (isCod) {
          return courier.available_for_cash_on_delivery;
        }
        return true;
      })
      .map((courier: BiteshipCourier) => ({
        courierName: courier.courier_name,
        courierCode: courier.courier_code,
        serviceName: courier.courier_service_name,
        serviceCode: courier.courier_service_code,
        description: courier.description,
        duration: courier.duration,
        price: courier.price,
        shipmentDurationRange: courier.shipment_duration_range || '',
        shipmentDurationUnit: courier.shipment_duration_unit || '',
        type: courier.type || 'regular',
      }));

    return NextResponse.json({
      success: true,
      origin: {
        lat: storeProfile.lat,
        lng: storeProfile.lng,
        address: storeProfile.address,
      },
      destination: {
        lat: destinationLat,
        lng: destinationLng,
      },
      rates: formattedRates,
    });

  } catch (error) {
    console.error("Error fetching shipping rates:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil tarif pengiriman" },
      { status: 500 }
    );
  }
}