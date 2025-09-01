import ProductsGrid from '../components/products-grid';
import FlashSaleSection from '../components/flash-sale-section';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <FlashSaleSection />
        <h1 className="text-2xl font-semibold mb-4 mt-10">Latest Products</h1>
        <ProductsGrid />
      </div>
    </div>
  );
}
