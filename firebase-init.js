var firebaseConfig = {
  apiKey: "AIzaSyBjL-AdZVHBZdsvzqniuPDynk7G3-kH6yU",
  authDomain: "salesscript-87136.firebaseapp.com",
  projectId: "salesscript-87136",
  storageBucket: "salesscript-87136.firebasestorage.app",
  messagingSenderId: "91082261854",
  appId: "1:91082261854:web:73018d6b146d69db6b3bcf"
};
firebase.initializeApp(firebaseConfig);
var auth = firebase.auth();
var db = firebase.firestore();

// 상품 정의 (id: 이름/개별가)
var PRODUCTS = {
  sales:     { name: '고가상품 세일즈 화법 완전정복', price: 79000 },
  personal:  { name: '개인 보험 자료집',              price: 59000 },
  corporate: { name: '법인 보험 자료집',              price: 59000 }
};

// 조합별 판매가 (키는 상품 id를 정렬해서 콤마로 이어붙인 값)
var COMBO_PRICE = {
  'sales': 79000,
  'personal': 59000,
  'corporate': 59000,
  'personal,sales': 119000,
  'corporate,sales': 119000,
  'corporate,personal': 99000,
  'corporate,personal,sales': 149000
};

function comboKey(list){
  return list.slice().sort().join(',');
}

function calcComboPrice(list){
  if(!list || !list.length) return 0;
  var key = comboKey(list);
  if(COMBO_PRICE[key] != null) return COMBO_PRICE[key];
  return list.reduce(function(sum, id){ return sum + (PRODUCTS[id] ? PRODUCTS[id].price : 0); }, 0);
}

// 하위호환용 (예전 코드가 참조할 수 있어 남겨둠)
var PRODUCT_NAME = PRODUCTS.sales.name;
var PRODUCT_AMOUNT = PRODUCTS.sales.price;

// 유저는 주문 1건만 갖고, 추가 구매 시 products 배열에 합쳐서 누적함
function ensureOrder(user, selectedProducts){
  selectedProducts = (selectedProducts && selectedProducts.length) ? selectedProducts : ['sales'];
  var ordersRef = db.collection('orders');
  return ordersRef.where('uid', '==', user.uid).limit(1).get().then(function(snap){
    if(!snap.empty){
      var doc = snap.docs[0];
      var existing = doc.data().products || ['sales'];
      var merged = existing.slice();
      selectedProducts.forEach(function(p){
        if(merged.indexOf(p) === -1) merged.push(p);
      });
      if(merged.length === existing.length){
        return doc;
      }
      return doc.ref.update({
        products: merged,
        productName: merged.map(function(p){ return PRODUCTS[p] ? PRODUCTS[p].name : p; }).join(' + '),
        amount: calcComboPrice(merged),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(function(){ return doc.ref.get(); });
    }
    return ordersRef.add({
      uid: user.uid,
      email: user.email,
      products: selectedProducts,
      productName: selectedProducts.map(function(p){ return PRODUCTS[p] ? PRODUCTS[p].name : p; }).join(' + '),
      amount: calcComboPrice(selectedProducts),
      status: 'completed',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(function(ref){ return ref.get(); });
  });
}

function hasPurchased(uid){
  return db.collection('orders').where('uid', '==', uid).where('status', '==', 'completed').limit(1).get()
    .then(function(snap){ return !snap.empty; });
}

// 유저가 실제로 보유한 상품 id 배열 (예전 주문은 products가 없어 sales로 간주)
function getOwnedProducts(uid){
  return db.collection('orders').where('uid', '==', uid).where('status', '==', 'completed').limit(1).get()
    .then(function(snap){
      if(snap.empty) return [];
      var d = snap.docs[0].data();
      return d.products || (d.productName ? ['sales'] : []);
    });
}

function saveLead(data){
  return db.collection('leads').add({
    name: data.name || '',
    email: data.email || '',
    phone: data.phone || '',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}
