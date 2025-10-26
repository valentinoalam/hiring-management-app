export const convertCurrency = (currencyValue: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR"
    }).format(currencyValue);
};