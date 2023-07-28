import {orders} from '../../data/orders.js';
import {products} from '../../data/products.js';
import {DateUtils} from '../../utils/DateUtils.js';
import {WindowUtils} from '../../utils/WindowUtils.js';
import {ComponentV2} from '../ComponentV2.js';
import {VariationUtils} from '../../utils/VariationUtils.js';

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


export class OrderTracking extends ComponentV2 {
  render() {
    function getKeyByValue(object, value,orderNumber) {
      return Object.keys(object).find(key => object[key] === value);
  }
  function getValueByKey(object,key) {
    return object[key];
  }
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/auth.user
        const uid = user.uid;
        const arr = [];
        const urlSearchParams = new URLSearchParams(WindowUtils.getSearch());
        const orderId = urlSearchParams.get('orderId');
        const cartItemId = urlSearchParams.get('cartItemId');
        const orderNumber = urlSearchParams.get('orderNum');
        get(child (dbRef, `users/` + uid )).then((snapshot) => {
          if (snapshot.exists()) {
            arr.push(snapshot.val());
            const fname = arr[0].first_name;
            const discordname = arr[0].last_name;
            const email = arr[0].email;
  
            let value = getValueByKey(arr[0].trackingNumber,orderNumber || '')
            const trackingNumber = value
            //console.log(trackingNumber)
            
            

            
    

    const order = orders.findById(orderId);
    if (!order) {
      this.#renderNotFoundMessage();
      return;
    }

    const productDetails = order.findProductDetails(cartItemId);
    if (!productDetails) {
      this.#renderNotFoundMessage();
      return;
    }

    const estimatedDeliveryTimeMs = productDetails.estimatedDeliveryTimeMs;
    const deliveryDateMessage = Date.now() < estimatedDeliveryTimeMs
      ? `Arriving on ${DateUtils.formatDateWeekday(estimatedDeliveryTimeMs)}`
      : `Delivered on ${DateUtils.formatDateWeekday(estimatedDeliveryTimeMs)}`;

    const product = products.findById(productDetails.productId);
    const productImage = product.createImageUrl(productDetails.variation);

    const progressPercent = this.#getProgressPercent(productDetails, order);
    const status = this.#getDeliveryStatus(progressPercent);
    

    this.element.innerHTML = `
      <a href="orders.html">
        <button class="back-to-orders-link button-primary" >
          View all orders
        </button>
      </a>

      <div class="delivery-date" data-testid="delivery-date-message">
        ${deliveryDateMessage}
      </div>

      <div class="product-info" data-testid="product-name">
        ${product.name}
      </div>

      ${VariationUtils.createVariationInfoHTML(productDetails.variation)}

      <div class="product-info">
        Quantity: ${productDetails.quantity}
      </div>

      <img class="product-image" src="${productImage}">

      <div class="progress-labels-container">
        <div class="progress-label
          ${status === 'Preparing' ? 'current-status-label': ''}"
          ${status === 'Preparing' ? 'data-testid="current-status"': ''}>
          Preparing
        </div>
        
      </div>

      <div class="progress-bar-container">
        <div class="js-progress-bar progress-bar"
          data-testid="progress-bar"></div>
      </div>
      <br>
      <br>

      <div class="temporary-text">
        <p> the tracking number will appear once the prepairaition phase is over </p>
        <p>Tracking Number: <span style="color:blue;">${trackingNumber}<span></p>
        <p> ${orderNumber} </p>
        
      </div>
      <br>
      <a href="https://www.dhl.de/de/privatkunden/dhl-sendungsverfolgung.html">
        <button class="back-to-orders-link button-primary" >
          Track your order
        </button>
      </a>
      <div class="returns">
        <p>In case of a return you can send it to the following address:</p>
        <p>Heine-Heinrich-Weg 49</p>
        <p>46569</p>
        <p>Dinslaken</p>
      </div>

    `;
    
    setTimeout(() => {
      this.element.querySelector('.js-progress-bar')
        .style.width = `${progressPercent}%`;
    }, 300);
            
    
          } else {
              console.log("No data available");
          }
          }).catch((error) => {
              console.error(error);
          });
      } 
      else {
          // User is signed out
           alert('oh no');
      }
  });
    
    
  }

  #renderNotFoundMessage() {
    this.element.innerHTML = `
      <div data-testid="not-found-message">
        Tracking information not found.
      </div>
    `;
  }

  #getProgressPercent(productDetails, order) {
    const totalShippingTime = productDetails.estimatedDeliveryTimeMs - order.orderTimeMs;
    const timeSinceOrdered = Date.now() - order.orderTimeMs;

    let progressPercent = timeSinceOrdered / totalShippingTime * 100;

    if (progressPercent <= 5) {
      progressPercent = 5;
    } else if (progressPercent >= 100) {
      progressPercent = 100;
    }

    return Math.ceil(progressPercent);
  }

  #getDeliveryStatus(progressPercent) {
    
    if (progressPercent !== 100) {
      return 'Preparing'
    } else if (progressPercent > 50) {
      return 'Preparing';
    } else  {
      return 'Preparing';
    }
  }
}
