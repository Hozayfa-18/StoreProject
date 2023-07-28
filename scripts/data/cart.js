import '../packages/uuid.js';
import {MoneyUtils} from '../utils/MoneyUtils.js';
import {deliveryOptions} from './deliveryOptions.js';
import {products} from './products.js';

export class Cart {
  #items;

  constructor() {
    this.loadFromStorage();
  }

  loadFromStorage() {
    this.#items = localStorage.getItem('cart')
      ? JSON.parse(localStorage.getItem('cart'))
      : [];
  }

  get items() {
    return this.#items;
  }

  addProduct(productId, quantity, selectedVariation) {
    quantity = parseInt(quantity, 10);

    const existingCartItem = this.#items.find(cartItem => {
      return cartItem.productId === productId &&
        this.#isSameVariation(cartItem.variation, selectedVariation);
    });

    if (existingCartItem) {
      existingCartItem.quantity += quantity;

    } else {
      this.#items.push({
        id: uuid(),
        productId,
        quantity,
        deliveryOptionId: deliveryOptions.default.id,
        variation: selectedVariation
      });
    }

    this.#saveToStorage();
  }

  calculateTotalQuantity() {
    let totalQuantity = 0;

    this.#items.forEach((cartItem) => {
      totalQuantity += cartItem.quantity;
    });

    return totalQuantity;
  }

  updateDeliveryOption(cartItemId, deliveryOptionId) {
    const cartItem = this.#items.find(cartItem => {
      return cartItem.id === cartItemId;
    });

    cartItem.deliveryOptionId = deliveryOptionId;
    this.#saveToStorage();
  }

  updateQuantity(cartItemId, quantity) {
    const cartItem = this.#items.find(cartItem => {
      return cartItem.id === cartItemId;
    });

    const newQuantity = parseInt(quantity, 10);

    if (newQuantity > 0) {
      cartItem.quantity = newQuantity;
      this.#saveToStorage();

    } else if (newQuantity === 0) {
      const indexToRemove = this.#items.findIndex(cartItem => {
        return cartItem.id === cartItemId
      });

      this.#items.splice(indexToRemove, 1);
      this.#saveToStorage();
    }
  }

  calculateCosts() {
    const productCostCents = this.#calculateProductCost();
    const shippingCostCents = this.#calculateShippingCosts();
    const taxCents = (productCostCents + shippingCostCents) * MoneyUtils.taxRate;
    const totalCents = Math.round(productCostCents + shippingCostCents + taxCents);

    return {
      productCostCents,
      shippingCostCents,
      taxCents,
      totalCents
    };
  }

  reset() {
    this.#items = [];
    this.#saveToStorage();
  }

  isEmpty() {
    return this.#items.length === 0;
  }

  #isSameVariation(variation1, variation2) {
    if (!variation1) variation1 = {};
    if (!variation2) variation2 = {};

    return JSON.stringify(variation1, Object.keys(variation1).sort()) ===
      JSON.stringify(variation2, Object.keys(variation2).sort());
  }

  #calculateProductCost() {
    let productCost = 0;

    this.#items.forEach(cartItem => {
      const product = products.findById(cartItem.productId);
      productCost += product.priceCents * cartItem.quantity;
    });

    return productCost;
  }

  #calculateShippingCosts() {
    let shippingCost = 0;

    this.#items.forEach(cartItem => {
      const deliveryOption = deliveryOptions.findById(cartItem.deliveryOptionId);
      shippingCost += deliveryOption.costCents;
    });

    return shippingCost;
  }

  #saveToStorage() {
    localStorage.setItem(
      'cart',
      JSON.stringify(this.#items)
    );
  }
}

export const cart = new Cart();
