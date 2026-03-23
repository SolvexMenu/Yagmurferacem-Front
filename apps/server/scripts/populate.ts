import prisma from "@/db";

interface ProductVariant {
    size: number;
    color: string;
    available: boolean;
    stock: number;
}

interface StructuredProduct {
    id: string;
    name: string;
    price: number;
    description: string;
    imageUrls: string[];
    discount: number | null;
    stockCode: string;
    available: boolean;
    categories: string[];
    variants: ProductVariant[];
}

async function seedDatabase() {
    try {
        console.log('📖 structured-products.json dosyası okunuyor...');

        const file = Bun.file('./scripts/structured-products.json');
        const exists = await file.exists();

        if (!exists) {
            console.error('❌ structured-products.json dosyası bulunamadı!');
            return;
        }

        console.log('📄 Dosya bulundu, içerik okunuyor...');
        const products: StructuredProduct[] = await file.json();

        if (!products || !Array.isArray(products)) {
            console.error('❌ Geçersiz JSON formatı!');
            return;
        }

        console.log(`✅ ${products.length} ürün yüklendi.\n`);

        console.log('🗑️  Mevcut veriler temizleniyor...');
        await prisma.productVariant.deleteMany();
        await prisma.size.deleteMany();
        await prisma.color.deleteMany();
        await prisma.product.deleteMany();
        console.log('✅ Temizleme tamamlandı.\n');

        console.log('💾 Ürünler veritabanına ekleniyor...');

        let successCount = 0;
        let errorCount = 0;

        for (const product of products) {
            try {
                // Duplicate varyantları temizle (aynı size+color kombinasyonu)
                const uniqueVariants = product.variants.reduce((acc, variant) => {
                    const key = `${variant.size}-${variant.color}`;
                    if (!acc.has(key)) {
                        acc.set(key, variant);
                    } else {
                        // Duplicate bulundu, stokları topla
                        const existing = acc.get(key)!;
                        existing.stock += variant.stock;
                        existing.available = existing.available || variant.available;
                    }
                    return acc;
                }, new Map<string, ProductVariant>());

                const cleanVariants = Array.from(uniqueVariants.values());

                console.log(`   📦 ${product.name}: ${product.variants.length} → ${cleanVariants.length} varyant`);

                // Benzersiz size ve color değerlerini topla
                const uniqueSizes = [...new Set(cleanVariants.map(v => v.size))];
                const uniqueColors = [...new Set(cleanVariants.map(v => v.color))];

                // Ürünü oluştur
                await prisma.product.create({
                    data: {
                        name: product.name,
                        price: product.price,
                        description: product.description,
                        imageUrls: product.imageUrls,
                        discount: product.discount,
                        stockCode: product.stockCode,
                        available: product.available,
                        categories: product.categories,
                        // Temizlenmiş varyantları oluştur
                        variants: {
                            create: cleanVariants.map(variant => ({
                                size: variant.size,
                                color: variant.color,
                                available: variant.available,
                                stock: variant.stock,
                            }))
                        },
                        // Size tablosuna ekle
                        Size: {
                            create: uniqueSizes.map(size => ({
                                size: size,
                                available: cleanVariants.some(v => v.size === size && v.available)
                            }))
                        },
                        // Color tablosuna ekle
                        Color: {
                            create: uniqueColors.map(color => ({
                                color: color,
                                available: cleanVariants.some(v => v.color === color && v.available)
                            }))
                        }
                    }
                });

                successCount++;

                if (successCount % 10 === 0) {
                    console.log(`   ✓ ${successCount}/${products.length} ürün eklendi...`);
                }

            } catch (error) {
                errorCount++;
                console.error(`   ✗ Hata (${product.name}):`);
                if (error instanceof Error) {
                    console.error(`     Mesaj: ${error.message}`);
                    if (error.message.includes('Unique constraint failed')) {
                        console.error(`     Duplicate varyant sorunu olabilir`);
                    }
                }
                // Sadece ilk 5 hatayı detaylı göster
                if (errorCount <= 5) {
                    console.error(`     Detay:`, error);
                }
            }
        }

        console.log('\n📊 Özet:');
        console.log(`   ✅ Başarılı: ${successCount} ürün`);
        console.log(`   ❌ Hatalı: ${errorCount} ürün`);

        // Veritabanı istatistikleri
        const totalProducts = await prisma.product.count();
        const totalVariants = await prisma.productVariant.count();
        const totalSizes = await prisma.size.count();
        const totalColors = await prisma.color.count();

        console.log('\n📈 Veritabanı durumu:');
        console.log(`   - Toplam ürün: ${totalProducts}`);
        console.log(`   - Toplam varyant: ${totalVariants}`);
        console.log(`   - Toplam size: ${totalSizes}`);
        console.log(`   - Toplam color: ${totalColors}`);

    } catch (error) {
        console.error('❌ Kritik hata:', error);
        console.error('Hata detayı:', error instanceof Error ? error.message : String(error));
        console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A');
    } finally {
        console.log('🔌 Prisma bağlantısı kapatılıyor...');
        await prisma.$disconnect();
        console.log('✅ İşlem tamamlandı.');
    }
}

seedDatabase();
