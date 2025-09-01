import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types
type CartItem = {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    images: Array<{ url: string }>;
    vendor: { shopName: string };
  };
};

type CartData = {
  items: CartItem[];
  total: number;
};

// API functions
async function fetchCart(): Promise<CartData> {
  const res = await fetch('/api/cart', { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch cart');
  return res.json();
}

async function addToCart(productId: string, quantity = 1): Promise<CartData> {
  const res = await fetch('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ productId, quantity }),
  });
  if (!res.ok) throw new Error('Failed to add to cart');
  return res.json();
}

async function updateCartItem(productId: string, quantity: number): Promise<CartData> {
  const res = await fetch('/api/cart', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ productId, quantity }),
  });
  if (!res.ok) throw new Error('Failed to update cart');
  return res.json();
}

async function clearCart(): Promise<CartData> {
  const res = await fetch('/api/cart', {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to clear cart');
  return res.json();
}

// Hooks
export function useCart() {
  return useQuery<CartData, Error>({
    queryKey: ['cart'],
    queryFn: fetchCart,
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity?: number }) =>
      addToCart(productId, quantity),
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      updateCartItem(productId, quantity),
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: clearCart,
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
    },
  });
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (productId: string) => updateCartItem(productId, 0),
    onSuccess: (data) => {
      queryClient.setQueryData(['cart'], data);
    },
  });
}
