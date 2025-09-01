# API Hooks Usage Guide

This directory contains React Query hooks for all APIs in the OnMall application.

## Directory Structure

```
src/app/_api/
├── index.ts                 # Main exports
├── vendor/
│   ├── index.ts
│   ├── use-vendor-queries.tsx
│   └── use-vendor-mutations.tsx
├── product/
│   ├── index.ts
│   ├── use-product-queries.tsx
│   └── use-product-mutations.tsx
├── media/
│   ├── index.ts
│   └── use-media-uploads.tsx
└── kyc/
    ├── index.ts
    └── use-kyc-mutations.tsx
```

## Usage Examples

### Vendor Operations

```tsx
import {
  useVendorProfile,
  useVendorList,
  useCreateVendor,
  useUpdateVendor,
  useApproveVendor
} from '@/app/_api';

// Get current vendor profile
const VendorProfile = () => {
  const { data: vendor, isLoading, error } = useVendorProfile();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>{vendor?.shopName}</div>;
};

// Create vendor
const CreateVendorForm = () => {
  const createVendor = useCreateVendor();
  
  const handleSubmit = (data: { shopName: string; description?: string }) => {
    createVendor.mutate(data);
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
};
```

### Product Operations

```tsx
import {
  useProductList,
  useProductDetail,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct
} from '@/app/_api';

// List products with pagination
const ProductList = () => {
  const { data: products, isLoading } = useProductList(1, 12, 'search', 'categoryId');
  
  return (
    <div>
      {products?.items.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
};

// Create product with images
const CreateProductForm = () => {
  const createProduct = useCreateProduct();
  
  const handleSubmit = (data: {
    name: string;
    price: number;
    images?: Array<{ url: string; public_id: string }>;
  }) => {
    createProduct.mutate(data);
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
};
```

### Media Upload

```tsx
import {
  useImageUpload,
  useVideoUpload,
  useMultipleImageUpload
} from '@/app/_api';

const MediaUpload = () => {
  const imageUpload = useImageUpload();
  const videoUpload = useVideoUpload();
  
  const handleImageUpload = (file: File) => {
    imageUpload.mutate(file, {
      onSuccess: (data) => {
        console.log('Uploaded:', data.result.public_id, data.result.secure_url);
      }
    });
  };
  
  return (
    <div>
      <input 
        type="file" 
        accept="image/*" 
        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
      />
    </div>
  );
};
```

### KYC Operations

```tsx
import {
  useKycUpload,
  useKycSignedUrl,
  useKycDelete
} from '@/app/_api';

const KycUpload = () => {
  const kycUpload = useKycUpload();
  const getSignedUrl = useKycSignedUrl();
  
  const handleUpload = (file: File, documentType: 'CNIC' | 'PASSPORT' | 'LICENSE') => {
    kycUpload.mutate({ file, documentType });
  };
  
  const viewDocument = (public_id: string) => {
    getSignedUrl.mutate({ public_id }, {
      onSuccess: (data) => {
        window.open(data.signedUrl, '_blank');
      }
    });
  };
  
  return <div>KYC Upload Component</div>;
};
```

## Features

- **Type Safety**: All hooks are fully typed with Hono's type inference
- **Error Handling**: Consistent error handling with toast notifications
- **Cache Management**: Automatic query invalidation for related data
- **Optimistic Updates**: Query cache updates on successful mutations
- **Loading States**: Built-in loading and error states
- **Pagination Support**: Easy pagination for list queries
- **Media Handling**: Specialized hooks for image/video uploads
- **KYC Integration**: Secure document upload and management

## Notes

- All mutation hooks include automatic toast notifications
- Query keys are consistently named for easy cache management
- Media uploads return Cloudinary response format
- KYC operations are designed for secure document handling
- Product and vendor operations support all CRUD operations
