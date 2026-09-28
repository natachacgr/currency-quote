export interface FavoriteCurrency {
  id: string;
  userId: string;
  currencyId: string;
  createdAt: string;
  currency: {
    id: string;
    code: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  };
}
