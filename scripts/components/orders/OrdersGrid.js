import {orders} from '../../data/orders.js';
import {cart} from '../../data/cart.js';
import {DateUtils} from '../../utils/DateUtils.js';
import {MoneyUtils} from '../../utils/MoneyUtils.js';
import {products} from '../../data/products.js';
import {Component} from '../Component.js';
import {VariationUtils} from '../../utils/VariationUtils.js';
import {WindowUtils} from '../../utils/WindowUtils.js';

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, set, ref, update, get, child, onValue } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,onAuthStateChanged,signOut,sendEmailVerification } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
      
// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCbxLdLqlUU5odWaPSAU5kQXzlPacm40ig",
    authDomain: "login-with-firebase-data-cfd71.firebaseapp.com",
    databaseURL: "https://login-with-firebase-data-cfd71-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "login-with-firebase-data-cfd71",
    storageBucket: "login-with-firebase-data-cfd71.appspot.com",
    messagingSenderId: "391244779936",
    appId: "1:391244779936:web:a62fa3495790268d4d14c5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth();
const dbRef = ref(database);

export class OrdersGrid extends Component {
  element;

  events = {
    'click .js-buy-again-button':
      (event) => this.#addToCart(event),
    'click .js-track-package-button':
      (event) => this.#trackPackage(event)
  };

  #addedToCartTimeouts = {};
  #storeHeader;

  constructor(selector) {
    super();
    this.element = document.querySelector(selector);
  }

  setStoreHeader(storeHeader) {
    this.#storeHeader = storeHeader;
  }
    
  render() {
    
    let ordersHTML = '';

    orders.all.forEach(order => {
      const orderDate = DateUtils.formatDateMonth(order.orderTimeMs);
      const orderCost = MoneyUtils.formatMoney(order.totalCostCents);

      ordersHTML += `
        <div class="order-container"
          data-testid="order-container-${order.id}">
          <header class="order-header">
            <section class="left-section">
              <div class="order-date">
                <div class="order-header-label">Order Placed:</div>
                <div>${orderDate}</div>
              </div>
              <div class="order-total">
                <div class="order-header-label">Total:</div>
                <div>${orderCost}</div>
              </div>
            </section>

            <section class="right-section">
              <div class="order-header-label">Order ID:</div>
              <div>${order.id}</div>
              <div class="order-header-label">Order Number:</div>
              <div>${order.orderNumber}</div>
            </section>
          </header>

          <div class="order-details-grid">
            ${this.#createOrderDetailsHTML(order)}
          </div>
        </div>
      `;
    });

    this.element.innerHTML = ordersHTML;
  }

  #createOrderDetailsHTML(order) {

    let ordersHTML = '';

    order.products.forEach(productDetails => {
      const product = products.findById(productDetails.productId);
      const productImage = product.createImageUrl(productDetails.variation);

      const deliveryDateMessage = Date.now() < productDetails.estimatedDeliveryTimeMs
        ? `Arriving on: ${DateUtils.formatDateMonth(productDetails.estimatedDeliveryTimeMs)}`
        : `Delivered on: ${DateUtils.formatDateMonth(productDetails.estimatedDeliveryTimeMs)}`;

      ordersHTML += `
        <div class="product-image-container">
          <img src="${productImage}">
        </div>

        <div class="product-details">
          <div class="product-name">
            ${product.name}
          </div>

          <div class="product-delivery-date">
            ${deliveryDateMessage}
          </div>

          ${VariationUtils.createVariationInfoHTML(productDetails.variation)}

          <div class="product-quantity">
            Quantity: ${productDetails.quantity}
          </div>

          <button class="js-buy-again-button buy-again-button button-primary"
            data-order-id="${order.id}"
            data-cart-item-id="${productDetails.cartItemId}"
            data-testid="buy-again-button-${productDetails.cartItemId}">

            <img class="buy-again-icon" src="../../../icons/buy-again.png">
            <span class="buy-again-message">Buy it again</span>

            <span class="buy-again-success">
              &#10003; Added
            </span>
          </button>
        </div>

        <div class="product-actions">
          <button class="js-track-package-button
            track-package-button button-secondary"
            data-order-id="${order.id}"
            data-order-number="${order.orderNumber}"
            data-cart-item-id="${productDetails.cartItemId}"
            data-testid="track-package-${productDetails.cartItemId}">
            Track package
          </button>
        </div>
      `;
    });

    return ordersHTML;
  }
  
  #addToCart(event) {
    // Add item to cart.
    const button = event.currentTarget;
    const orderId = button.getAttribute('data-order-id');
    const cartItemId = button.getAttribute('data-cart-item-id');

    const order = orders.findById(orderId);
    const productDetails = order.findProductDetails(cartItemId);
    cart.addProduct(productDetails.productId, 1, productDetails.variation);

    this.#storeHeader?.updateCartCount();

    // Show added to cart message.
    button.classList.add('added-to-cart');

    const previousTimeoutId = this.#addedToCartTimeouts[orderId + cartItemId];
    if (previousTimeoutId) {
      clearTimeout(previousTimeoutId);
    }

    const timeoutId = setTimeout(() => {
      button.classList.remove('added-to-cart');
    }, 1500);

    this.#addedToCartTimeouts[orderId + cartItemId] = timeoutId;
  }

  #trackPackage(event) {
    const button = event.currentTarget;
    const orderId = button.getAttribute('data-order-id');
    const orderNumber = button.getAttribute('data-order-number');
    const cartItemId = button.getAttribute('data-cart-item-id');

    WindowUtils.setHref(`tracking.html?orderId=${orderId}&cartItemId=${cartItemId}&orderNum=${orderNumber}`);
  }
}
