import ProductsGrid from '../components/products-grid';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">Latest Products</h1>
        <ProductsGrid />
      </div>
    </div>
  );
}
