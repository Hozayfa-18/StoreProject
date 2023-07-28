import '../packages/uuid.js';
import '../packages/addressMap.js';
import { DateUtils } from '../utils/DateUtils.js';
import {MoneyUtils} from '../utils/MoneyUtils.js';
import {deliveryOptions} from './deliveryOptions.js';
import {products} from './products.js';

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, set, ref, update, get, child, onValue } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,onAuthStateChanged,signOut,sendEmailVerification } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { strassenMap } from '../packages/addressMap.js';


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



export class Order {
  #id;
  #orderTimeMs;
  #totalCostCents;
  #products;
  #orderNumber;
  

  constructor(args) {
    this.#id = args.id;
    this.#orderTimeMs = args.orderTimeMs;
    this.#totalCostCents = args.totalCostCents;
    this.#products = args.products;
    this.#orderNumber = args.orderNumber;
    
  }

  get id() { return this.#id; }
  get orderTimeMs() { return this.#orderTimeMs; }
  get totalCostCents() { return this.#totalCostCents; }
  get products() { return this.#products; }
  get orderNumber() { return this.#orderNumber; }
  

  findProductDetails(cartItemId) {
    return this.#products.find(product => {
      return product.cartItemId === cartItemId;
    });
  }

  toJSON() {
    return {
      id: this.#id,
      orderTimeMs: this.#orderTimeMs,
      totalCostCents: this.#totalCostCents,
      products: this.#products,
      orderNumber: this.#orderNumber
      
    };
  }
}

export class OrderList {
  #orders;

  constructor() {
    this.loadFromStorage();
  }

  get all() { return this.#orders; }

  findById(id) {
    return this.#orders.find(order => {
      return order.id === id;
    });
  }

  


  createNewOrder(cart) {
    const strasse = document.querySelector('.strasse').value;
    const stadt = document.querySelector('.stadt').value;
    const plz = document.querySelector('.plz').value;

    const strassen = strassenMap;
    //console.log(strassen)
    if(!strassen.has(strasse)) return;
    //console.log(strassen.get(strasse))
    if(strassen.get(strasse) != plz) return;

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/auth.user
        const uid = user.uid;

    if (cart.isEmpty()) return;

    let orderNumber =0;
        orderNumber=JSON.parse(localStorage.getItem('orderNumber'));
        ++orderNumber;
    const id = uuid();
    
    const orderTimeMs = Date.now();
    const prodId = [];
    const prodName = [];
    const prodQuantity = [];
    
    let prodImg;

    // Calculate costs.
    let productCostCents = 0;
    let shippingCostCents = 0;
    let productPriceSingle = 0;

    // Create product details.
    const productDetailsList = [];
    const productseliveryDateList = [];

    
    cart.items.forEach(cartItem => {
      const product = products.findById(cartItem.productId, products);
      productCostCents += product.priceCents * cartItem.quantity;
      productPriceSingle = product.priceCents;
      
      const deliveryOption = deliveryOptions.findById(cartItem.deliveryOptionId);
      shippingCostCents += deliveryOption.costCents;
    });

    const taxCents = (productCostCents + shippingCostCents) *
      MoneyUtils.taxRate;
      
    const totalCostCentsBeforeTax = Math.round(
      productCostCents + shippingCostCents
    );

    const totalCostCents = Math.round(
      productCostCents + shippingCostCents + taxCents
    );
    const totalCost = MoneyUtils.formatMoney(totalCostCents);
    
    
    let index=0;
    cart.items.forEach(cartItem => {
      const deliveryOption = deliveryOptions.findById(
        cartItem.deliveryOptionId
      );

      productDetailsList.push({
        cartItemId: cartItem.id,
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        
        
        estimatedDeliveryTimeMs: deliveryOption
          .calculateDeliveryDate()
          .getTime(),
        variation: cartItem.variation
      });
      productseliveryDateList.push(DateUtils.formatDateYear(productDetailsList[index].estimatedDeliveryTimeMs))
      ++index;
    });
    


    const newOrder = new Order({
      id,
      orderTimeMs,
      totalCostCents,
      products: productDetailsList,
      orderNumber
    });
     
      
      const orderDate = DateUtils.formatDateYear(orderTimeMs);
      const straßHausnummer = document.querySelector('.strasse').value;
      const stadt = document.querySelector('.stadt').value;
      const plz = document.querySelector('.plz').value;
      const totalCostBEforeTax = MoneyUtils.formatMoney(totalCostCentsBeforeTax);
      const totalTax = MoneyUtils.formatMoney(taxCents);
      let productName;
      let productQuantity;
      let tableRow ='';
      
      cart.items.forEach(cartItem => {
        const product = products.findById(cartItem.productId, products);
        prodId.push(product.id + ' ');
        prodName.push(product.name + ' ');
        prodQuantity.push(cartItem.quantity + ' ');
        prodImg = product.createImageUrl(cartItem.variation, products);
        productCostCents += product.priceCents * cartItem.quantity;
        productPriceSingle = product.priceCents;
        const productPrice = MoneyUtils.formatMoney(productPriceSingle);
        
        
        prodName.forEach(productN =>{
          productName = productN;
        });

        prodQuantity.forEach(productQ =>{
          productQuantity = productQ;
        });
        
        const productPriceTotal = MoneyUtils.formatMoney(productPriceSingle * productQuantity);

        tableRow +=`
        <tr>
          <td>${productName}</td>
          
          <td class="text-center">${productPrice}</td>
          
          <td class="text-center">${productQuantity}</td>
          
          <td class="text-right">${productPriceTotal}</td>
        </tr>
      `; 
      document.getElementsByClassName('table-row').innerHTML = tableRow;
      });
      
       
       
        update(ref(database, 'users/' + uid ),{
            orderCount: orderNumber,
            ['orders'+orderNumber+'/'+'orderId']:id,
            ['orders'+orderNumber+'/'+'orderTimeMs']:orderDate,
            ['orders'+orderNumber+'/'+'orderTotalPrice']:totalCost,
            ['orders'+orderNumber+'/'+'address'+'/'+'straßHausnummer']:straßHausnummer,
            ['orders'+orderNumber+'/'+'address'+'/'+'stadt']:stadt,
            ['orders'+orderNumber+'/'+'address'+'/'+'plz']:plz,
            ['orders'+orderNumber+'/'+'productDetails'+'/'+ 'productId']:prodId,
            ['orders'+orderNumber+'/'+'productDetails'+'/'+ 'productName']:prodName,
            ['orders'+orderNumber+'/'+'productDetails'+'/'+ 'productQuantity']:prodQuantity,
            ['orders'+orderNumber+'/'+'productDetails'+'/'+ 'deliveryDate']:productseliveryDateList,
            ['trackingNumber'+'/'+ orderNumber]:'',
            ['returns'+'/'+orderNumber]:''
          
        });
        const arr = [];
        get(child (dbRef, `users/` + uid )).then((snapshot) => {
          if (snapshot.exists()) {
            arr.push(snapshot.val()); 
            const fname = arr[0].first_name;
            const discordname = arr[0].last_name;
            const email = arr[0].email; 
            

      let ebody = `
      <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice</title>
          <link rel="stylesheet" href="invoice.css">
        </head>
        <body>
          <div class="container">
                  <div class="row">
                      <div class="col-xs-12">
                          <div class="invoice-title">
                              <h2>Invoice</h2><h3 class="pull-right">Order Id ${id}</h3>
                          </div>
                          <hr>
                          <div class="row">
                              <div class="col-xs-6">
                                  <address>
                                  <strong>Billed To:</strong><br>
                                      ${fname} ${discordname}<br>
                                      ${straßHausnummer}<br>
                                      ${stadt}<br>
                                      ${plz}
                                  </address>
                              </div>
                              <div class="col-xs-6 text-right">
                                  <address>
                                  <strong>Shipped To:</strong><br>
                                      ${fname}<br>
                                      ${straßHausnummer}<br>
                                      ${stadt}<br>
                                      ${plz}
                                  </address>
                              </div>
                          </div>
                          <div class="row">
                              <div class="col-xs-6">
                                  <address>
                                      <strong>Payment Email:</strong><br>
                                      ${email}<br>
                                      
                                  </address>
                              </div>
                              <div class="col-xs-6 text-right">
                                  <address>
                                      <strong>Order Date:</strong><br>
                                      ${orderDate}<br><br>
                                  </address>
                              </div>
                          </div>
                      </div>
                  </div>
                  
                  <div class="row">
                      <div class="col-md-12">
                          <div class="panel panel-default">
                              <div class="panel-heading">
                                  <h3 class="panel-title"><strong>Order summary</strong></h3>
                              </div>
                              <div class="panel-body">
                                  <div class="table-responsive">
                                      <table class="table table-condensed">
                                          <thead>
                                              <tr>
                                                  <td><strong>Item</strong></td>
                                                  <td class="text-center"><strong>Price</strong></td>
                                                  <td class="text-center"><strong>Quantity</strong></td>
                                                  <td class="text-right"><strong>Totals</strong></td>
                                              </tr>
                                          </thead>
                                          <tbody class="table-row">
                                               
                                              ${tableRow}
                                              <tr>
                                                  <td class="thick-line"></td>
                                                  <td class="thick-line"></td>
                                                  <td class="thick-line text-center"><strong>Subtotal</strong></td>
                                                  <td class="thick-line text-right">${totalCostBEforeTax}</td>
                                              </tr>
                                              <tr>
                                                  <td class="no-line"></td>
                                                  <td class="no-line"></td>
                                                  <td class="no-line text-center"><strong>Estimated tax(10%)</strong></td>
                                                  <td class="no-line text-right">${totalTax}</td>
                                              </tr>
                                              <tr>
                                                  <td class="no-line"></td>
                                                  <td class="no-line"></td>
                                                  <td class="no-line text-center"><strong>Total</strong></td>
                                                  <td class="no-line text-right">${totalCost}</td>
                                              </tr>
                                          </tbody>
                                      </table>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
        </body>
      </html>

      
      
      `
  
      Email.send({
          Host : "smtp.elasticemail.com",
          Username : "hozayfa2020h@gmail.com",
          Password : "D0C5A0CAFE65AD6F92BFCFFF3C6B6966ACD4",
          To : [email,'hozayfa2020h@gmail.com','osamadibstore@gmail.com'],
          From : 'hozayfa2020h@gmail.com',
          Subject : "Email form Hozayfa",
          Body : ebody
      }).then(
        message => alert(message)
      );
  /* 
      Email.send({
        Host : "smtp.elasticemail.com",
        Username : "osamadibstore@gmail.com" ,
        Password : "62B63636E9D4179DF1425B900B12C8099705",
        To : "osamadibstore@gmail.com",
        From : "osamadibstore@gmail.com",
        Subject : "Email form " + email,
        Body : ebody
    }).then(
      message => alert(message)
    );*/

    this.#orders.unshift(newOrder);
    localStorage.setItem('orderNumber', JSON.stringify(orderNumber));
    this.#saveToStorage();
    

    cart.reset();
    
    alert('payment success')
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

  loadFromStorage() {
    const ordersJSON = localStorage.getItem('orders');

    this.#orders = ordersJSON
      ? JSON.parse(ordersJSON).map(JSON => new Order(JSON))
      : [];
  }

  #saveToStorage() {
    
    localStorage.setItem('orders', JSON.stringify(this.#orders));
  }
}

export const orders = new OrderList();
