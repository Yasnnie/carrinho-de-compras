import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart")

    if (storagedCart) return JSON.parse(storagedCart);

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const existInCart = cart.find((item) => item.id === productId)
      const stock = await api.get(`/stock/${productId}`)
      const stockAmmount = stock.data.amount

      if (existInCart) {
        if (stockAmmount < existInCart.amount + 1) {
          toast.error('Quantidade solicitada fora de estoque')
          return
        }

        await updateProductAmount({ productId: existInCart.id, amount: existInCart.amount + 1 })
      } else {
        if (stockAmmount < 1) {
          toast.error('Quantidade solicitada fora de estoque')
          return
        }

        const res = await api.get(`/products/${productId}`)

        const new_cart_array = [...cart, { ...res.data, amount: 1 }]
        updateData(new_cart_array)

        toast(`${res.data.title} foi adicionado ao seu carrinho!`, {
          type: "success",
        })

      }

    } catch {
      toast.error('Erro na adição do produto')

    }
  };

  const removeProduct = (productId: number) => {
    try {

      if (cart.find(item => item.id === productId)) {
        const new_cart_array = cart.filter((item) => item.id !== productId)
        updateData(new_cart_array)
      } else {
        throw Error();
      }

    } catch {
      return toast.error("Erro na remoção do produto")
    }
  };

  const updateProductAmount = async ({
    productId,
    amount
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) return

      const stock = await api.get(`/stock/${productId}`)
      const stockAmount = stock.data.amount
      if (amount > stockAmount) return toast.error('Quantidade solicitada fora de estoque');

      const aux_array = [...cart]
      const indexItem = aux_array.findIndex((item) => item.id === productId)

      if (indexItem != null || indexItem !== undefined) {
        aux_array[indexItem].amount = amount
        updateData(aux_array)
      }


    } catch {
      return toast.error('Erro na alteração de quantidade do produto')
    }
  };


  const updateData = (new_cart_array: Product[]) => {
    setCart(new_cart_array)
    localStorage.setItem("@RocketShoes:cart", JSON.stringify(new_cart_array))
  }



  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
